#!/usr/bin/env python3
"""Slop guard. Copy to .jules/tools/slop_guard.py in the target repo.

Scans only the lines a PR ADDS (git diff -U0 BASE...HEAD) for patterns that mark
unfinished, unverified or disguised work. High-precision rules are ERRORs and fail
the run; heuristic rules are WARNs (they fail only with --strict).

Env / flags:
  --base / BASE_REF   base ref; else .jules/swarm.json base_branch, origin/HEAD, origin/main, origin/master
  --strict            WARNs fail too
  --json              machine-readable output
Escape hatch: append `slop-ok: <reason of 8+ chars>` on the same line. The finding is
reported as NOTICE and does not fail. Reviewers read NOTICEs.
Exit 1 if any ERROR. Stdlib only.
"""
import argparse
import json
import os
import re
import subprocess
import sys

SKIP_PREFIXES = (".jules/", ".agents/", "node_modules/", "vendor/", "dist/", "build/", ".git/")
SKIP_SUFFIXES = (".md", ".csv", ".lock", ".lockb", ".svg", ".png", ".jpg", ".gif", ".ico", ".snap",
                 "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "go.sum", "poetry.lock")
CODE_EXT = (".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".kt", ".rb",
            ".php", ".cs", ".swift", ".c", ".cc", ".cpp", ".h", ".hpp", ".vue", ".svelte", ".sh")
TEST_PATH = re.compile(r"(^|/)(tests?|__tests__|spec|e2e)/|\.(test|spec)\.[a-z]+$|(^|/)test_[^/]+\.py$|_test\.(py|go)$", re.I)
OK_MARK = re.compile(r"slop-ok:\s*(\S.{7,})")

TODO = re.compile(r"\b(TODO|FIXME|XXX|HACK)\b(?!\s*\((#\d+|[\w.-]+/[\w.-]+#\d+|T\d{2,3}-[\w-]+)\))")
STUB = re.compile(r"implement me|your (code|implementation) here|rest of (the )?(code|implementation|file|function)"
                  r"|same as above|lorem ipsum|\.\.\.\s*(existing|rest|remaining|unchanged)\b|add (the )?logic here"
                  r"|placeholder (implementation|logic|code)", re.I)
STUB_CALLS = re.compile(r"\btodo!\s*\(|\bunimplemented!\s*\(|throw new Error\(\s*['\"]not implemented", re.I)
SKIP_TEST = re.compile(r"\b(describe|it|test)\.(skip|only|todo)\b|\b(xit|xdescribe|xtest|fit|fdescribe|ftest)\s*\("
                       r"|@pytest\.mark\.(skip|skipif|xfail)|\bpytest\.(skip|xfail)\s*\(|\bt\.Skip(Now)?\s*\("
                       r"|#\[ignore\]|@(Disabled|Ignore)\b|\bunittest\.skip")
SUPPRESS_ERR = re.compile(r"@ts-ignore|@ts-nocheck|/\*\s*eslint-disable\s*\*/|^\s*//\s*eslint-disable\s*$"
                          r"|#\s*type:\s*ignore(?!\[)|#\s*noqa\s*$|#\s*pylint:\s*skip-file|//\s*nolint\s*$")
SUPPRESS_WARN = re.compile(r"eslint-disable|@ts-expect-error|#\s*noqa:|#\s*type:\s*ignore\[|#\s*pylint:\s*disable"
                           r"|//\s*nolint:|#!?\[allow\(|# rubocop:disable|@SuppressWarnings")
EMPTY_CATCH = re.compile(r"catch\s*(\([^)]*\))?\s*\{\s*(//[^\n]*)?\}|except[^:\n]*:\s*pass\b|\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)")
DEBUG_STMT = re.compile(r"^\s*debugger;?\s*$|\bpdb\.set_trace\(|\bbreakpoint\(\)|\bbinding\.pry\b")
DEBUG_TAG = re.compile(r"\[DEBUG-[0-9a-f]{2,}\]", re.I)
TAUTOLOGY = re.compile(r"expect\(\s*(?P<a>.+?)\s*\)\.(?:toBe|toEqual|toStrictEqual)\(\s*(?P=a)\s*\)"
                       r"|\bassert\s+(?P<b>[\w.()\[\], ]+?)\s*==\s*(?P=b)\s*$|\bassert\s+(?:True|1)\s*$"
                       r"|assertTrue\(\s*true\s*\)")
ANY_TYPE = re.compile(r":\s*any\b|\bas any\b|<any>|\bas unknown as\b")
CONSOLE = re.compile(r"\bconsole\.(log|debug|trace)\(|^\s*print\(|\bfmt\.Println\(|\bdbg!\(|\bSystem\.out\.println\(")
COMMENTED_CODE = re.compile(r"^\s*(//|#)\s*(const|let|var|def|class|import|from|return|if|for|while|function|await|export)\b.*[;{(:,]\s*$")
INTERNAL_MOCK = re.compile(r"\b(jest|vi)\.mock\(\s*['\"]\.{1,2}/|\bmock\.patch\(\s*['\"][\w.]+['\"]|\bsinon\.stub\(\s*[\w.]+,")
CALL_ASSERT = re.compile(r"toHaveBeenCalled(Times|With)?\(|assert_called|\.calledWith\(|verify\([\w.]+\)\.")
SNAPSHOT = re.compile(r"toMatch(Inline)?Snapshot\(")
TEST_DEF = re.compile(r"^\s*(it|test)\s*\(|^\s*def test_|^\s*func Test\w+\(|^\s*#\[test\]|@Test\b")
ASSERT_TOK = re.compile(r"\bexpect\s*\(|\bassert|\.should\b|\bt\.(Error|Errorf|Fatal|Fatalf|Fail)\b|\brequire\.|\bverify\(|\.toThrow|\bpytest\.raises|\bassertThat\b|\bEXPECT_|\bASSERT_")

ERR, WARN = "ERROR", "WARN"


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


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def added_lines(base):
    """Yield (path, lineno, text) for lines added by the PR."""
    out = run(["git", "diff", "-U0", "--no-color", "--diff-filter=AMR", f"{base}...HEAD"])
    path, ln = None, 0
    for raw in out.splitlines():
        if raw.startswith("+++ b/"):
            path = raw[6:]
        elif raw.startswith("+++ "):
            path = None
        elif raw.startswith("@@"):
            m = re.search(r"\+(\d+)", raw)
            ln = int(m.group(1)) if m else 0
        elif raw.startswith("+") and not raw.startswith("+++"):
            if path:
                yield path, ln, raw[1:]
            ln += 1


def skip(path):
    return path.startswith(SKIP_PREFIXES) or path.endswith(SKIP_SUFFIXES)


def scan(base):
    findings, by_file = [], {}
    for path, ln, text in added_lines(base):
        if skip(path):
            continue
        by_file.setdefault(path, []).append((ln, text))
    for path, lines in by_file.items():
        is_code = path.endswith(CODE_EXT)
        is_test = bool(TEST_PATH.search(path))
        prev = None

        def add(rule, sev, ln, text, msg):
            ok = OK_MARK.search(text)
            findings.append({"rule": rule, "severity": "NOTICE" if ok else sev, "file": path, "line": ln,
                             "message": msg + (f" (slop-ok: {ok.group(1).strip()})" if ok else ""),
                             "text": text.strip()[:140]})

        for ln, text in lines:
            if DEBUG_TAG.search(text):
                add("S01", ERR, ln, text, "debug tag left behind; remove the instrumentation")
            if is_code and TODO.search(text):
                add("S02", ERR, ln, text, "bare TODO/FIXME; finish it, or write TODO(T07-slug) pointing at a filed request")
            if is_code and (STUB.search(text) or STUB_CALLS.search(text)):
                add("S03", ERR, ln, text, "stub or placeholder language; implement it or file a request")
            if is_test and SKIP_TEST.search(text):
                add("S04", ERR, ln, text, "skipped, focused or todo test; fix it, never disable it")
            if is_code and SUPPRESS_ERR.search(text):
                add("S05", ERR, ln, text, "blanket suppression of a lint or type error; fix the cause")
            elif is_code and SUPPRESS_WARN.search(text):
                add("W05", WARN, ln, text, "targeted suppression; confirm it carries a reason")
            if is_code and EMPTY_CATCH.search(text):
                add("S06", ERR, ln, text, "swallowed error; handle it or let it propagate")
            if is_code and prev and re.match(r"\s*except[^:\n]*:\s*$", prev[1]) and text.strip() == "pass":
                add("S06", ERR, ln, text, "swallowed error (except: pass); handle it or let it propagate")
            if is_code and DEBUG_STMT.search(text):
                add("S09", ERR, ln, text, "debugger statement left in code")
            if is_test and TAUTOLOGY.search(text):
                add("S08", ERR, ln, text, "tautological assertion; expected value must come from an independent source")
            if is_code and ANY_TYPE.search(text) and path.endswith((".ts", ".tsx")):
                add("W01", WARN, ln, text, "`any` erases type safety; model the type")
            if is_code and not is_test and CONSOLE.search(text):
                add("W03", WARN, ln, text, "debug-style output in source; use the project logger or remove it")
            if is_code and COMMENTED_CODE.search(text):
                add("W02", WARN, ln, text, "commented-out code; delete it (git remembers)")
            if is_test and INTERNAL_MOCK.search(text):
                add("W04", WARN, ln, text, "mock of an internal module; mock only system boundaries")
            if is_test and CALL_ASSERT.search(text):
                add("W06", WARN, ln, text, "asserts on calls, not behaviour; assert the observable result")
            if is_test and SNAPSHOT.search(text):
                add("W07", WARN, ln, text, "snapshot derived from the implementation; assert the specific behaviour")
            prev = (ln, text)

        if is_test and path.endswith(CODE_EXT):
            try:
                with open(path, encoding="utf-8", errors="replace") as f:
                    body = f.read()
            except OSError:
                continue
            if any(TEST_DEF.search(t) for _, t in lines) and not ASSERT_TOK.search(body):
                first = next(ln for ln, t in lines if TEST_DEF.search(t))
                findings.append({"rule": "S07", "severity": ERR, "file": path, "line": first,
                                 "message": "test file defines tests but contains no assertion", "text": ""})
    return findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=None)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    a.base = resolve_base(a.base)
    try:
        findings = scan(a.base)
    except subprocess.CalledProcessError as e:
        print(f"slop_guard: git failed ({e.stderr.strip() or e}). Is BASE_REF '{a.base}' fetched?")
        return 2
    gha = os.environ.get("GITHUB_ACTIONS") == "true"
    errs = [f for f in findings if f["severity"] == ERR]
    warns = [f for f in findings if f["severity"] == WARN]
    notes = [f for f in findings if f["severity"] == "NOTICE"]
    if a.json:
        print(json.dumps(findings, indent=2))
    else:
        for f in sorted(findings, key=lambda f: (f["severity"] != ERR, f["file"], f["line"])):
            tag = f"[{f['rule']}] {f['file']}:{f['line']}: {f['message']}"
            if gha and f["severity"] in (ERR, WARN):
                lvl = "error" if f["severity"] == ERR else "warning"
                print(f"::{lvl} file={f['file']},line={f['line']}::[{f['rule']}] {f['message']}")
            print(f"{f['severity']:6} {tag}" + (f"\n         > {f['text']}" if f["text"] else ""))
        print(f"slop_guard: {len(errs)} error(s), {len(warns)} warning(s), {len(notes)} notice(s) in added lines vs {a.base}")
    return 1 if errs or (a.strict and warns) else 0


if __name__ == "__main__":
    sys.exit(main())
