"""Pruebas sin red de la auditoría del JSON real del screener."""
import unittest

from scripts.auditar_screener import audit


def sample(size=1400):
    return {
        "generated": "2026-10-19",
        "universe": "S&P 1500 (500 + 400 + 600)",
        "results": [
            {"ticker": f"T{i:04d}", "name": "Empresa", "tier": "Mediocre",
             "score": 35.0, "error": None, "metrics": {}, "quality": {},
             "valuation": {"multiples": {}}}
            for i in range(size)
        ],
    }


class ScreenerAuditTests(unittest.TestCase):
    def test_valid_universe_and_report(self):
        result = audit(sample(), "sp1500")
        self.assertTrue(result["ok"], result["errors"])
        self.assertEqual(result["row_count"], 1400)
        self.assertEqual(result["counts"]["priced"], 1400)
        self.assertTrue(result["requires_manual_coverage_and_errors_review"])

    def test_low_coverage_blocks(self):
        result = audit(sample(20), "sp1500")
        self.assertFalse(result["ok"])
        self.assertTrue(any("Cobertura insuficiente" in x for x in result["errors"]))

    def test_duplicate_and_bad_score_block(self):
        payload = sample()
        payload["results"][1]["ticker"] = payload["results"][0]["ticker"]
        payload["results"][2]["score"] = 123
        result = audit(payload, "sp1500")
        self.assertFalse(result["ok"])
        self.assertTrue(any("duplicado" in x for x in result["errors"]))
        self.assertTrue(any("score inválido" in x for x in result["errors"]))

    def test_mismatched_universe_blocks(self):
        payload = sample()
        payload["universe"] = "S&P 500"
        result = audit(payload, "sp1500")
        self.assertFalse(result["ok"])
        self.assertTrue(any("Universo declarado" in x for x in result["errors"]))


if __name__ == "__main__":
    unittest.main()
