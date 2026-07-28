from __future__ import annotations

import json
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = (
    REPOSITORY_ROOT / "notebooks" / "FINPLE_CANONICAL_CSV_MONTHLY_BUILD.ipynb"
)


class NotebookStructureTests(unittest.TestCase):
    def test_notebook_is_valid_json_and_reuses_pipeline_module(self) -> None:
        notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
        self.assertEqual(notebook["nbformat"], 4)
        self.assertGreaterEqual(len(notebook["cells"]), 5)
        source = "\n".join(
            "".join(cell.get("source", [])) for cell in notebook["cells"]
        )
        self.assertIn("build_canonical_candidate", source)
        self.assertIn("YFinanceMarketDataProvider", source)
        self.assertIn("AS_OF_DATE", source)
        self.assertIn("SOURCE_CANONICAL_PATH", source)
        self.assertIn("CACHE_DIR", source)
        self.assertIn("CHUNK_SIZE", source)
        self.assertIn("RESUME", source)
        self.assertIn("RETRY_COUNT", source)
        self.assertIn("PersistentCachedMarketDataProvider", source)
        self.assertNotIn("Adj Close", source)
        self.assertNotIn("Total Return", source)


if __name__ == "__main__":
    unittest.main()
