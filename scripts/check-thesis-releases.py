#!/usr/bin/env python3
"""Validate immutable release metadata and the latest alias; no third-party modules.

Requires the existing pdfinfo command for independent PDF page-count checks.
This script is read-only. It never creates, modifies or repairs release files.
"""

import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/thesis/versions.json"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def site_path(value, *, archive=False):
    require(isinstance(value, str), "A PDF path must be a string.")
    pattern = (
        r"assets/thesis/mirado-mortel-thesis-v[0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}\.pdf"
        if archive else r"assets/mirado-mortel-thesis-latest\.pdf"
    )
    require(re.fullmatch(pattern, value), f"Invalid public PDF path: {value!r}")
    path = ROOT / value
    require(path.resolve().is_relative_to(ROOT), f"PDF path escapes the site: {value}")
    require(not path.is_symlink(), f"A release PDF must not be a symlink: {value}")
    return path


def load_manifest():
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    require(data.get("schema_version") == 1, "Unsupported release manifest schema.")
    releases = data.get("releases")
    require(isinstance(releases, list) and releases, "The release list must not be empty.")
    ids, paths = set(), set()
    for release in releases:
        require(isinstance(release, dict), "Each release must be an object.")
        identifier = release.get("id")
        require(isinstance(identifier, str) and re.fullmatch(r"v[0-9]+", identifier), "Invalid release ID.")
        require(identifier not in ids, f"Duplicate release ID: {identifier}")
        ids.add(identifier)
        date = release.get("date")
        require(isinstance(date, str), f"Missing date for {identifier}.")
        require(datetime.date.fromisoformat(date).isoformat() == date, f"Invalid release date: {date}")
        path = release.get("path")
        site_path(path, archive=True)
        require(path == f"assets/thesis/mirado-mortel-thesis-{identifier}-{date}.pdf", "Release ID/date do not match its archive filename.")
        require(path not in paths, f"Duplicate archive path: {path}")
        paths.add(path)
        for key in ("pages", "bytes"):
            require(type(release.get(key)) is int and release[key] > 0, f"Invalid {key} for {identifier}.")
        require(isinstance(release.get("sha256"), str) and re.fullmatch(r"[a-f0-9]{64}", release["sha256"]), f"Invalid SHA-256 for {identifier}.")
        require(isinstance(release.get("label"), str) and release["label"].strip(), f"Missing label for {identifier}.")
        changes = release.get("changes")
        require(isinstance(changes, list) and changes and all(isinstance(item, str) and item.strip() for item in changes), f"Missing change notes for {identifier}.")
    require(data.get("latest") in ids, "The latest release ID is not present in the manifest.")
    latest = next(release for release in releases if release["id"] == data["latest"])
    require(latest["date"] == max(release["date"] for release in releases), "The latest alias must select the most recent release date.")
    alias = site_path(data.get("latest_pdf"))
    return releases, latest, alias


def verify_pdf(path, release):
    require(path.is_file(), f"Missing PDF: {path}")
    require(path.stat().st_size == release["bytes"], f"Byte-count mismatch: {path}")
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    require(digest.hexdigest() == release["sha256"], f"SHA-256 mismatch: {path}; archives must never be overwritten.")
    info = subprocess.run(["pdfinfo", str(path)], check=True, capture_output=True, text=True).stdout
    pages = re.search(r"^Pages:\s+([0-9]+)\s*$", info, re.MULTILINE)
    require(pages is not None and int(pages[1]) == release["pages"], f"PDF page-count mismatch: {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archives-only", action="store_true", help="Validate archives without the compatibility alias.")
    parser.add_argument("--source", type=Path, help="Also require a proposed source to match the approved latest release.")
    parser.add_argument("--latest-file", type=Path, help="Validate a staged alias instead of the current alias.")
    args = parser.parse_args()
    require(not (args.archives_only and args.latest_file), "Do not combine --archives-only with --latest-file.")
    releases, latest, alias = load_manifest()
    for release in releases:
        verify_pdf(site_path(release["path"], archive=True), release)
    if args.source:
        verify_pdf(args.source.resolve(), latest)
    if not args.archives_only:
        verify_pdf(args.latest_file.resolve() if args.latest_file else alias, latest)
    print(f"Verified {len(releases)} immutable thesis releases; latest is {latest['id']} ({latest['pages']} pages).")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(f"Thesis release validation failed: {error}", file=sys.stderr)
        sys.exit(1)
