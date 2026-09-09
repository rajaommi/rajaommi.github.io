#!/usr/bin/env bash
set -euo pipefail

source_pdf="${THESIS_PDF_SOURCE:-/home/mirado/research/thesis_nlm_v2/thesis_v5/build/thesis_v5.pdf}"
site_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_pdf="${site_root}/assets/mirado-mortel-thesis-latest.pdf"
validator="${site_root}/scripts/check-thesis-releases.py"

if [[ ! -f "${source_pdf}" ]]; then
  echo "Thesis PDF not found: ${source_pdf}" >&2
  exit 1
fi

# Archives are deliberately read-only to this script. To publish a new release,
# first add its new, versioned PDF and reviewed entry in assets/thesis/versions.json.
# Never replace an archived file or silently bless a changed build as a release.
python3 "${validator}" --archives-only --source "${source_pdf}"

if cmp -s -- "${source_pdf}" "${target_pdf}"; then
  python3 "${validator}"
  echo "The latest alias already matches the approved release."
  exit 0
fi

# Validate the copied bytes before atomically replacing the compatibility alias.
temporary_pdf="$(mktemp "${target_pdf}.tmp.XXXXXX")"
trap 'rm -f -- "${temporary_pdf}"' EXIT
cp -- "${source_pdf}" "${temporary_pdf}"
chmod 644 "${temporary_pdf}"
python3 "${validator}" --latest-file "${temporary_pdf}"
mv -f -- "${temporary_pdf}" "${target_pdf}"
python3 "${validator}"

echo "Local latest alias refreshed from the approved release: ${target_pdf}"
echo "No archive, commit, push or deployment was changed by this script."
