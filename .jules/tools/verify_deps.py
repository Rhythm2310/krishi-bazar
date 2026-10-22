#!/usr/bin/env python3
"""Verify .jules/deps.csv against public registries.

Checks per row: version exists, is stable, is not deprecated/yanked/archived, and how it compares
with the newest stable release. Needs internet. Stdlib only.

Usage:
  python verify_deps.py --deps .jules/deps.csv [--offline] [--max-age-days 14]
Supported ecosystems: npm, pypi, crates, actions, runtime. Others print a MANUAL line with where to look.
Exit code 1 if any ERROR (deprecated, yanked, missing, pre-release, end-of-life).
"""
import argparse
import csv
import datetime as dt
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

UA = {"User-Agent": "jules-swarm-architect-verify-deps/1.0", "Accept": "application/json"}
PRE = re.compile(r"(alpha|beta|rc|canary|nightly|next|dev|snapshot|preview|pre)", re.I)
MANUAL = {
    "go": "https://pkg.go.dev/<module>?tab=versions (check the Deprecated note in go.mod docs)",
    "maven": "https://search.maven.org/ and the project's release page",
    "nuget": "https://www.nuget.org/packages/<id> (look for the Deprecated banner)",
    "gem": "https://rubygems.org/gems/<name>",
    "composer": "https://packagist.org/packages/<vendor>/<name> (abandoned flag)",
    "docker": "the image's Docker Hub or registry tags page; pin a stable tag or digest",
}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def age_days(iso):
    try:
        d = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=dt.timezone.utc)
        return (dt.datetime.now(dt.timezone.utc) - d).days
    except Exception:
        return None


def check_npm(pkg, ver, a, out):
    data = get("https://registry.npmjs.org/" + urllib.parse.quote(pkg, safe="@"))
    latest = data.get("dist-tags", {}).get("latest")
    v = data.get("versions", {}).get(ver)
    if not v:
        return out("ERROR", f"{ver} does not exist on npm")
    if v.get("deprecated"):
        out("ERROR", f"{ver} is DEPRECATED: {str(v['deprecated'])[:160]}")
    if latest and latest != ver:
        out("WARN", f"newer stable available: {latest} (pinned {ver})")
    ag = age_days(data.get("time", {}).get(ver, ""))
    if ag is not None and ag < a.max_age_days:
        out("WARN", f"{ver} is only {ag} days old; consider the previous release unless it fixes a vulnerability")
    ld = data.get("versions", {}).get(latest, {}) if latest else {}
    if ld.get("deprecated"):
        out("ERROR", f"the whole package looks deprecated: {str(ld['deprecated'])[:160]}")


def check_pypi(pkg, ver, a, out):
    data = get(f"https://pypi.org/pypi/{urllib.parse.quote(pkg)}/json")
    info = data["info"]
    files = data.get("releases", {}).get(ver)
    if not files:
        return out("ERROR", f"{ver} does not exist on PyPI")
    if all(f.get("yanked") for f in files):
        out("ERROR", f"{ver} is YANKED")
    if any("Inactive" in c for c in info.get("classifiers", [])):
        out("ERROR", "package is classified Development Status :: 7 - Inactive")
    if info.get("yanked") and info.get("version") == ver:
        out("ERROR", "current release is yanked")
    if info["version"] != ver:
        out("WARN", f"newer stable available: {info['version']} (pinned {ver})")
    ag = age_days(files[0].get("upload_time_iso_8601", ""))
    if ag is not None and ag < a.max_age_days:
        out("WARN", f"{ver} is only {ag} days old")


def check_crates(pkg, ver, a, out):
    data = get("https://crates.io/api/v1/crates/" + urllib.parse.quote(pkg))
    vs = {v["num"]: v for v in data.get("versions", [])}
    if ver not in vs:
        return out("ERROR", f"{ver} does not exist on crates.io")
    if vs[ver].get("yanked"):
        out("ERROR", f"{ver} is YANKED")
    latest = data["crate"].get("max_stable_version")
    if latest and latest != ver:
        out("WARN", f"newer stable available: {latest} (pinned {ver})")
    ag = age_days(vs[ver].get("created_at", ""))
    if ag is not None and ag < a.max_age_days:
        out("WARN", f"{ver} is only {ag} days old")


def check_actions(pkg, ver, a, out):
    repo = get("https://api.github.com/repos/" + pkg)
    if repo.get("archived"):
        out("ERROR", "repository is ARCHIVED (unmaintained)")
    try:
        rel = get(f"https://api.github.com/repos/{pkg}/releases/latest")
        tag = rel.get("tag_name", "")
        major = tag.split(".")[0]
        if tag and ver not in (tag, major):
            out("WARN", f"latest release is {tag}; pinned {ver}")
    except urllib.error.HTTPError:
        out("INFO", "no GitHub release found; check tags manually")


def check_runtime(pkg, ver, a, out):
    cycles = get(f"https://endoflife.date/api/{urllib.parse.quote(pkg)}.json")
    row = next((c for c in cycles if str(c.get("cycle")) == ver), None)
    if not row:
        return out("ERROR", f"cycle {ver} not found for {pkg}")
    eol = row.get("eol")
    if eol is True or (isinstance(eol, str) and eol <= dt.date.today().isoformat()):
        out("ERROR", f"{pkg} {ver} is END OF LIFE ({eol})")
    elif isinstance(eol, str):
        out("INFO", f"supported until {eol}; lts={row.get('lts')}")
    newest_lts = next((c for c in cycles if c.get("lts")), None)
    if newest_lts and str(newest_lts["cycle"]) != ver:
        out("WARN", f"newest LTS cycle is {newest_lts['cycle']}; pinned {ver}")


CHECKS = {"npm": check_npm, "pypi": check_pypi, "crates": check_crates,
          "actions": check_actions, "runtime": check_runtime}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--deps", required=True)
    ap.add_argument("--offline", action="store_true", help="syntax checks only")
    ap.add_argument("--max-age-days", type=int, default=14)
    a = ap.parse_args()

    errors = 0
    with open(a.deps, newline="", encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if (r.get("ecosystem") or "").strip()
                and not r["ecosystem"].strip().startswith("#")]
    for r in rows:
        eco, pkg, ver = r["ecosystem"].strip().lower(), r["package"].strip(), r["version"].strip()
        lines = []

        def out(level, msg):
            nonlocal errors
            lines.append(f"    {level}: {msg}")
            if level == "ERROR":
                errors += 1

        if re.search(r"[\^~*<>=|]|latest|\.x$", ver):
            out("ERROR", f"{ver} is a range or tag, pin an exact version")
        if PRE.search(ver) and eco != "docker":
            out("ERROR", f"{ver} looks like a pre-release")
        if not a.offline:
            fn = CHECKS.get(eco)
            if fn:
                try:
                    fn(pkg, ver, a, out)
                except urllib.error.HTTPError as e:
                    out("ERROR" if e.code == 404 else "WARN", f"registry returned HTTP {e.code}")
                except Exception as e:
                    out("WARN", f"could not check ({e.__class__.__name__}: {e})")
            else:
                out("MANUAL", MANUAL.get(eco, "check the official registry and release notes"))
        print(f"{eco}:{pkg}@{ver}" + ("  ok" if not lines else ""))
        for ln in lines:
            print(ln)
    print(f"\nRESULT: {'FAIL' if errors else 'OK'} ({len(rows)} packages, {errors} error(s))")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
