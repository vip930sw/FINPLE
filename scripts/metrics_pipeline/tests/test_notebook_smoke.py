from __future__ import annotations

import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = REPO_ROOT / "notebooks" / "FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb"


class NotebookSmokeTests(unittest.TestCase):
    def test_notebook_json_and_visible_sections(self):
        with NOTEBOOK_PATH.open("r", encoding="utf-8") as handle:
            notebook = json.load(handle)

        self.assertEqual(notebook["nbformat"], 4)
        self.assertGreaterEqual(notebook["nbformat_minor"], 5)

        markdown = "\n".join(
            "".join(cell.get("source", []))
            for cell in notebook["cells"]
            if cell.get("cell_type") == "markdown"
        )
        for heading in [
            "1. Check settings",
            "2. Check inputs",
            "3. Run pipeline",
            "4. Review summary",
            "5. Download output ZIP",
        ]:
            self.assertIn(heading, markdown)
        self.assertIn("execution package ZIP", markdown)
        self.assertIn("not production app approval", markdown)
        self.assertIn("raw daily normalization", markdown)
        self.assertIn("source adapter", markdown)
        self.assertIn("review-only overlay", markdown)

    def test_notebook_calls_single_pipeline_entrypoint(self):
        payload = NOTEBOOK_PATH.read_text(encoding="utf-8")
        self.assertIn("run_finple_monthly_metrics_pipeline(CONFIG)", payload)
        self.assertEqual(payload.count("run_finple_monthly_metrics_pipeline(CONFIG)"), 1)
        self.assertIn("find_repo_root", payload)
        self.assertIn("files.upload()", payload)
        self.assertIn("raw_daily_prices.csv", payload)
        self.assertIn("manual_upload_raw_daily_prices.csv", payload)
        self.assertIn("public_source_fixture_prices.csv", payload)
        self.assertIn("finple_step114_2d_execution_package", payload)
        self.assertIn("public_source_fixture", payload)
        self.assertIn("sourceAdapterSummaryJson", payload)
        self.assertIn("sourceAdapterCheckpointJson", payload)
        self.assertIn("usReviewOverlayCsv", payload)
        self.assertIn("krReviewOverlayCsv", payload)
        self.assertIn("productionPublishReady", payload)
        self.assertIn("appExportApproved", payload)
        forbidden_tokens = [
            "y" + "finance",
            "Alpha " + "Vantage",
            "K" + "IS",
            "requests." + "get(",
            "urllib." + "request",
        ]
        for forbidden in forbidden_tokens:
            self.assertNotIn(forbidden, payload)

    def test_public_clone_is_default_and_execution_package_is_fallback_only(self):
        with NOTEBOOK_PATH.open("r", encoding="utf-8") as handle:
            notebook = json.load(handle)

        code_sources = [
            "".join(cell.get("source", []))
            for cell in notebook["cells"]
            if cell.get("cell_type") == "code"
        ]
        self.assertIn(
            "!rm -rf /content/FINPLE\n"
            "!git clone --depth 1 https://github.com/vip930sw/FINPLE.git /content/FINPLE\n"
            "%cd /content/FINPLE",
            code_sources,
        )

        bootstrap_source = next(
            source for source in code_sources if "finple_step114_2d_execution_package" in source
        )
        self.assertIn(
            "if REPO_ROOT is None:\n"
            "    try:\n"
            "        from google.colab import files\n"
            "        print(\"Public GitHub clone did not produce a FINPLE repository checkout.",
            bootstrap_source,
        )
        self.assertNotIn('["git", "clone"', bootstrap_source)

        payload = NOTEBOOK_PATH.read_text(encoding="utf-8")
        for private_auth_prompt in ["GITHUB_TOKEN", "getpass(", "github_pat_"]:
            self.assertNotIn(private_auth_prompt, payload)


if __name__ == "__main__":
    unittest.main()
