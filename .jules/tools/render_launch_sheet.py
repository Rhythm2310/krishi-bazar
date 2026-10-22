#!/usr/bin/env python3
"""Render per-wave launcher prompts and optional Jules CLI commands.

Usage:
  python render_launch_sheet.py --tasks .jules/tasks.csv --repo OWNER/REPO \
      [--root .] [--branch main] [--cli-style remote-new|new] [--template PATH]
Prints Markdown to stdout. Stdlib only.
"""
import argparse
import csv
import glob
import json
import os
import shlex
import sys

DEFAULT = """You are Jules agent {{TASK_ID}} in a coordinated swarm (wave {{WAVE}}).
1. Read /AGENTS.md fully. It is the law. Use the words of {{GLOSSARY}}.
2. Read {{TASK_FILE}} and execute it exactly. Do not ask questions. Use its decision defaults.
3. Modify ONLY: {{OWNS}} (plus .jules/reports/{{TASK_ID}}.md). Everything else is read-only.
4. Branch jules/{{TASK_ID}}-{{SLUG}}. PR title must start with "[{{TASK_ID}}]". Base branch: {{BASE}}.
5. Work test-first at the seams in your task file, review your own diff on both axes, run the verify command and slop_guard, then open the PR.
Already merged and available to you: {{DEPENDS}}
Skills to load first: {{SKILLS}}
"""


def split(v):
    return [x.strip() for x in (v or "").split(";") if x.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tasks", help="default: <root>/.jules/tasks.csv")
    ap.add_argument("--repo", help="OWNER/REPO; default from .jules/swarm.json")
    ap.add_argument("--root", default=".")
    ap.add_argument("--branch", help="branch sessions start from and PRs target (the integration branch if you use one); default from .jules/swarm.json")
    ap.add_argument("--glossary", help="default from .jules/swarm.json, else GLOSSARY.md")
    ap.add_argument("--wave", type=int, help="print only this wave")
    ap.add_argument("--task", action="append", help="print only this task ID (repeatable); for relaunching one task")
    ap.add_argument("--cli-style", choices=["remote-new", "new"], default="remote-new")
    ap.add_argument("--template")
    a = ap.parse_args()
    cfg = {}
    try:
        with open(os.path.join(a.root, ".jules", "swarm.json"), encoding="utf-8") as f:
            cfg = json.load(f)
    except (OSError, ValueError):
        pass
    a.tasks = a.tasks or os.path.join(a.root, ".jules", "tasks.csv")
    a.repo = a.repo or cfg.get("repo") or "OWNER/REPO"
    a.branch = a.branch or cfg.get("base_branch") or "main"
    a.glossary = a.glossary or cfg.get("glossary_file") or "GLOSSARY.md"
    want = {t.upper() for t in (a.task or [])}

    tpl = DEFAULT
    if a.template:
        with open(a.template, encoding="utf-8") as f:
            tpl = f.read()
    with open(a.tasks, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)
                if r.get("task_id") and not r["task_id"].startswith("#")]
    waves = {}
    for r in rows:
        if want and r["task_id"].strip().upper() not in want:
            continue
        waves.setdefault(int(r["wave"]), []).append(r)
    if a.wave is not None:
        waves = {w: v for w, v in waves.items() if w == a.wave}
    if not waves:
        sys.exit("render_launch_sheet: no tasks match --wave/--task")

    print("# Launch Sheet\n")
    print("Before any wave: AGENTS.md and .jules/ are committed to "
          f"`{a.branch}`, CI Auto-Fixer is ON, plan auto-approval is ON.\n")
    first = min(waves)
    for w in sorted(waves):
        rs = sorted(waves[w], key=lambda r: r["task_id"])
        print(f"## Wave {w}: {len(rs)} agent(s) concurrently\n")
        if w != first and a.wave is None and not want:
            print(f"**Gate:** every Wave {w - 1} PR is merged into `{a.branch}` and CI is green. "
                  f"Start all sessions below from `{a.branch}`.\n")
        for r in rs:
            tid = r["task_id"].strip()
            found = sorted(glob.glob(os.path.join(a.root, ".jules", "tasks", f"{tid}-*.md")))
            task_file = (".jules/tasks/" + os.path.basename(found[0])) if found \
                else f".jules/tasks/{tid}-{r['slug'].strip()}.md"
            vals = {
                "TASK_ID": tid, "WAVE": r["wave"].strip(), "TASK_FILE": task_file,
                "OWNS": ", ".join(split(r["owns"])), "SLUG": r["slug"].strip(),
                "DEPENDS": ", ".join(split(r["depends_on"])) or "none",
                "SKILLS": ", ".join(split(r["skills"])) or "none",
                "MODEL": r["model"].strip(), "GLOSSARY": a.glossary, "BASE": a.branch,
            }
            prompt = tpl
            for k, v in vals.items():
                prompt = prompt.replace("{{" + k + "}}", v)
            shown = "" if vals["MODEL"].lower() == "default" else f"  (model: {vals['MODEL']})"
            print(f"### {tid}: {r['title'].strip()}{shown}\n")
            print("```text\n" + prompt.rstrip() + "\n```\n")
            sub = "remote new" if a.cli_style == "remote-new" else "new"
            flag = "--session " if a.cli_style == "remote-new" else ""
            print("CLI (optional):\n```bash\njules " + sub + " --repo " + a.repo + " "
                  + flag + shlex.quote(prompt.rstrip()) + "\n```\n")
    print("## After the last wave\nRun the full verify command on "
          f"`{a.branch}`. Open `.jules/reports/` to review agent notes.")


if __name__ == "__main__":
    sys.exit(main())
