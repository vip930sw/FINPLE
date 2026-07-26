from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from scripts.export_finple_app_preview import create_deterministic_zip
from scripts.metrics_pipeline.tests.test_production_app_export_staging import (
    make_production_export,
)
from scripts.recover_production_app_export_source import (
    ArtifactSnapshot,
    CANDIDATE_PACKAGE_HASH,
    CANDIDATE_ZIP_SHA256,
    EXPECTED_COUNTS,
    EXPORTER_COMMAND,
    EXPORTER_VERSION,
    GitState,
    RECEIPT_FIELDS,
    RecoveryDependencies,
    RecoveryError,
    SOURCE_GIT_MAIN_SHA,
    _build_export_environment,
    _validate_fixed_bindings,
    atomic_write_receipt,
    build_parser,
    compare_artifacts,
    exporter_argv,
    main,
    recover_production_app_export_source,
    run_exporter_once,
    validate_receipt_contract,
)
from scripts.stage_app_preview_vercel import sha256_file


FIXED_TIME = datetime(2026, 7, 26, 0, 0, 0, tzinfo=timezone.utc)


class FakeExporter:
    def __init__(self, *, fail_label: str | None = None) -> None:
        self.fail_label = fail_label
        self.calls: list[dict[str, object]] = []

    def __call__(
        self,
        run_label: str,
        source_worktree: Path,
        candidate_zip: Path,
        output_dir: Path,
        environment: dict[str, str],
    ) -> dict[str, object]:
        self.calls.append(
            {
                "runLabel": run_label,
                "sourceWorktree": source_worktree,
                "candidateZip": candidate_zip,
                "outputDir": output_dir,
                "environment": dict(environment),
            }
        )
        if self.fail_label == run_label:
            raise RuntimeError(f"synthetic Run {run_label} failure")
        bundle = make_production_export(output_dir)
        archive = output_dir / "export.zip"
        create_deterministic_zip(bundle, archive)
        return {"status": "ok", "zipSha256": sha256_file(archive)}


def _candidate_evidence() -> dict[str, object]:
    return {
        "ok": True,
        "zipPackageSha256": CANDIDATE_ZIP_SHA256,
        "candidatePackageHash": CANDIDATE_PACKAGE_HASH,
    }


def _valid_manifest() -> dict[str, object]:
    asset_counts = [EXPECTED_COUNTS["monthlyReturnAssetCount"] // 64] * 64
    row_counts = [EXPECTED_COUNTS["monthlyReturnRowCount"] // 64] * 64
    for index in range(EXPECTED_COUNTS["monthlyReturnAssetCount"] % 64):
        asset_counts[index] += 1
    for index in range(EXPECTED_COUNTS["monthlyReturnRowCount"] % 64):
        row_counts[index] += 1
    shards = [
        {
            "shardId": f"{index:02d}",
            "path": f"monthly-returns/monthly-returns-{index:02d}.json",
            "assetCount": asset_counts[index],
            "rowCount": row_counts[index],
            "sha256": f"{index:064x}",
            "sizeBytes": index + 1,
        }
        for index in range(64)
    ]
    return {
        "sourceCandidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "assetCount": 6029,
        "marketAssetCounts": {"KR": 3000, "US": 3029},
        "rawMissingAssetCount": 16,
        "monthlyReturnAssetCount": 5347,
        "monthlyReturnRowCount": 701485,
        "metricDataThroughMonth": "2026-06",
        "shardCount": 64,
        "shardInventory": shards,
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
    }


def _write(path: Path, data: bytes) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def _comparison_snapshot(
    root: Path,
    *,
    zip_bytes: bytes = b"zip",
    manifest_bytes: bytes = b"manifest",
    overlay_bytes: bytes = b"overlay",
    index_bytes: bytes = b"index",
    shard_bytes: bytes = b"shard",
) -> ArtifactSnapshot:
    bundle = root / "bundle"
    archive = _write(root / "bundle.zip", zip_bytes)
    manifest_path = _write(bundle / "app-preview-manifest.json", manifest_bytes)
    overlay_path = _write(bundle / "metrics-overlay.json", overlay_bytes)
    index_path = _write(bundle / "monthly-returns-index.json", index_bytes)
    shard_path = _write(bundle / "shard.json", shard_bytes)
    manifest = {
        "shardCount": 1,
        "shardInventory": [
            {
                "shardId": "00",
                "path": "shard.json",
                "assetCount": 1,
                "rowCount": 1,
                "sha256": "a" * 64,
                "sizeBytes": len(shard_bytes),
            }
        ],
    }
    inventory = tuple(
        {
            "path": path.relative_to(bundle).as_posix(),
            "sha256": "b" * 64,
            "sizeBytes": path.stat().st_size,
        }
        for path in sorted(bundle.rglob("*"))
        if path.is_file()
    )
    return ArtifactSnapshot(
        zip_path=archive,
        bundle_root=bundle,
        manifest_path=manifest_path,
        overlay_path=overlay_path,
        monthly_index_path=index_path,
        manifest=manifest,
        complete_file_inventory=inventory,
        complete_file_inventory_hash="c" * 64,
    )


class ProductionSourceRecoveryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = Path(tempfile.mkdtemp(prefix="finple-source-recovery-test-"))
        self.current_checkout = self.temp / "current-checkout"
        self.source_worktree = self.temp / "source-worktree"
        self.current_checkout.mkdir()
        self.source_worktree.mkdir()
        self.candidate_zip = self.temp / "candidate.zip"
        self.candidate_zip.write_bytes(b"synthetic candidate fixture")
        self.run_a = self.temp / "run-a"
        self.run_b = self.temp / "run-b"
        self.receipt = self.temp / "receipt.json"
        self.git_state = GitState(
            head=SOURCE_GIT_MAIN_SHA,
            detached=True,
            status="",
        )
        self.git_reads: list[Path] = []
        self.exporter = FakeExporter()

    def tearDown(self) -> None:
        shutil.rmtree(self.temp, ignore_errors=True)

    def git_reader(self, source: Path) -> GitState:
        self.git_reads.append(source)
        return self.git_state

    def dependencies(
        self,
        *,
        exporter: FakeExporter | None = None,
        git_reader=None,
        candidate_hash: str = CANDIDATE_ZIP_SHA256,
        candidate_verifier=None,
    ) -> RecoveryDependencies:
        return RecoveryDependencies(
            git_state_reader=git_reader or self.git_reader,
            candidate_verifier=candidate_verifier or (lambda _path: _candidate_evidence()),
            candidate_hash_reader=lambda _path: candidate_hash,
            exporter_runner=exporter or self.exporter,
            clock=lambda: FIXED_TIME,
            current_checkout=self.current_checkout,
        )

    def recover(self, **overrides):
        arguments = {
            "source_worktree": self.source_worktree,
            "candidate_zip": self.candidate_zip,
            "run_a_dir": self.run_a,
            "run_b_dir": self.run_b,
            "receipt_output": self.receipt,
            "operator_id": "operator.fixture",
            "expected_source_git_sha": SOURCE_GIT_MAIN_SHA,
            "expected_candidate_zip_sha256": CANDIDATE_ZIP_SHA256,
            "expected_candidate_package_hash": CANDIDATE_PACKAGE_HASH,
            "dependencies": self.dependencies(),
        }
        arguments.update(overrides)
        return recover_production_app_export_source(**arguments)

    def assert_blocked(self, code: str, **overrides) -> None:
        with self.assertRaisesRegex(RecoveryError, f"^{code}$"):
            self.recover(**overrides)
        self.assertFalse(self.receipt.exists())

    def test_cli_requires_all_explicit_operator_inputs(self) -> None:
        required_destinations = {
            action.dest
            for action in build_parser()._actions
            if action.required
        }
        self.assertEqual(
            required_destinations,
            {
                "source_worktree",
                "candidate_zip",
                "run_a_dir",
                "run_b_dir",
                "receipt_output",
                "operator_id",
                "expected_source_git_sha",
                "expected_candidate_zip_sha256",
                "expected_candidate_package_hash",
            },
        )

    def test_export_environment_overrides_ambient_bytecode_setting(self) -> None:
        with patch.dict(os.environ, {"PYTHONDONTWRITEBYTECODE": "0"}):
            environment = _build_export_environment()
        self.assertEqual(environment["PYTHONDONTWRITEBYTECODE"], "1")
        self.assertEqual(environment["PYTHONHASHSEED"], "0")

    def test_exporter_argv_and_receipt_command_pin_bytecode_prevention(self) -> None:
        argv = exporter_argv(self.candidate_zip, self.run_a)
        self.assertEqual(
            argv[:4],
            [
                sys.executable,
                "-B",
                "-m",
                "scripts.export_finple_app_preview",
            ],
        )
        self.assertEqual(
            EXPORTER_COMMAND,
            "python -B -m scripts.export_finple_app_preview "
            "--input-package <candidate-zip> --output-dir <empty-output> "
            "--shard-count 64 --max-rows-per-shard 12000 "
            "--target-shard-bytes 1048576",
        )

    def test_real_subprocess_module_import_creates_no_bytecode_and_keeps_git_clean(self) -> None:
        source = self.temp / "real-subprocess-source"
        module_directory = source / "scripts"
        module_directory.mkdir(parents=True)
        (module_directory / "__init__.py").write_text("", encoding="utf-8")
        (module_directory / "export_finple_app_preview.py").write_text(
            "import json\nprint(json.dumps({'status': 'ok'}))\n",
            encoding="utf-8",
        )
        subprocess.run(
            ["git", "init", str(source)],
            check=True,
            capture_output=True,
            text=True,
        )
        subprocess.run(
            ["git", "-C", str(source), "add", "scripts"],
            check=True,
            capture_output=True,
            text=True,
        )
        subprocess.run(
            [
                "git",
                "-C",
                str(source),
                "-c",
                "user.name=FINPLE Fixture",
                "-c",
                "user.email=fixture@finple.invalid",
                "commit",
                "-m",
                "fixture",
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        result = run_exporter_once(
            "a",
            source,
            self.candidate_zip,
            self.temp / "real-subprocess-output",
            _build_export_environment(),
        )

        self.assertEqual(result, {"status": "ok"})
        self.assertEqual(list(source.rglob("__pycache__")), [])
        self.assertEqual(list(source.rglob("*.pyc")), [])
        status = subprocess.run(
            ["git", "-C", str(source), "status", "--porcelain=v1", "--untracked-files=all"],
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(status.stdout, "")

    def test_failure_stdout_contains_only_safe_status_fields(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            exit_code = main(
                [
                    "--source-worktree",
                    str(self.source_worktree),
                    "--candidate-zip",
                    str(self.candidate_zip),
                    "--run-a-dir",
                    str(self.run_a),
                    "--run-b-dir",
                    str(self.run_b),
                    "--receipt-output",
                    str(self.receipt),
                    "--operator-id",
                    "operator.fixture",
                    "--expected-source-git-sha",
                    "0" * 40,
                    "--expected-candidate-zip-sha256",
                    CANDIDATE_ZIP_SHA256,
                    "--expected-candidate-package-hash",
                    CANDIDATE_PACKAGE_HASH,
                ]
            )
        self.assertEqual(exit_code, 1)
        payload = json.loads(output.getvalue())
        self.assertEqual(
            set(payload),
            {"status", "reasonCode", "receiptCreated"},
        )
        self.assertEqual(payload["status"], "blocked")
        self.assertFalse(payload["receiptCreated"])
        self.assertNotIn(str(self.temp), output.getvalue())

    def test_wrong_head_non_detached_and_dirty_worktree_fail_before_export(self) -> None:
        states = {
            "source_worktree_head_mismatch": GitState("0" * 40, True, ""),
            "source_worktree_not_detached": GitState(SOURCE_GIT_MAIN_SHA, False, ""),
            "source_worktree_dirty": GitState(SOURCE_GIT_MAIN_SHA, True, " M file\n"),
        }
        for code, state in states.items():
            with self.subTest(code=code):
                self.assert_blocked(
                    code,
                    dependencies=self.dependencies(git_reader=lambda _path, state=state: state),
                )
                self.assertEqual(self.exporter.calls, [])

    def test_wrong_candidate_zip_sha_fails_before_package_verification(self) -> None:
        verifier_called = False

        def verifier(_path: Path) -> dict[str, object]:
            nonlocal verifier_called
            verifier_called = True
            return _candidate_evidence()

        self.assert_blocked(
            "candidate_zip_sha256_mismatch",
            dependencies=self.dependencies(
                candidate_hash="0" * 64,
                candidate_verifier=verifier,
            ),
        )
        self.assertFalse(verifier_called)
        self.assertEqual(self.exporter.calls, [])

    def test_same_run_directory_and_repository_contained_outputs_fail(self) -> None:
        self.assert_blocked("run_a_run_b_path_overlap", run_b_dir=self.run_a)
        contained = self.current_checkout / "output"
        self.assert_blocked("current_checkout_run_a_path_overlap", run_a_dir=contained)
        contained_receipt = self.current_checkout / "receipt.json"
        self.assert_blocked(
            "current_checkout_receipt_path_overlap",
            receipt_output=contained_receipt,
        )
        nested_source = self.current_checkout / "nested-source"
        nested_source.mkdir()
        self.assert_blocked(
            "current_checkout_source_worktree_path_overlap",
            source_worktree=nested_source,
        )
        self.assertEqual(self.exporter.calls, [])

    def test_non_empty_output_and_containment_aliases_fail(self) -> None:
        self.run_a.mkdir()
        (self.run_a / "existing.txt").write_text("do not overwrite", encoding="utf-8")
        self.assert_blocked("run_a_not_empty")
        self.assertEqual(
            (self.run_a / "existing.txt").read_text(encoding="utf-8"),
            "do not overwrite",
        )
        self.assertEqual(self.exporter.calls, [])

    def test_link_boundaries_and_non_regular_candidate_are_rejected(self) -> None:
        with patch(
            "scripts.recover_production_app_export_source._is_link_or_junction",
            side_effect=lambda path: Path(path) == self.source_worktree,
        ):
            self.assert_blocked("source_worktree_link_boundary_invalid")
        with patch(
            "scripts.recover_production_app_export_source._is_link_or_junction",
            side_effect=lambda path: Path(path) == self.candidate_zip,
        ):
            self.assert_blocked("candidate_zip_link_boundary_invalid")
        candidate_directory = self.temp / "directory.zip"
        candidate_directory.mkdir()
        self.assert_blocked(
            "candidate_zip_not_regular",
            candidate_zip=candidate_directory,
        )

    def test_exporter_run_a_failure_has_no_retry_and_no_receipt(self) -> None:
        failing = FakeExporter(fail_label="a")
        self.assert_blocked(
            "exporter_run_a_failed",
            dependencies=self.dependencies(exporter=failing),
        )
        self.assertEqual([call["runLabel"] for call in failing.calls], ["a"])
        self.assertFalse(self.run_b.joinpath("export.zip").exists())

    def test_source_dirty_after_run_a_blocks_run_b_without_cleanup_or_receipt(self) -> None:
        calls: list[str] = []
        bytecode = (
            self.source_worktree
            / "scripts"
            / "__pycache__"
            / "export_finple_app_preview.fixture.pyc"
        )

        def dirty_exporter(
            run_label: str,
            _source_worktree: Path,
            _candidate_zip: Path,
            _output_dir: Path,
            _environment: dict[str, str],
        ) -> dict[str, object]:
            calls.append(run_label)
            bytecode.parent.mkdir(parents=True, exist_ok=True)
            bytecode.write_bytes(b"synthetic bytecode")
            return {"status": "ok"}

        def observed_git_state(_source: Path) -> GitState:
            status = (
                "?? scripts/__pycache__/export_finple_app_preview.fixture.pyc\n"
                if bytecode.exists()
                else ""
            )
            return GitState(SOURCE_GIT_MAIN_SHA, True, status)

        self.assert_blocked(
            "source_worktree_dirty",
            dependencies=self.dependencies(
                exporter=dirty_exporter,
                git_reader=observed_git_state,
            ),
        )
        self.assertEqual(calls, ["a"])
        self.assertTrue(bytecode.is_file())
        self.assertEqual(list(self.run_b.iterdir()), [])
        self.assertFalse(self.receipt.exists())

    def test_exporter_run_b_failure_does_not_approve_run_a(self) -> None:
        failing = FakeExporter(fail_label="b")
        self.assert_blocked(
            "exporter_run_b_failed",
            dependencies=self.dependencies(exporter=failing),
        )
        self.assertEqual([call["runLabel"] for call in failing.calls], ["a", "b"])
        self.assertTrue(self.run_a.joinpath("export.zip").is_file())
        self.assertFalse(self.receipt.exists())

    def test_exporter_reported_zip_hash_mismatch_is_blocked(self) -> None:
        base_exporter = FakeExporter()

        def wrong_report(
            run_label: str,
            source_worktree: Path,
            candidate_zip: Path,
            output_dir: Path,
            environment: dict[str, str],
        ) -> dict[str, object]:
            result = base_exporter(
                run_label,
                source_worktree,
                candidate_zip,
                output_dir,
                environment,
            )
            if run_label == "b":
                result["zipSha256"] = "0" * 64
            return result

        self.assert_blocked(
            "run_b_reported_zip_sha256_mismatch",
            dependencies=replace(
                self.dependencies(),
                exporter_runner=wrong_report,
            ),
        )
        self.assertFalse(self.receipt.exists())

    def test_export_zip_must_exactly_match_its_bundle(self) -> None:
        base_exporter = FakeExporter()

        def mismatched_zip(
            run_label: str,
            source_worktree: Path,
            candidate_zip: Path,
            output_dir: Path,
            environment: dict[str, str],
        ) -> dict[str, object]:
            result = base_exporter(
                run_label,
                source_worktree,
                candidate_zip,
                output_dir,
                environment,
            )
            archive = output_dir / "export.zip"
            if run_label == "a":
                with zipfile.ZipFile(archive, "a") as output:
                    output.writestr("unexpected.txt", b"not in bundle")
                result["zipSha256"] = sha256_file(archive)
            return result

        self.assert_blocked(
            "export_zip_bundle_mismatch",
            dependencies=replace(
                self.dependencies(),
                exporter_runner=mismatched_zip,
            ),
        )
        self.assertFalse(self.receipt.exists())

    def test_exact_component_mismatches_all_fail_closed(self) -> None:
        cases = {
            "export_zip_mismatch": {"zip_bytes": b"different"},
            "source_manifest_mismatch": {"manifest_bytes": b"different"},
            "metrics_overlay_mismatch": {"overlay_bytes": b"different"},
            "monthly_index_mismatch": {"index_bytes": b"different"},
            "shard_bytes_mismatch": {"shard_bytes": b"other"},
        }
        for code, mutation in cases.items():
            with self.subTest(code=code):
                case_root = self.temp / code
                left = _comparison_snapshot(case_root / "a")
                right = _comparison_snapshot(case_root / "b", **mutation)
                if code != "export_zip_mismatch":
                    right.zip_path.write_bytes(left.zip_path.read_bytes())
                with self.assertRaisesRegex(RecoveryError, f"^{code}$"):
                    compare_artifacts(left, right)

    def test_shard_inventory_and_complete_inventory_mismatches_fail_closed(self) -> None:
        case_root = self.temp / "inventory-cases"
        left = _comparison_snapshot(case_root / "a")
        right = _comparison_snapshot(case_root / "b")
        changed_manifest = {
            **right.manifest,
            "shardInventory": [
                {
                    **right.manifest["shardInventory"][0],
                    "rowCount": 2,
                }
            ],
        }
        with self.assertRaisesRegex(RecoveryError, "^shard_inventory_mismatch$"):
            compare_artifacts(left, replace(right, manifest=changed_manifest))
        changed_inventory = (
            {
                **right.complete_file_inventory[0],
                "sizeBytes": int(right.complete_file_inventory[0]["sizeBytes"]) + 1,
            },
            *right.complete_file_inventory[1:],
        )
        with self.assertRaisesRegex(RecoveryError, "^complete_file_inventory_mismatch$"):
            compare_artifacts(
                left,
                replace(right, complete_file_inventory=changed_inventory),
            )

    def test_fixed_count_or_candidate_binding_mismatch_fails(self) -> None:
        for field, value in {
            "sourceCandidatePackageHash": "0" * 64,
            "assetCount": 6028,
            "rawMissingAssetCount": 15,
            "monthlyReturnAssetCount": 5346,
            "monthlyReturnRowCount": 701484,
            "metricDataThroughMonth": "2026-05",
            "shardCount": 63,
        }.items():
            with self.subTest(field=field):
                manifest = _valid_manifest()
                manifest[field] = value
                with self.assertRaisesRegex(
                    RecoveryError,
                    "^source_artifact_count_or_binding_mismatch$",
                ):
                    _validate_fixed_bindings(manifest)

    def test_valid_match_uses_same_environment_writes_schema_receipt_atomically_and_keeps_git(self) -> None:
        source_before = sorted(path.name for path in self.source_worktree.iterdir())
        with patch(
            "scripts.recover_production_app_export_source.os.replace",
            wraps=os.replace,
        ) as replace_spy:
            result = self.recover()
        self.assertEqual(
            result,
            {
                "status": "source_artifact_recovered",
                "reasonCode": "deterministic_match",
                "deterministicMatch": True,
                "receiptCreated": True,
            },
        )
        self.assertEqual([call["runLabel"] for call in self.exporter.calls], ["a", "b"])
        self.assertEqual(
            self.exporter.calls[0]["environment"],
            self.exporter.calls[1]["environment"],
        )
        self.assertEqual(
            self.exporter.calls[0]["environment"]["PYTHONHASHSEED"],
            "0",
        )
        self.assertEqual(
            self.exporter.calls[0]["environment"]["PYTHONDONTWRITEBYTECODE"],
            "1",
        )
        self.assertEqual(replace_spy.call_count, 1)
        self.assertTrue(self.receipt.is_file())
        self.assertFalse(
            any(
                path.name.endswith(".tmp") or path.name.endswith(".lock")
                for path in self.temp.iterdir()
            )
        )
        receipt = json.loads(self.receipt.read_text(encoding="utf-8"))
        self.assertEqual(set(receipt), RECEIPT_FIELDS)
        self.assertEqual(receipt["sourceGitMainSha"], SOURCE_GIT_MAIN_SHA)
        self.assertEqual(receipt["candidateZipSha256"], CANDIDATE_ZIP_SHA256)
        self.assertEqual(receipt["candidatePackageHash"], CANDIDATE_PACKAGE_HASH)
        self.assertEqual(receipt["exporterCommand"], EXPORTER_COMMAND)
        self.assertEqual(receipt["exporterVersion"], EXPORTER_VERSION)
        self.assertEqual(receipt["runAZipSha256"], receipt["runBZipSha256"])
        self.assertEqual(receipt["generatedAt"], "2026-07-26T00:00:00Z")
        self.assertEqual(receipt["operatorId"], "operator.fixture")
        self.assertIs(receipt["deterministicMatch"], True)
        self.assertEqual(len(receipt["completeShardInventory"]), 64)
        validate_receipt_contract(receipt)
        invalid_receipt = {**receipt, "absolutePath": str(self.temp)}
        with self.assertRaisesRegex(RecoveryError, "^receipt_schema_invalid$"):
            validate_receipt_contract(invalid_receipt)
        self.assertEqual(
            sorted(path.name for path in self.source_worktree.iterdir()),
            source_before,
        )
        self.assertEqual(len(self.git_reads), 4)

    def test_atomic_receipt_write_preserves_another_operator_lock(self) -> None:
        lock_path = self.receipt.with_name(f".{self.receipt.name}.lock")
        lock_path.write_text("held by another operator", encoding="utf-8")
        with self.assertRaisesRegex(RecoveryError, "^receipt_write_lock_exists$"):
            atomic_write_receipt(self.receipt, {"deterministicMatch": True})
        self.assertEqual(
            lock_path.read_text(encoding="utf-8"),
            "held by another operator",
        )
        self.assertFalse(self.receipt.exists())

    def test_failure_never_creates_false_receipt_or_release_manifest(self) -> None:
        failing = FakeExporter(fail_label="b")
        self.assert_blocked(
            "exporter_run_b_failed",
            dependencies=self.dependencies(exporter=failing),
        )
        self.assertFalse(self.receipt.exists())
        self.assertEqual(list(self.temp.rglob("production-app-export-release.json")), [])


if __name__ == "__main__":
    unittest.main()
