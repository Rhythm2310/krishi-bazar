#!/usr/bin/env python3
"""Ownership guard. Copy to .jules/tools/ownership_guard.py in the target repo.

Fails a PR that changes files outside its task's owned paths.
Task ID is read from PR_TITLE, then PR_HEAD_REF (pattern T01, T002...).
Env: PR_TITLE, PR_HEAD_REF, BASE_REF (default origin/main), GUARD_STRICT=1 to fail
when no task ID is found. Stdlib only.
"""
import csv
import json
import os
import re
import subprocess
import sys

TASKS = ".jules/tasks.csv"
RESERVED = ["AGENTS.md", ".jules/tasks/**", ".jules/tasks.csv", ".jules/ownership.csv",
            ".jules/skills.csv", ".jules/deps.csv", ".jules/tools/**", ".jules/plan.md",
            ".agents/skills/**", "GLOSSARY.md", "CONTEXT.md", ".jules/spec.md", ".jules/swarm.json", ".jules/README.md", "docs/adr/**"]


def to_regex(glob):
    glob = glob.replace("\\", "/").strip()
    while glob.startswith("./"):
        glob = glob[2:]
    if glob.endswith("/"):
        glob += "**"
    i, out = 0, ""
    while i < len(glob):
        c = glob[i]
        if glob.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
        elif glob.startswith("/**", i) and i + 3 == len(glob):
            out += "(?:/.*)?"
            i += 3
        elif glob.startswith("**", i):
            out += ".*"
            i += 2
        elif c == "*":
            out += "[^/]*"
            i += 1
        elif c == "?":
            out += "[^/]"
            i += 1
        else:
            out += re.escape(c)
            i += 1
    return re.compile("^" + out + "$")


def matches(path, globs):
    return any(to_regex(g).match(path) for g in globs)


def split(v):
    return [x.strip() for x in (v or "").split(";") if x.strip()]


def resolve_base(explicit=None):
    """Pick the base ref: --base, BASE_REF, .jules/swarm.json base_branch, origin/HEAD, origin/main, origin/master."""
    def ok(ref):
        return bool(ref) and subprocess.run(["git", "rev-parse", "--verify", "--quiet", ref],
                                            capture_output=True).returncode == 0
    cands = [explicit, os.environ.get("BASE_REF")]
    try:
        top = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True).stdout.strip()
        with open(os.path.join(top, ".jules", "swarm.json"), encoding="utf-8") as f:
            b = (json.load(f).get("base_branch") or "").strip()
        if b:
            cands += [f"origin/{b}", b]
    except (OSError, ValueError, subprocess.CalledProcessError):
        pass
    cands += ["origin/HEAD", "origin/main", "origin/master"]
    for c in cands:
        if ok(c):
            return c
    return explicit or os.environ.get("BASE_REF") or "origin/main"


def changed_files():
    base = resolve_base()
    out = subprocess.run(["git", "diff", "--name-only", f"{base}...HEAD"],
                         capture_output=True, text=True, check=True).stdout
    return [l.strip() for l in out.splitlines() if l.strip()]


def main():
    if not os.path.exists(TASKS):
        print("guard: no .jules/tasks.csv, skipping")
        return 0
    with open(TASKS, newline="", encoding="utf-8") as f:
        tasks = {r["task_id"].strip(): r for r in csv.DictReader(f)
                 if r.get("task_id") and not r["task_id"].startswith("#")}
    files = changed_files()
    if not files:
        print("guard: no changes")
        return 0
    text = f"{os.environ.get('PR_TITLE', '')} {os.environ.get('PR_HEAD_REF', '')}"
    m = re.search(r"\bT\d{2,3}\b", text, re.I) or re.search(r"(?<![A-Za-z0-9])T\d{2,3}(?![0-9])", text, re.I)
    tid = m.group(0).upper() if m else None

    def allowed_for(t):
        return split(tasks[t]["owns"]) + [f".jules/reports/{t}*.md", f".jules/requests/{t}-*.md"]

    if tid and tid in tasks:
        allowed = allowed_for(tid)
        bad = [p for p in files if not matches(p, allowed)]
        reserved = [p for p in bad if matches(p, RESERVED)]
        if bad:
            print(f"guard FAIL: {tid} changed files outside its ownership:")
            for p in bad:
                print(f"  - {p}" + ("  [RESERVED]" if p in reserved else ""))
            print("Fix: revert these edits. If needed, write .jules/requests/"
                  f"{tid}-<slug>.md describing the change for the owner.")
            return 1
        print(f"guard OK: {tid} touched {len(files)} file(s), all owned")
        return 0

    cands = [t for t in tasks if all(matches(p, allowed_for(t)) for p in files)]
    if cands:
        print(f"guard OK (inferred task {cands[0]})")
        return 0
    msg = "guard: no task ID in PR title/branch and no single task owns all changed files"
    if os.environ.get("GUARD_STRICT") == "1":
        print("FAIL " + msg)
        return 1
    print("NOTICE " + msg + " (set GUARD_STRICT=1 to enforce)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
