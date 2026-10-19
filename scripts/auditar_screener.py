#!/usr/bin/env python3
"""Auditoría reproducible de la salida real del screener, antes de publicarla.

No certifica los datos económicos ni reemplaza la revisión manual de errores.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from collections import Counter
from datetime import date
from pathlib import Path

LABELS = {
    "sp500": "S&P 500",
    "sp400": "S&P 400",
    "sp600": "S&P 600",
    "sp1500": "S&P 1500 (500 + 400 + 600)",
}
# Umbrales de plausibilidad estructural, no garantías de cobertura económica.
MIN_ROWS = {"sp500": 450, "sp400": 350, "sp600": 550, "sp1500": 1400}


def audit(payload: object, universe: str) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    counts = Counter()
    example_errors = []
    if not isinstance(payload, dict):
        return {"ok": False, "errors": ["La raíz JSON no es un objeto"], "warnings": []}
    rows = payload.get("results")
    label = LABELS[universe]
    if payload.get("universe") != label:
        errors.append(f"Universo declarado {payload.get('universe')!r}, esperado {label!r}")
    try:
        date.fromisoformat(payload["generated"])
    except (KeyError, TypeError, ValueError):
        errors.append("Falta generated o no es fecha ISO válida")
    if not isinstance(rows, list):
        return {"ok": False, "errors": errors + ["results no es una lista"], "warnings": warnings}
    if len(rows) < MIN_ROWS[universe]:
        errors.append(f"Cobertura insuficiente: {len(rows)} filas (mínimo estructural {MIN_ROWS[universe]})")
    tickers: set[str] = set()
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            errors.append(f"Fila {i}: no es objeto")
            continue
        ticker = row.get("ticker")
        if not isinstance(ticker, str) or not ticker or ticker.strip() != ticker:
            errors.append(f"Fila {i}: ticker vacío o inválido")
            continue
        if ticker in tickers:
            errors.append(f"Ticker duplicado: {ticker}")
        tickers.add(ticker)
        tier = row.get("tier")
        if not isinstance(tier, str) or not tier:
            errors.append(f"{ticker}: clase tier ausente")
        err = row.get("error")
        if err is not None and not isinstance(err, str):
            errors.append(f"{ticker}: error debe ser texto o null")
        score = row.get("score")
        if score is not None and (
            isinstance(score, bool) or not isinstance(score, (int, float))
            or not math.isfinite(score) or not 0 <= score <= 100
        ):
            errors.append(f"{ticker}: score inválido ({score})")
        if row.get("metrics") is not None and not isinstance(row["metrics"], dict):
            errors.append(f"{ticker}: metrics no es objeto")
        if row.get("quality") is not None and not isinstance(row["quality"], dict):
            errors.append(f"{ticker}: quality no es objeto")
        counts["total"] += 1
        counts[f"tier:{tier}"] += 1
        if err:
            counts["sec_errors"] += 1
            if len(example_errors) < 25:
                example_errors.append({"ticker": ticker, "error": err[:200]})
        if tier == "Excluida (financiera)":
            counts["financial_excluded"] += 1
        if score is not None:
            counts["scored"] += 1
            if row.get("valuation") is not None:
                counts["priced"] += 1
            else:
                counts["without_valuation"] += 1
    if rows:
        rate = counts["sec_errors"] / len(rows)
        if rate > .05:
            warnings.append(f"Errores SEC/datos {rate:.1%}: exige revisión de causas antes de integrar")
        if counts["scored"] and counts["without_valuation"] / counts["scored"] > .2:
            warnings.append("Más del 20% de empresas puntuadas no tiene valoración de mercado")
    return {
        "ok": not errors,
        "universe": universe,
        "generated": payload.get("generated"),
        "row_count": len(rows),
        "expected_min_rows": MIN_ROWS[universe],
        "counts": dict(sorted(counts.items())),
        "sec_error_examples": example_errors,
        "errors": errors,
        "warnings": warnings,
        "requires_manual_coverage_and_errors_review": True,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--json", type=Path, required=True)
    p.add_argument("--universe", required=True, choices=LABELS)
    p.add_argument("--report", type=Path, required=True)
    args = p.parse_args()
    try:
        def invalid_constant(x):
            raise ValueError(f"JSON no estándar: {x}")
        payload = json.loads(args.json.read_text(encoding="utf-8"), parse_constant=invalid_constant)
        result = audit(payload, args.universe)
    except (OSError, ValueError) as exc:
        result = {"ok": False, "errors": [str(exc)], "warnings": [],
                  "requires_manual_coverage_and_errors_review": True}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report = [
        "# Auditoría de corrida screener",
        f"- Universo solicitado: `{args.universe}`",
        f"- JSON válido y estructura: {'APROBADO' if result['ok'] else 'FALLÓ'}",
        f"- Filas: {result.get('row_count', 'N/D')}",
        f"- Fecha: {result.get('generated', 'N/D')}",
    ]
    report += [f"- {key}: {val}" for key, val in result.get("counts", {}).items()]
    report += [f"- ERROR: {e}" for e in result["errors"]]
    report += [f"- AVISO: {w}" for w in result["warnings"]]
    report.append("- La aprobación manual debe contrastar universo, cobertura por índice, errores, precios y fuente.")
    md = "\n".join(report) + "\n"
    args.report.with_suffix(".md").write_text(md, encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(md + "\n")
    print(md)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
