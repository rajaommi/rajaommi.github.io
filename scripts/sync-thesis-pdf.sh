#!/usr/bin/env bash
set -euo pipefail

source_pdf="${THESIS_PDF_SOURCE:-/home/mirado/research/thesis_nlm_v2/thesis_v3/build/thesis_v3.pdf}"
site_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target_pdf="${site_root}/assets/mirado-mortel-thesis-latest.pdf"

if [[ ! -f "${source_pdf}" ]]; then
  echo "Thesis PDF not found: ${source_pdf}" >&2
  exit 1
fi

cp -- "${source_pdf}" "${target_pdf}"
sha256sum "${source_pdf}" "${target_pdf}"

echo "Local preview refreshed: ${target_pdf}"
echo "The thesis workflow publishes this path automatically after each source update."
