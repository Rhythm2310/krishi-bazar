#!/usr/bin/env python3
"""Unpack a Jules paste pack into files.

Pack format:
@@@FILE relative/path.ext@@@
...content...
@@@END@@@

Usage: python unpack_pack.py jules-pack.txt [--root .] [--force] [--dry-run]
"""
import argparse
import os
import re
import sys

START = re.compile(r"^@@@FILE (.+?)@@@\s*$")
END = re.compile(r"^@@@END@@@\s*$")


def safe(rel):
    rel = rel.strip().replace("\\", "/")
    if not rel or rel.startswith("/") or re.match(r"^[A-Za-z]:", rel):
        return False
    return ".." not in rel.split("/")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pack")
    ap.add_argument("--root", default=".")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    files, cur, buf = [], None, []
    with open(a.pack, encoding="utf-8") as f:
        for line in f:
            if cur is None:
                m = START.match(line)
                if m:
                    cur, buf = m.group(1).strip(), []
            elif END.match(line):
                files.append((cur, "".join(buf)))
                cur = None
            else:
                buf.append(line)
    if cur is not None:
        sys.exit(f"ERROR: unterminated file block: {cur}")
    if not files:
        sys.exit("ERROR: no @@@FILE blocks found")

    for rel, _ in files:
        if not safe(rel):
            sys.exit(f"ERROR: unsafe path refused: {rel}")
    for rel, body in files:
        dest = os.path.join(a.root, rel)
        exists = os.path.exists(dest)
        if exists and not a.force:
            print(f"SKIP (exists, use --force): {rel}")
            continue
        print(("WOULD WRITE " if a.dry_run else "WRITE ") + rel)
        if not a.dry_run:
            os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as out:
                out.write(body)
    print(f"done: {len(files)} file(s) in pack")


if __name__ == "__main__":
    main()
