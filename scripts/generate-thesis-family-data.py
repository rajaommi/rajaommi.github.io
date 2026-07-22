#!/usr/bin/env python3
"""Export a compact, browser-ready view of the audited V3 2SEG family."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import numpy as np


DEFAULT_THESIS_REPO = Path("/home/mirado/research/thesis_nlm_v2")


def rounded(values: np.ndarray, digits: int = 6) -> list[float]:
    return [round(float(value), digits) for value in values]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thesis-repo", type=Path, default=DEFAULT_THESIS_REPO)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "thesis-family-data.js",
    )
    args = parser.parse_args()

    thesis_repo = args.thesis_repo.resolve()
    sys.path.insert(0, str(thesis_repo))
    from scripts.v3_analysis.generate_2seg_family_figures import (  # noqa: PLC0415
        DEFAULT_RAW,
        fourier_diagnostics,
        load_cycles,
        representative_indices,
        select_window,
    )

    data, provenance = load_cycles(DEFAULT_RAW)
    data = select_window(data, 200.0)
    diagnostics = fourier_diagnostics(data)
    representatives, _ = representative_indices(data["mean_v"])

    sample_indices = np.unique(
        np.round(np.linspace(0, len(data["mean_v"]) - 1, 61)).astype(int)
    )
    backbone = {
        "meanSpeed": rounded(data["mean_v"][sample_indices]),
        "period": rounded(data["period"][sample_indices]),
        "jointExcursion": rounded(
            np.ptp(data["delta"], axis=1)[sample_indices]
        ),
        "yawRateExcursion": rounded(
            np.ptp(data["omega"], axis=1)[sample_indices]
        ),
        "phaseLagDeg": rounded(
            np.rad2deg(diagnostics["phase_lag"])[sample_indices], 3
        ),
        "yawRateThdPercent": rounded(
            diagnostics["yaw_rate_thd"][sample_indices], 3
        ),
    }

    phase_indices = np.arange(0, diagnostics["delta_resampled"].shape[1], 8)
    phase = phase_indices / diagnostics["delta_resampled"].shape[1]
    representatives_payload = []
    for label, index in zip(("L", "M", "H"), representatives, strict=True):
        delta = diagnostics["delta_resampled"][index].copy()
        theta = diagnostics["theta_resampled"][index].copy()
        shift = -int(np.argmax(delta))
        delta = np.roll(delta, shift)
        theta = np.roll(theta, shift)
        delta /= np.max(np.abs(delta))
        theta /= np.max(np.abs(theta))
        representatives_payload.append(
            {
                "label": label,
                "meanSpeed": round(float(data["mean_v"][index]), 3),
                "period": round(float(data["period"][index]), 6),
                "phaseLagDeg": round(
                    float(np.rad2deg(diagnostics["phase_lag"][index])), 2
                ),
                "yawRateThdPercent": round(
                    float(diagnostics["yaw_rate_thd"][index]), 2
                ),
                "phase": rounded(phase, 5),
                "joint": rounded(delta[phase_indices], 5),
                "heading": rounded(theta[phase_indices], 5),
            }
        )

    payload = {
        "sourceSha256": provenance["source_sha256"],
        "displayedCycleCount": int(len(data["mean_v"])),
        "meanSpeedWindow": [-200, 200],
        "backbone": backbone,
        "representatives": representatives_payload,
        "scope": "Descriptive diagnostics of archived corrected cycles; not a stability or global-manifold certificate.",
    }
    args.output.write_text(
        "window.THESIS_FAMILY_DATA = "
        + json.dumps(payload, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output),
                "displayedCycleCount": payload["displayedCycleCount"],
                "sourceSha256": payload["sourceSha256"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
