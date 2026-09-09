# Mirado Mortel — research & engineering

Static, accessible portfolio published at https://rajaommi.github.io/ via GitHub Pages. Plain HTML, CSS and a small navigation script; no build step, tracking or third-party runtime required. Fonts are self-hosted with their license notices in `assets/fonts/`.

## Pages

- `index.html`: profile, selected research and engineering projects, publications and contact.
- `thesis.html`: doctoral manuscript, version history, contributions and reading guide.
- `styles.css`: shared responsive design; `site.js`: progressive mobile-navigation enhancement. All content and download links work without JavaScript.

Preview with `python3 -m http.server 8765` and open http://localhost:8765/.

When releasing CSS or navigation changes, bump their shared `?v=` query in both HTML pages so returning readers do not receive cached assets from the previous design.

## Thesis releases: preserve earlier readers' copies

`assets/thesis/versions.json` records the approved versions, dates, page counts, sizes, SHA-256 hashes and release notes. The same release information is rendered statically in `thesis.html` for resilience and accessibility.

1. Add a **new dated PDF**, never overwrite a versioned file. Keep earlier published copies unchanged.
2. Add its metadata to the manifest and update the visible version history and homepage notice.
3. Run `THESIS_PDF_SOURCE=/path/to/approved.pdf scripts/sync-thesis-pdf.sh` to refresh the legacy latest alias. The script requires the approved manifest hash and refuses other source bytes.
4. Run `python3 scripts/check-thesis-releases.py`, `bash -n scripts/sync-thesis-pdf.sh` and `git diff --check`.
5. Check both pages at desktop and mobile sizes, navigation with keyboard and without JavaScript, all local links, and PDF downloads.
6. Commit and push `main`; verify the live pages and PDF hashes after GitHub Pages publishes.

The stable latest alias remains `assets/mirado-mortel-thesis-latest.pdf`. V4 in the archive is the exact PDF previously published on this site (29 July 2026), not a later local rebuild bearing the same version number.

## Content boundaries

Published work, numerical studies and physical prototypes are identified separately. Do not promote preprints to accepted papers, turn local results into universal claims, or publish private applications, unpublished results or collaborators' details without review. Images are authentic project materials; generated design concepts are not scientific evidence and are not shipped.

Older site layouts and interactive figure code remain recoverable in Git history.
