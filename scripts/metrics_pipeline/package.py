from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


def write_deterministic_zip(zip_path: Path, files: list[Path]) -> None:
    fixed_timestamp = (2026, 7, 14, 0, 0, 0)
    with ZipFile(zip_path, "w", compression=ZIP_DEFLATED) as archive:
        for file_path in sorted(files, key=lambda item: item.name):
            info = ZipInfo(file_path.name, fixed_timestamp)
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, file_path.read_bytes())
