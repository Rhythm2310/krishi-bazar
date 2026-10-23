#!/usr/bin/env python3
"""swarm: the one command for running a Jules swarm. Copy to .jules/tools/swarm.py.

  python .jules/tools/swarm.py doctor            preflight before launching (pack, plan, CI, tools)
  python .jules/tools/swarm.py status            which tasks merged, what is next, what needs attention
  python .jules/tools/swarm.py launch [--wave N] [--task T03]   launcher prompts for the next wave
  python .jules/tools/swarm.py replan [--out F]  bundle reports, requests and plan for the architect
  python .jules/tools/swarm.py guard             run slop_guard and ownership_guard locally

OPTIONAL power tool: the user never has to run it; Task-prompt.md carries every prompt and step.
Settings live in .jules/swarm.json (repo, base_branch, glossary_file, max_concurrent, plan_concurrent).
Global option: --root PATH (default: the git top-level, else the current directory).
Needs Python 3.9+ and git. Stdlib only.
"""
import argparse
import csv
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
TID = re.compile(r"\bT\d{2,3}\b")
PLACEHOLDER = re.compile(r"\{\{[^}]*\}\}")
OK, WARN, BAD = "OK  ", "WARN", "FAIL"


def git(root, *args):
    r = subprocess.run(["git", "-C", root, *args], capture_output=True, text=True)
    return r.returncode, r.stdout.strip(), r.stderr.strip()


def find_root(arg):
    if arg:
        return os.path.abspath(arg)
    r = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else os.getcwd()


def load_cfg(root):
    try:
        with open(os.path.join(root, ".jules", "swarm.json"), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return [r for r in csv.DictReader(f) if r.get("task_id") or r.get("skill")]


def split(v):
    return [x.strip() for x in (v or "").split(";") if x.strip()]


def tasks_of(root):
    rows = [r for r in read_csv(os.path.join(root, ".jules", "tasks.csv"))
            if r.get("task_id") and not r["task_id"].startswith("#")]
    return {r["task_id"].strip(): r for r in rows}


def base_ref(root, cfg):
    b = (cfg.get("base_branch") or "").strip()
    cands = [f"origin/{b}", b] if b else []
    cands += ["origin/HEAD", "origin/main", "origin/master", "HEAD"]
    for c in cands:
        if c and git(root, "rev-parse", "--verify", "--quiet", c)[0] == 0:
            return c
    return "HEAD"


def merged_tasks(root, cfg, tasks):
    """Task IDs found in the history of the base branch: PR titles '[T03] ...' or branches 'jules/T03-...'."""
    ref = base_ref(root, cfg)
    code, out, _ = git(root, "log", ref, "--format=%s%n%b%x1e")
    found = set()
    if code == 0:
        for entry in out.split("\x1e"):
            lines = entry.strip().splitlines()
            subj = lines[0] if lines else ""
            m = re.match(r"\s*\[(T\d{2,3})\b", subj, re.I)
            if m:
                found.add(m.group(1).upper())
            for b in re.findall(r"jules/(T\d{2,3})-", entry, re.I):
                found.add(b.upper())
    return {t for t in found if t in tasks}, ref


def report_status(root, tid):
    p = os.path.join(root, ".jules", "reports", f"{tid}.md")
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8", errors="replace") as f:
        for line in f:
            m = re.match(r"\s*Status:\s*(\w+)", line, re.I)
            if m:
                return m.group(1).upper()
    return "UNKNOWN"


def open_requests(root):
    return sorted(os.path.basename(p) for p in glob.glob(os.path.join(root, ".jules", "requests", "*.md")))


def waves_of(tasks):
    w = {}
    for tid, r in tasks.items():
        w.setdefault(int(r["wave"]), []).append(tid)
    return {k: sorted(v) for k, v in sorted(w.items())}


def compute_status(root, cfg):
    tasks = tasks_of(root)
    merged, ref = merged_tasks(root, cfg, tasks)
    waves = waves_of(tasks)
    current = next((w for w, ids in waves.items() if not all(t in merged for t in ids)), None)
    return tasks, merged, ref, waves, current


# ------------------------------------------------------------------ status
def cmd_status(a):
    root = find_root(a.root)
    cfg = load_cfg(root)
    tasks, merged, ref, waves, current = compute_status(root, cfg)
    if not tasks:
        print("status: no .jules/tasks.csv found. Run this at the repo root of a swarm pack.")
        return 2
    print(f"SWARM STATUS  base: {ref}  ({len(merged)}/{len(tasks)} tasks merged)\n")
    reqs = open_requests(root)
    partial = []
    for w, ids in waves.items():
        mark = "done" if all(t in merged for t in ids) else ("current" if w == current else "later")
        print(f"Wave {w} [{mark}]")
        for t in ids:
            rs = report_status(root, t)
            state = "MERGED" if t in merged else "pending"
            extra = ""
            if t in merged and rs is None:
                extra = "  (merged, no report found: git pull?)"
            if rs == "PARTIAL":
                partial.append(t)
                extra = "  PARTIAL"
            print(f"  {t:5} {state:8} {tasks[t]['title'].strip()[:48]}{extra}")
    print()
    if reqs:
        print(f"Open requests ({len(reqs)}): " + ", ".join(reqs[:6]) + (" ..." if len(reqs) > 6 else ""))
    if partial:
        print("PARTIAL tasks: " + ", ".join(partial))
    print()
    if current is None:
        review = [t for t, r in tasks.items() if r.get("mode", "").strip() == "review"]
        if review and any(report_status(root, t) for t in review):
            print("NEXT: all waves merged and a review report exists. Run `swarm.py replan` and send it to the architect.")
        else:
            print("NEXT: all waves merged. Run the verify command on the base branch, then `swarm.py replan` if requests or PARTIAL tasks remain.")
        return 0
    pending = [t for t in waves[current] if t not in merged]
    done_in_wave = [t for t in waves[current] if t in merged]
    if not done_in_wave:
        attention = " Resolve open requests or PARTIAL tasks with REPLAN first." if (reqs or partial) else ""
        print(f"NEXT: wave {current} is ready. Run `swarm.py launch` ({len(pending)} agent(s)).{attention}")
    else:
        print(f"NEXT: waiting on {', '.join(pending)} (wave {current}). Merge their PRs, `git pull`, rerun `swarm.py status`.")
        print(f"      To restart one task: `swarm.py launch --task {pending[0]}`")
    return 0


# ------------------------------------------------------------------ launch
def cmd_launch(a):
    root = find_root(a.root)
    cfg = load_cfg(root)
    tasks, merged, ref, waves, current = compute_status(root, cfg)
    if not tasks:
        print("launch: no .jules/tasks.csv found")
        return 2
    cmd = [sys.executable, os.path.join(TOOLS, "render_launch_sheet.py"), "--root", root]
    if a.task:
        for t in a.task:
            cmd += ["--task", t]
    else:
        wave = a.wave if a.wave is not None else current
        if wave is None:
            print("launch: every wave is already merged. Use --wave N to print one anyway.")
            return 0
        if not a.force:
            blockers = [t for w, ids in waves.items() if w < wave for t in ids if t not in merged]
            if blockers:
                print(f"launch: wave {wave} is not ready. Unmerged earlier tasks: {', '.join(blockers)}")
                print("        Merge those PRs (CI green), `git pull`, or pass --force.")
                return 1
        cmd += ["--wave", str(wave)]
    return subprocess.run(cmd).returncode


# ------------------------------------------------------------------ replan
def cmd_replan(a):
    root = find_root(a.root)
    cfg = load_cfg(root)
    tasks, merged, ref, waves, current = compute_status(root, cfg)
    out = a.out or os.path.join(root, "replan.md")
    if not a.out:  # keep the default bundle out of commits without touching the tracked .gitignore
        rc, gdir, _ = git(root, "rev-parse", "--git-path", "info/exclude")
        if rc == 0:
            ex = gdir if os.path.isabs(gdir) else os.path.join(root, gdir)
            try:
                os.makedirs(os.path.dirname(ex), exist_ok=True)
                have = open(ex, encoding="utf-8").read() if os.path.exists(ex) else ""
                if "/replan.md" not in have.split():
                    with open(ex, "a", encoding="utf-8") as f:
                        f.write(("" if have.endswith("\n") or not have else "\n") + "/replan.md\n")
            except OSError:
                pass
    parts = ["# REPLAN\n", f"Project: {cfg.get('project', '')}  Base branch: {ref}\n"]

    def add_file(title, rel, fence=""):
        p = os.path.join(root, rel)
        if os.path.exists(p):
            with open(p, encoding="utf-8", errors="replace") as f:
                body = f.read().rstrip()
            parts.append(f"\n## {title}\n" + (f"```{fence}\n{body}\n```\n" if fence is not None else body + "\n"))

    import io
    import contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        cmd_status(argparse.Namespace(root=root))
    parts.append("\n## Status\n```\n" + buf.getvalue().rstrip() + "\n```\n")
    add_file("plan.md", ".jules/plan.md", None)
    add_file("tasks.csv", ".jules/tasks.csv", "csv")
    for p in sorted(glob.glob(os.path.join(root, ".jules", "reports", "*.md"))):
        add_file(f"Report {os.path.basename(p)[:-3]}", os.path.relpath(p, root), None)
    for p in sorted(glob.glob(os.path.join(root, ".jules", "requests", "*.md"))):
        add_file(f"Request {os.path.basename(p)}", os.path.relpath(p, root), None)
    _, log, _ = git(root, "log", ref, "--oneline", "-n", "40")
    parts.append("\n## Merged history\n```\n" + log + "\n```\n")
    text = "".join(parts)
    with open(out, "w", encoding="utf-8") as f:
        f.write(text)
    kb = len(text.encode("utf-8")) / 1024
    print(f"replan: wrote {out} ({kb:.0f} KB). Paste it into the architect chat after the word REPLAN.")
    if kb > 80:
        print("replan: large bundle. Delete reports of tasks that finished DONE with nothing to flag before pasting.")
    return 0


# ------------------------------------------------------------------ guard
def cmd_guard(a):
    root = find_root(a.root)
    cfg = load_cfg(root)
    ref = base_ref(root, cfg)
    env = dict(os.environ, BASE_REF=ref)
    _, branch, _ = git(root, "rev-parse", "--abbrev-ref", "HEAD")
    _, subj, _ = git(root, "log", "-1", "--format=%s")
    env.setdefault("PR_HEAD_REF", branch)
    env.setdefault("PR_TITLE", subj)
    rc = 0
    for name in ("ownership_guard.py", "slop_guard.py"):
        p = os.path.join(TOOLS, name)
        if not os.path.exists(p):
            print(f"guard: {name} missing next to swarm.py")
            rc = 1
            continue
        print(f"--- {name} (base {ref})")
        r = subprocess.run([sys.executable, p], cwd=root, env=env)
        rc = rc or r.returncode
    return rc


# ------------------------------------------------------------------ doctor
def cmd_doctor(a):
    root = find_root(a.root)
    cfg = load_cfg(root)
    errs = warns = 0

    def line(level, msg):
        nonlocal errs, warns
        errs += level == BAD
        warns += level == WARN
        print(f"{level} {msg}")

    print(f"SWARM DOCTOR  root: {root}\n")
    line(OK if sys.version_info >= (3, 9) else BAD, f"Python {sys.version.split()[0]} (needs 3.9+)")
    if git(root, "rev-parse", "--git-dir")[0] != 0:
        line(BAD, "not a git repository")
        return 1
    _, status, _ = git(root, "status", "--porcelain")
    line(OK if not status else WARN, "working tree clean" if not status else "uncommitted changes: commit and push the pack before launching")
    if not cfg:
        line(WARN, ".jules/swarm.json missing or invalid: tools fall back to defaults (base branch main)")
    else:
        bad = [k for k, v in cfg.items() if isinstance(v, str) and PLACEHOLDER.search(v)]
        line(BAD if bad else OK, f"swarm.json has unfilled values: {bad}" if bad else "swarm.json filled")
    base = (cfg.get("base_branch") or "").strip()
    if base:
        have_remote = git(root, "rev-parse", "--verify", "--quiet", f"origin/{base}")[0] == 0
        have_local = git(root, "rev-parse", "--verify", "--quiet", base)[0] == 0
        line(OK if have_remote else WARN,
             f"base branch '{base}' exists on origin" if have_remote else
             f"base branch '{base}' not on origin yet: `git push -u origin {base}` before launching" if have_local else
             f"base branch '{base}' not found: create it from the default branch")

    need = ["Task-prompt.md", "AGENTS.md", ".jules/tasks.csv", ".jules/ownership.csv", ".jules/skills.csv", ".jules/deps.csv",
            ".jules/plan.md", ".github/workflows/ci.yml", ".github/pull_request_template.md"]
    for rel in need:
        line(OK if os.path.exists(os.path.join(root, rel)) else BAD, rel)
    tools = ["ownership_guard.py", "slop_guard.py", "validate_plan.py", "render_launch_sheet.py"]
    for t in tools:
        line(OK if os.path.exists(os.path.join(TOOLS, t)) else BAD, f"tool {t}")

    skills = [r for r in read_csv(os.path.join(root, ".jules", "skills.csv")) if r.get("skill")]
    enabled = [r["skill"].strip() for r in skills if (r.get("enabled") or "").strip().lower() == "yes"]
    for s in enabled:
        ok = os.path.exists(os.path.join(root, ".agents", "skills", s, "SKILL.md"))
        line(OK if ok else BAD, f"skill {s}: .agents/skills/{s}/SKILL.md")
    notice = os.path.join(root, ".agents", "skills", "NOTICE.md")
    if enabled and os.path.exists(notice):
        with open(notice, encoding="utf-8") as f:
            if "paste verbatim here" in f.read():
                line(WARN, "NOTICE.md still asks for the upstream MIT licence text (paste it verbatim)")
    ci = os.path.join(root, ".github", "workflows", "ci.yml")
    if os.path.exists(ci):
        with open(ci, encoding="utf-8") as f:
            body = f.read()
        for job in ("ownership-guard", "slop-guard"):
            line(OK if job in body else WARN, f"CI job '{job}' present" if job in body else f"CI has no '{job}' job")
    for rel in ("AGENTS.md", ".github/workflows/ci.yml"):
        p = os.path.join(root, rel)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                ph = sorted(set(PLACEHOLDER.findall(re.sub(r"(?s)<!--.*?-->|\$\{\{.*?\}\}", "", f.read()))))
            if ph:
                line(BAD, f"{rel} has unfilled placeholders {ph[:3]}")

    print("\n--- plan validation")
    vp = os.path.join(TOOLS, "validate_plan.py")
    if os.path.exists(vp):
        cmd = [sys.executable, vp, "--tasks", os.path.join(root, ".jules/tasks.csv"),
               "--ownership", os.path.join(root, ".jules/ownership.csv"), "--root", root,
               "--max-concurrent", str(cfg.get("max_concurrent", 7))]
        for flag, rel in (("--skills", ".jules/skills.csv"), ("--deps", ".jules/deps.csv")):
            if os.path.exists(os.path.join(root, rel)):
                cmd += [flag, os.path.join(root, rel)]
        if cfg.get("plan_concurrent"):
            cmd += ["--plan-concurrent", str(cfg["plan_concurrent"])]
        r = subprocess.run(cmd, capture_output=True, text=True)
        for l in (r.stdout + r.stderr).splitlines():
            if l.startswith(("ERROR", "WARN", "RESULT")):
                print(l)
        if r.returncode != 0:
            errs += 1
    print()
    if errs:
        print(f"NOT READY: {errs} problem(s) to fix before launching.")
        return 1
    note = f" ({warns} warning(s) worth reading)" if warns else ""
    print(f"READY{note}. Commit, push, then follow Task-prompt.md.")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor")
    sub.add_parser("status")
    sub.add_parser("guard")
    p = sub.add_parser("launch")
    p.add_argument("--wave", type=int)
    p.add_argument("--task", action="append")
    p.add_argument("--force", action="store_true")
    p = sub.add_parser("replan")
    p.add_argument("--out")
    a = ap.parse_args()
    return {"doctor": cmd_doctor, "status": cmd_status, "launch": cmd_launch,
            "replan": cmd_replan, "guard": cmd_guard}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
