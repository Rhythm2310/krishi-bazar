#!/usr/bin/env python3
"""Validate a Jules swarm plan: collisions, wave logic, limits.

Usage:
  python validate_plan.py --tasks .jules/tasks.csv --ownership .jules/ownership.csv \
      [--skills .jules/skills.csv] [--deps .jules/deps.csv] [--root .] [--max-concurrent 7] \
      [--plan-concurrent 15] [--daily-limit 100]
Exit code 1 if any ERROR. Stdlib only.
"""
import argparse
import csv
import fnmatch
import glob
import os
import re
import sys
from functools import lru_cache

RESERVED = ["AGENTS.md", ".jules/tasks/**", ".jules/tasks.csv", ".jules/ownership.csv",
            ".jules/skills.csv", ".jules/deps.csv", ".jules/tools/**", ".jules/plan.md",
            ".agents/skills/**", "GLOSSARY.md", "CONTEXT.md", ".jules/spec.md", ".jules/swarm.json"]
SOFT_RESERVED = ["docs/adr/**"]
MODES = {"foundation", "feature", "refactor", "integrate", "docs", "review", "fix", "amendment"}
CODE_MODES = {"foundation", "feature", "refactor", "fix", "integrate"}
TASK_COLS = ["task_id", "wave", "title", "slug", "model", "owns", "reads",
             "depends_on", "skills", "size", "mode"]
OWN_COLS = ["pattern", "class", "owner_task", "notes"]
DEP_COLS = ["ecosystem", "package", "version", "role", "status", "checked_on", "source"]
SKILL_COLS = ["skill", "source", "install_path", "applies_to", "enabled"]
DEP_STATUS = {"stable", "unverified"}
PRERELEASE = re.compile(r"(alpha|beta|rc|canary|nightly|next|dev|snapshot|preview|pre|exp|insiders?)", re.I)
RANGE_CHARS = re.compile(r"[\^~*<>=|xX]|latest")
CLASSES = {"hot", "contract", "generated"}
ID_RE = re.compile(r"^T\d{2,3}$")
WILD = set("*?[")


def split(v):
    return [x.strip() for x in (v or "").split(";") if x.strip()]


def norm(p):
    p = p.replace("\\", "/").strip()
    while p.startswith("./"):
        p = p[2:]
    if p.endswith("/"):
        p += "**"
    return p


def has_wild(s):
    return any(c in WILD for c in s)


def _prefix(s):
    for i, c in enumerate(s):
        if c in WILD:
            return s[:i]
    return s


def _suffix(s):
    for i in range(len(s) - 1, -1, -1):
        if s[i] in WILD:
            return s[i + 1:]
    return s


def seg_intersect(a, b):
    if not has_wild(a):
        return fnmatch.fnmatchcase(a, b)
    if not has_wild(b):
        return fnmatch.fnmatchcase(b, a)
    pa, pb, sa, sb = _prefix(a), _prefix(b), _suffix(a), _suffix(b)
    return (pa.startswith(pb) or pb.startswith(pa)) and (sa.endswith(sb) or sb.endswith(sa))


def globs_intersect(g1, g2):
    A = tuple(norm(g1).split("/"))
    B = tuple(norm(g2).split("/"))

    @lru_cache(maxsize=None)
    def go(i, j):
        if i == len(A) and j == len(B):
            return True
        if i == len(A):
            return all(s == "**" for s in B[j:])
        if j == len(B):
            return all(s == "**" for s in A[i:])
        a, b = A[i], B[j]
        if a == "**" or b == "**":
            return go(i + 1, j) or go(i, j + 1)
        return seg_intersect(a, b) and go(i + 1, j + 1)

    return go(0, 0)


def any_intersect(list_a, list_b):
    for x in list_a:
        for y in list_b:
            if globs_intersect(x, y):
                return x, y
    return None


def read_csv(path):
    if not os.path.exists(path):
        return None
    with open(path, newline="", encoding="utf-8") as f:
        rows = []
        for r in csv.DictReader(f):
            first = (list(r.values())[0] or "").strip()
            if first and not first.startswith("#"):
                rows.append(r)
    return rows


def check_deps(path, E, W, N):
    rows = read_csv(path) or []
    if not rows:
        W("deps.csv has no rows. Fine only if the plan installs no packages.")
        return
    miss = [c for c in DEP_COLS if c not in rows[0]]
    if miss:
        E(f"deps.csv missing columns {miss}")
        return
    seen = set()
    for r in rows:
        eco, pkg = r["ecosystem"].strip().lower(), r["package"].strip()
        ver, st = r["version"].strip(), r["status"].strip().lower()
        key = (eco, pkg)
        tag = f"dep {eco}:{pkg}"
        if key in seen:
            E(f"{tag}: duplicate row")
        seen.add(key)
        if st not in DEP_STATUS:
            E(f"{tag}: status '{st}' must be one of {sorted(DEP_STATUS)} (deprecated packages never go in the plan; "
              "record them in notes as 'replaces')")
        if not ver:
            E(f"{tag}: version is empty")
            continue
        if RANGE_CHARS.search(ver):
            E(f"{tag}: version '{ver}' is a range or tag. Pin an exact stable version.")
        elif PRERELEASE.search(ver):
            E(f"{tag}: version '{ver}' looks like a pre-release. Use the latest stable.")
        if st == "unverified":
            W(f"{tag}: UNVERIFIED. Run scripts/verify_deps.py or research it before emitting.")
        elif not r["checked_on"].strip() or not r["source"].strip():
            E(f"{tag}: stable rows need checked_on (date) and source (URL or registry)")
    N(f"deps.csv: {len(rows)} package(s) checked for pinning and status")


def parse_spec(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    seams = set(re.findall(r"(?m)^\s*(?:[-*]\s*)?\**(S\d+)\**\s*[:\u2014-]", text))
    stories = set(re.findall(r"(?m)^\s*(?:\d+\.|[-*])\s*\**(U\d+)\**\s*[:\u2014-]", text))
    return seams, stories


def section(text, heading):
    m = re.search(r"(?ms)^##\s+" + re.escape(heading) + r"\s*$(.*?)(?=^##\s|\Z)", text)
    return m.group(1) if m else None


def check_quality_kit(by_id, known_enabled, E, W, N, has_seams_col, spec_seams):
    kit = "tdd" in known_enabled
    modes = {t["mode"].strip() for t in by_id.values()}
    for tid, t in by_id.items():
        mode = t["mode"].strip()
        if mode and mode not in MODES:
            W(f"{tid}: mode '{mode}' is not one of {sorted(MODES)}")
        have = set(split(t["skills"]))
        if kit:
            need = {"foundation": ["tdd", "code-review", "pr"], "feature": ["tdd", "code-review", "pr"],
                    "refactor": ["tdd", "code-review", "pr"], "integrate": ["tdd", "code-review", "pr"],
                    "fix": ["diagnosing-bugs", "tdd", "code-review", "pr"],
                    "review": ["code-review"]}.get(mode, [])
            for s_ in need:
                if s_ not in have:
                    W(f"{tid}: {mode}-mode task does not list kit skill '{s_}'")
        if mode == "review":
            if not t["_deps"]:
                W(f"{tid}: review task has empty depends_on; it must depend on every code task it reviews")
            for o in t["_owns"]:
                if not o.startswith(".jules/reports/"):
                    E(f"{tid}: review task owns '{o}'. A review task owns only its report under .jules/reports/")
        if has_seams_col:
            seams = [x for x in split(t.get("seams", "")) if not x.lower().startswith("n/a")]
            if mode in CODE_MODES and not seams and not (t.get("seams", "").strip().lower().startswith("n/a")):
                W(f"{tid}: {mode}-mode task lists no seams. Give seam ids from the spec, or 'n/a: reason'.")
            for sid in seams:
                if spec_seams is not None and sid not in spec_seams:
                    E(f"{tid}: seam '{sid}' is not defined in the spec's Testing Decisions")
    if kit and modes & CODE_MODES and "review" not in modes:
        W("quality kit is on but the plan has no review-mode task in its last wave (references/13-quality-gates.md)")
    if not has_seams_col and kit:
        W("tasks.csv has no 'seams' column; add it so agents test only at pre-agreed seams")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tasks", required=True)
    ap.add_argument("--ownership", required=True)
    ap.add_argument("--skills")
    ap.add_argument("--deps", help="path to .jules/deps.csv (dependency research ledger)")
    ap.add_argument("--spec", help="path to .jules/spec.md (seam and story ids)")
    ap.add_argument("--root")
    ap.add_argument("--max-concurrent", type=int, default=7)
    ap.add_argument("--plan-concurrent", type=int)
    ap.add_argument("--daily-limit", type=int)
    a = ap.parse_args()

    errors, warns, notes = [], [], []
    E, W, N = errors.append, warns.append, notes.append

    tasks = read_csv(a.tasks)
    own = read_csv(a.ownership)
    if tasks is None:
        sys.exit(f"ERROR: missing {a.tasks}")
    own = own or []
    if tasks:
        miss = [c for c in TASK_COLS if c not in tasks[0]]
        if miss:
            sys.exit(f"ERROR: tasks.csv missing columns {miss}")
    if own:
        miss = [c for c in OWN_COLS if c not in own[0]]
        if miss:
            sys.exit(f"ERROR: ownership.csv missing columns {miss}")

    by_id = {}
    for t in tasks:
        tid = t["task_id"].strip()
        if not ID_RE.match(tid):
            E(f"{tid}: task_id must look like T01 or T001")
        if tid in by_id:
            E(f"{tid}: duplicate task_id")
        by_id[tid] = t
        t["task_id"] = tid
        try:
            t["_wave"] = int(t["wave"])
        except ValueError:
            E(f"{tid}: wave must be an integer")
            t["_wave"] = -1
        t["_owns"] = [norm(x) for x in split(t["owns"])]
        t["_reads"] = [norm(x) for x in split(t["reads"])]
        t["_deps"] = split(t["depends_on"])
        if not t["model"].strip():
            E(f"{tid}: model is empty (use the user's choice, or 'default')")
        if not t["_owns"]:
            E(f"{tid}: owns is empty (every task must own at least one path)")
        size = t["size"].strip()
        if size not in ("S", "M", "L"):
            E(f"{tid}: size must be S, M or L")
        elif size == "L":
            W(f"{tid}: size L. Split it unless it is one indivisible change.")
        for o in t["_owns"]:
            if o in ("**", "*", "/**"):
                E(f"{tid}: owns '{o}' is repo-wide. Scope it to a directory.")
            hit = any_intersect([o], RESERVED)
            if hit and t["mode"].strip() != "foundation":
                E(f"{tid}: owns '{o}' touches reserved path '{hit[1]}' (architect-only)")
            soft = any_intersect([o], SOFT_RESERVED)
            if soft and t["mode"].strip() != "foundation":
                W(f"{tid}: owns '{o}' overlaps '{soft[1]}' (ADRs are architect-owned). Scope the task to docs/guides/** or similar.")

    for tid, t in by_id.items():
        for d in t["_deps"]:
            if d not in by_id:
                E(f"{tid}: depends_on unknown task {d}")
            elif by_id[d]["_wave"] >= t["_wave"]:
                E(f"{tid}: depends_on {d} but {d} is not in an earlier wave")

    state = {}

    def dfs(x, stack):
        state[x] = 1
        for d in by_id.get(x, {}).get("_deps", []):
            if d not in by_id:
                continue
            if state.get(d) == 1:
                E("dependency cycle: " + " -> ".join(stack + [x, d]))
            elif state.get(d) is None:
                dfs(d, stack + [x])
        state[x] = 2

    for tid in by_id:
        if state.get(tid) is None:
            dfs(tid, [])

    waves = {}
    for tid, t in by_id.items():
        waves.setdefault(t["_wave"], []).append(tid)
    for w, ids in sorted(waves.items()):
        if len(ids) > a.max_concurrent:
            E(f"wave {w}: {len(ids)} tasks exceeds max concurrent {a.max_concurrent}. Split into sub-waves.")
        if a.plan_concurrent and len(ids) > a.plan_concurrent:
            E(f"wave {w}: {len(ids)} tasks exceeds Jules plan concurrency {a.plan_concurrent}")
        if w == min(waves) and len(ids) > 2 and any(by_id[i]["mode"].strip() == "foundation" for i in ids):
            W(f"wave {w}: foundation wave has {len(ids)} tasks. Keep foundation to 1-2.")
        if 0 < len(ids) < 3 and w not in (min(waves), max(waves)):
            N(f"wave {w}: only {len(ids)} agent(s). Check whether more work can run in parallel.")
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                ti, tj = by_id[ids[i]], by_id[ids[j]]
                hit = any_intersect(ti["_owns"], tj["_owns"])
                if hit:
                    E(f"COLLISION wave {w}: {ids[i]} owns '{hit[0]}' overlaps {ids[j]} owns '{hit[1]}'")
                for x, y in ((ti, tj), (tj, ti)):
                    hit = any_intersect(x["_reads"], y["_owns"])
                    if hit:
                        W(f"wave {w}: {x['task_id']} reads '{hit[0]}' which same-wave {y['task_id']} owns ('{hit[1]}'). Semantic collision risk.")
    if a.daily_limit and len(by_id) > a.daily_limit:
        E(f"{len(by_id)} tasks exceed daily limit {a.daily_limit}. Reserve headroom for CI-fix and replans.")
    elif a.daily_limit and len(by_id) > 0.7 * a.daily_limit:
        W(f"{len(by_id)} tasks use over 70% of daily limit {a.daily_limit}")

    for r in own:
        pat, cls, owner = norm(r["pattern"]), r["class"].strip(), r["owner_task"].strip()
        if cls not in CLASSES:
            E(f"ownership '{pat}': class must be one of {sorted(CLASSES)}")
        if not owner:
            E(f"ownership '{pat}': owner_task required")
            continue
        if owner not in by_id:
            E(f"ownership '{pat}': owner_task {owner} unknown")
            continue
        if not any_intersect([pat], by_id[owner]["_owns"]):
            E(f"ownership '{pat}': owner {owner} does not list it in owns")
        for tid, t in by_id.items():
            if tid != owner and any_intersect([pat], t["_owns"]):
                E(f"{tid}: owns a path overlapping {cls} pattern '{pat}' owned by {owner}")
            if (cls == "contract" and tid != owner and t["_wave"] == by_id[owner]["_wave"]
                    and any_intersect([pat], t["_reads"])):
                W(f"{tid}: reads contract '{pat}' in the same wave it is authored by {owner}")

    if a.deps:
        check_deps(a.deps, E, W, N)
    elif a.root and os.path.exists(os.path.join(a.root, ".jules", "deps.csv")):
        check_deps(os.path.join(a.root, ".jules", "deps.csv"), E, W, N)
    else:
        N("no deps.csv checked. Every plan that installs packages needs one (references/10).")

    if a.skills:
        sk = read_csv(a.skills) or []
        known = {r["skill"].strip() for r in sk if r.get("skill")}
        if sk:
            miss = [c for c in SKILL_COLS if c not in sk[0]]
            if miss:
                E(f"skills.csv missing columns {miss}")
        used = set()
        for t in by_id.values():
            used.update(split(t["skills"]))
        for r in sk:
            name = (r.get("skill") or "").strip()
            path = (r.get("install_path") or "").strip()
            on = (r.get("enabled") or "").strip().lower() == "yes"
            if on and not path.startswith(".agents/skills/"):
                E(f"skill '{name}': install_path must start with .agents/skills/")
            if on and name not in used:
                W(f"skill '{name}' is enabled but no task lists it")
            if on and a.root and not os.path.exists(os.path.join(a.root, path)):
                E(f"skill '{name}': {path} missing from repo")
        for tid, t in by_id.items():
            for s in split(t["skills"]):
                if s not in known:
                    E(f"{tid}: skill '{s}' not declared in skills.csv")
    else:
        for tid, t in by_id.items():
            if split(t["skills"]):
                E(f"{tid}: lists skills but no --skills file given")

    known_enabled = set()
    if a.skills:
        for r in (read_csv(a.skills) or []):
            if (r.get("enabled") or "").strip().lower() == "yes" and r.get("skill"):
                known_enabled.add(r["skill"].strip())
    spec_path = a.spec or (os.path.join(a.root, ".jules", "spec.md") if a.root else None)
    spec_seams = spec_stories = None
    if spec_path and os.path.exists(spec_path):
        spec_seams, spec_stories = parse_spec(spec_path)
        if not spec_seams:
            W("spec has no seams (expected lines like '- **S1**: name: what is observable')")
        if not spec_stories:
            W("spec has no user stories (expected lines like '1. **U1**: As a ...')")
    elif "tdd" in known_enabled:
        W("quality kit is on but no .jules/spec.md was found (Phase 2 of the workflow)")
    check_quality_kit(by_id, known_enabled, E, W, N, bool(tasks) and "seams" in tasks[0], spec_seams)

    if a.root:
        for tid, t in by_id.items():
            found = glob.glob(os.path.join(a.root, ".jules", "tasks", f"{tid}-*.md"))
            if not found:
                E(f"{tid}: missing .jules/tasks/{tid}-*.md")
                continue
            with open(found[0], encoding="utf-8") as f:
                body = f.read()
            ph = re.findall(r"\{\{[^}]*\}\}", re.sub(r"(?s)<!--.*?-->", "", body))
            if ph:
                E(f"{tid}: task file has unfilled placeholder(s) {sorted(set(ph))[:3]}")
            acc = section(body, "Acceptance criteria")
            if acc is None:
                E(f"{tid}: task file has no '## Acceptance criteria' section")
            elif "`" not in acc:
                W(f"{tid}: acceptance criteria contain no command in backticks; each criterion must be checkable")
            if "tdd" in known_enabled and t["mode"].strip() in CODE_MODES:
                if "Seams under test" not in body:
                    W(f"{tid}: task file has no 'Seams under test' line")
            if "tdd" in known_enabled and "## Context pointers" not in body:
                W(f"{tid}: task file has no '## Context pointers' section")
        for rel in ("AGENTS.md", ".jules/spec.md", "GLOSSARY.md", "CONTEXT.md"):
            fp = os.path.join(a.root, rel)
            if os.path.exists(fp):
                with open(fp, encoding="utf-8") as f:
                    ph = re.findall(r"\{\{[^}]*\}\}", re.sub(r"(?s)<!--.*?-->", "", f.read()))
                if ph:
                    E(f"{rel}: unfilled placeholder(s) {sorted(set(ph))[:3]}")
        if "tdd" in known_enabled:
            if not (os.path.exists(os.path.join(a.root, "GLOSSARY.md")) or os.path.exists(os.path.join(a.root, "CONTEXT.md"))):
                W("quality kit is on but neither GLOSSARY.md nor CONTEXT.md exists")
            if not os.path.exists(os.path.join(a.root, ".jules", "tools", "slop_guard.py")):
                W(".jules/tools/slop_guard.py is missing; copy scripts/slop_guard.py")
            if spec_stories:
                bodies = ""
                for g in glob.glob(os.path.join(a.root, ".jules", "tasks", "*.md")):
                    with open(g, encoding="utf-8") as f:
                        bodies += f.read()
                for u in sorted(spec_stories, key=lambda x: int(x[1:])):
                    if not re.search(r"\b" + u + r"\b", bodies):
                        W(f"story {u} is not cited by any task file (traceability gap)")

    print("PLAN SUMMARY")
    for w, ids in sorted(waves.items()):
        print(f"  wave {w}: " + ", ".join(
            f"{i}[{by_id[i]['model'].strip()}]" for i in sorted(ids)))
    print(f"  tasks={len(by_id)} waves={len(waves)}")
    for n in notes:
        print("NOTE:", n)
    for w in warns:
        print("WARN:", w)
    for e in errors:
        print("ERROR:", e)
    print("RESULT:", "FAIL" if errors else "OK (no collisions)")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
