from __future__ import annotations

import json
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = (
    REPOSITORY_ROOT / "notebooks" / "FINPLE_CANONICAL_CSV_MONTHLY_BUILD.ipynb"
)
WORKFLOW_PATH = (
    REPOSITORY_ROOT / ".github" / "workflows" / "canonical-csv-pipeline.yml"
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
        self.assertIn('REPO_REF = "main"', source)
        self.assertIn("drive.mount", source)
        self.assertIn('"git", "clone"', source)
        self.assertIn('"git", "-C"', source)
        self.assertIn("bootstrap_universe", source)
        self.assertIn("update_universe", source)
        self.assertIn("marketDataProviderSymbol", source)
        self.assertIn("write_non_publishable_candidate=True", source)
        self.assertIn("operator-summary.json", source)
        self.assertIn("checkoutSha", source)
        self.assertIn("ZipFile", source)
        self.assertIn("VALIDATION_PATH", source)
        self.assertIn("FAILED_PATH", source)
        self.assertIn("SUMMARY_PATH", source)
        self.assertIn("CHECKPOINT_PATH", source)
        self.assertIn("files.download", source)
        self.assertIn("runtimeCsvReplacementPerformed", source)
        self.assertNotIn(
            "7e9b1e66a0f179c573d164cb48b9192a3494b9ac",
            source,
        )
        self.assertNotIn("Adj Close", source)
        self.assertNotIn("Total Return", source)
        for index, cell in enumerate(notebook["cells"]):
            if cell.get("cell_type") == "code":
                compile(
                    "".join(cell.get("source", [])),
                    f"{NOTEBOOK_PATH.name}:cell-{index}",
                    "exec",
                )

    def test_ci_checks_out_and_asserts_the_exact_pr_head(self) -> None:
        workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("github.event.pull_request.head.sha", workflow)
        self.assertIn("git rev-parse HEAD", workflow)
        self.assertIn("expected PR head SHA", workflow)
        self.assertIn("checked-out HEAD SHA", workflow)
        self.assertIn("exact-head match: true", workflow)


if __name__ == "__main__":
    unittest.main()
