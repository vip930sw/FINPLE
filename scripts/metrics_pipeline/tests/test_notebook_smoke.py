from __future__ import annotations

import ast
import contextlib
import io
import json
import subprocess
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[3]
NOTEBOOK_PATH = REPO_ROOT / "notebooks" / "FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb"
US_COLLECTION_NOTEBOOK = REPO_ROOT / "notebooks" / "FINPLE_US_PRICE_METRICS_COLAB_step108_13.ipynb"
KR_COLLECTION_NOTEBOOK = REPO_ROOT / "notebooks" / "FINPLE_KR_PRICE_METRICS_COLAB_step108_14.ipynb"


def collection_code_sources(path: Path) -> list[str]:
    notebook = json.loads(path.read_text(encoding="utf-8"))
    return ["".join(cell.get("source", [])) for cell in notebook["cells"] if cell.get("cell_type") == "code"]


def bootstrap_function(path: Path, function_name: str):
    bootstrap = next(source for source in collection_code_sources(path) if "checkout_and_preflight" in source)
    python_source = "\n".join(
        line for line in bootstrap.splitlines() if not line.startswith(("!", "%"))
    )
    tree = ast.parse(python_source)
    function_node = next(
        node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == function_name
    )
    return compile(ast.Module(body=[function_node], type_ignores=[]), path.name, "exec")


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

    def test_existing_collection_notebooks_expose_raw_chunk_smoke_resume_and_combine(self):
        for path, market in [(US_COLLECTION_NOTEBOOK, "us"), (KR_COLLECTION_NOTEBOOK, "kr")]:
            with self.subTest(path=path.name):
                notebook = json.loads(path.read_text(encoding="utf-8"))
                self.assertEqual(notebook["nbformat"], 4)
                payload = path.read_text(encoding="utf-8")
                self.assertIn("--out-raw", payload)
                self.assertIn("--limit', '20'", payload)
                self.assertIn("range(0, ", payload)
                self.assertIn("100", payload)
                self.assertIn("--checkpoint-every", payload)
                self.assertIn("--resume", payload)
                self.assertIn("--raw-pattern", payload)
                self.assertIn(f"{market}_raw_daily_prices.csv", payload)
                self.assertNotIn("GITHUB_TOKEN", payload)
                if market == "kr":
                    self.assertIn("re.fullmatch(r'[0-9A-Z]{6}', row['ticker'])", payload)
                    self.assertNotIn("row['ticker'].isdigit()", payload)

    def test_operating_notebooks_share_date_history_and_drive_settings(self):
        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK, NOTEBOOK_PATH]:
            with self.subTest(path=path.name):
                payload = "\n".join(collection_code_sources(path))
                for setting in [
                    'AS_OF_INCLUDED = "2026-07-22"',
                    "HISTORY_YEARS = 20",
                    "USE_GOOGLE_DRIVE = True",
                    'DRIVE_ROOT = "/content/drive/MyDrive/FINPLE/monthly-metrics"',
                ]:
                    self.assertIn(setting, payload)
                self.assertIn("drive.mount(", payload)
                self.assertIn("/content/drive", payload)
                for directory in ["smoke", "chunks", "combined", "validation", "one-click"]:
                    self.assertIn(directory, payload)

        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK]:
            payload = "\n".join(collection_code_sources(path))
            self.assertIn("'--as-of-included', AS_OF_INCLUDED", payload)
            self.assertIn("'--years', str(HISTORY_YEARS)", payload)
            self.assertIn("'providerDownloadEndExclusive'", payload)
            self.assertIn("DOWNLOAD_OUTPUTS = False", payload)

        one_click = "\n".join(collection_code_sources(NOTEBOOK_PATH))
        self.assertIn('"metric_base_date": AS_OF_INCLUDED', one_click)
        self.assertIn('"--as-of-included", AS_OF_INCLUDED', one_click)
        self.assertIn("DOWNLOAD_OUTPUT_ZIP = False", one_click)

    def test_collection_notebooks_use_shallow_fetch_head_detached_checkout(self):
        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK]:
            with self.subTest(path=path.name):
                sources = collection_code_sources(path)
                bootstrap = next(source for source in sources if "checkout_and_preflight" in source)
                self.assertIn("git clone --depth 1", bootstrap)
                self.assertIn("['git', 'fetch', '--depth', '1', 'origin', collection_ref]", bootstrap)
                self.assertIn("['git', 'checkout', '--detach', 'FETCH_HEAD']", bootstrap)
                self.assertIn("['git', 'rev-parse', 'HEAD']", bootstrap)
                self.assertIn("['git', 'status', '--short', '--branch']", bootstrap)
                self.assertIn("'requestedRef': collection_ref", bootstrap)
                self.assertIn("'collectorExists': collector_exists", bootstrap)
                self.assertNotIn("git checkout {COLLECTION_REF}", bootstrap)

    def test_all_collection_modules_help_from_repository_root(self):
        modules = [
            "scripts.build_us_price_metrics_overlay_chunked",
            "scripts.build_kr_price_metrics_overlay_chunked",
            "scripts.combine_us_price_metrics_chunks",
            "scripts.combine_kr_price_metrics_chunks",
            "scripts.prepare_monthly_metrics_candidate_inputs",
        ]
        collector_modules = set(modules[:2])
        for module in modules:
            with self.subTest(module=module):
                result = subprocess.run(
                    [sys.executable, "-m", module, "--help"],
                    cwd=REPO_ROOT,
                    capture_output=True,
                    text=True,
                    check=False,
                )
                self.assertEqual(result.returncode, 0, f"{module}\nstdout={result.stdout}\nstderr={result.stderr}")
                if module in collector_modules:
                    for option in ["--out-raw", "--retrieved-at", "--resume"]:
                        self.assertIn(option, result.stdout)

    def test_collection_preflight_blocks_old_cli_before_provider_cell(self):
        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK]:
            with self.subTest(path=path.name):
                sources = collection_code_sources(path)
                bootstrap_index = next(index for index, source in enumerate(sources) if "checkout_and_preflight" in source)
                smoke_index = next(index for index, source in enumerate(sources) if "20-asset smoke" in source)
                bootstrap = sources[bootstrap_index]
                self.assertLess(bootstrap_index, smoke_index)
                self.assertIn(
                    "REQUIRED_COLLECTOR_OPTIONS = {'--out-raw', '--retrieved-at', '--resume', '--as-of-included', '--years'}",
                    bootstrap,
                )
                self.assertIn("missing CLI options", bootstrap)
                self.assertIn("raise RuntimeError", bootstrap)
                self.assertIn("[sys.executable, '-m', COLLECTOR_MODULE, '--help']", bootstrap)
                self.assertIn("[sys.executable, '-m', COMBINE_MODULE, '--help']", bootstrap)

    def test_checkout_failure_stops_before_cli_or_provider_calls(self):
        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK]:
            with self.subTest(path=path.name):
                calls: list[list[str]] = []

                def fail_checkout(command, _label, _cwd):
                    calls.append(command)
                    if command[:2] == ["git", "checkout"]:
                        raise RuntimeError("checkout failed")
                    return SimpleNamespace(stdout="")

                namespace = {"run_visible": fail_checkout, "REPO_ROOT": REPO_ROOT}
                exec(bootstrap_function(path, "checkout_and_preflight"), namespace)
                with self.assertRaisesRegex(RuntimeError, "checkout failed"):
                    namespace["checkout_and_preflight"]("branch", REPO_ROOT / "collector.py")
                self.assertEqual([command[:2] for command in calls], [["git", "fetch"], ["git", "checkout"]])
                self.assertFalse(any("-m" in command for command in calls))

    def test_old_collector_cli_preflight_stops_before_combine_or_provider_calls(self):
        cases = [
            (US_COLLECTION_NOTEBOOK, "scripts.build_us_price_metrics_overlay_chunked"),
            (KR_COLLECTION_NOTEBOOK, "scripts.build_kr_price_metrics_overlay_chunked"),
        ]
        for path, collector_module in cases:
            with self.subTest(path=path.name):
                calls: list[tuple[list[str], str]] = []

                def old_cli_runner(command, label, _cwd):
                    calls.append((command, label))
                    if label == "resolved HEAD":
                        return SimpleNamespace(stdout="old-main-sha\n")
                    if label == "checkout status":
                        return SimpleNamespace(stdout="## HEAD (no branch)\n")
                    if label == "collector module CLI preflight":
                        return SimpleNamespace(stdout="usage: old collector --out-runtime\n")
                    return SimpleNamespace(stdout="")

                namespace = {
                    "run_visible": old_cli_runner,
                    "REPO_ROOT": REPO_ROOT,
                    "sys": SimpleNamespace(executable=sys.executable),
                    "COLLECTOR_MODULE": collector_module,
                    "COMBINE_MODULE": "scripts.combine_unused",
                    "REQUIRED_COLLECTOR_OPTIONS": {
                        "--out-raw", "--retrieved-at", "--resume", "--as-of-included", "--years"
                    },
                }
                exec(bootstrap_function(path, "checkout_and_preflight"), namespace)
                collector_file = REPO_ROOT / "scripts" / f"{collector_module.rsplit('.', 1)[-1]}.py"
                with self.assertRaisesRegex(RuntimeError, "missing CLI options"):
                    namespace["checkout_and_preflight"]("branch", collector_file)
                labels = [label for _command, label in calls]
                self.assertIn("collector module CLI preflight", labels)
                self.assertNotIn("combine module CLI preflight", labels)
                self.assertFalse(any("20-asset" in label for label in labels))

    def test_visible_runner_prints_failure_diagnostics(self):
        namespace = {
            "Path": Path,
            "subprocess": SimpleNamespace(
                PIPE=-1,
                run=mock.Mock(return_value=SimpleNamespace(returncode=2, stdout="mock stdout\n", stderr="mock stderr\n")),
            ),
        }
        exec(bootstrap_function(US_COLLECTION_NOTEBOOK, "run_visible"), namespace)
        output = io.StringIO()
        with contextlib.redirect_stdout(output), self.assertRaisesRegex(RuntimeError, "exit status 2"):
            namespace["run_visible"](["python", "-m", "broken"], "mock failure", REPO_ROOT)
        rendered = output.getvalue()
        for expected in ["command", "cwd", "returnCode", "mock stdout", "mock stderr"]:
            self.assertIn(expected, rendered)

    def test_collection_notebooks_freshen_only_smoke_directory(self):
        for path in [US_COLLECTION_NOTEBOOK, KR_COLLECTION_NOTEBOOK]:
            with self.subTest(path=path.name):
                sources = collection_code_sources(path)
                setup = next(source for source in sources if "smokeOutputMode" in source)
                smoke = next(source for source in sources if "20-asset smoke" in source)
                chunks = next(source for source in sources if "range(0," in source)
                self.assertIn("smoke_resolved.parent != root_resolved", setup)
                self.assertIn("shutil.rmtree(smoke_resolved)", setup)
                self.assertIn("'smokeOutputMode': 'fresh'", setup)
                self.assertNotIn("--resume", smoke)
                self.assertIn("--resume", chunks)

    def test_one_click_prepares_existing_contract_and_keeps_review_only_flags(self):
        payload = NOTEBOOK_PATH.read_text(encoding="utf-8")
        code = "\n".join(collection_code_sources(NOTEBOOK_PATH))
        self.assertIn("scripts.prepare_monthly_metrics_candidate_inputs", payload)
        self.assertIn('[sys.executable, "-m", PREPARE_MODULE, "--help"]', code)
        self.assertIn("internal_preview_review_only", payload)
        self.assertIn("RUN_STEP114_2Y_INTERNAL_PREVIEW", payload)
        self.assertIn("us_raw_daily_prices.csv", payload)
        self.assertIn("kr_raw_daily_prices.csv", payload)
        self.assertIn("kr_price_metrics_overlay.csv", payload)


if __name__ == "__main__":
    unittest.main()
