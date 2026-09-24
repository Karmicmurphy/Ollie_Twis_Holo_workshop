from __future__ import annotations

import hashlib
import os
import tarfile
import zipfile
from pathlib import Path
from typing import Any, Callable

from security import should_skip_import_path

DEFAULT_MAX_FILES = int(os.environ.get("TWIS_HOLO_INVENTORY_MAX_FILES", "200000"))
DEFAULT_HASH_LIMIT = int(os.environ.get("TWIS_HOLO_INVENTORY_HASH_LIMIT", str(512 * 1024 * 1024)))

ARCHIVE_SUFFIXES = (
    ".zip", ".tar", ".tgz", ".tar.gz", ".tar.bz2", ".tar.xz",
)


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


def _archive_members(path: Path, max_members: int = 50000) -> dict[str, Any] | None:
    name = path.name.lower()
    try:
        if name.endswith(".zip"):
            with zipfile.ZipFile(path) as z:
                members = [
                    {"name": i.filename, "size": i.file_size, "compressedSize": i.compress_size}
                    for i in z.infolist()[:max_members]
                ]
                return {"kind": "zip", "members": members, "truncated": len(z.infolist()) > max_members}
        if name.endswith((".tar", ".tgz", ".tar.gz", ".tar.bz2", ".tar.xz")):
            members = []
            truncated = False
            with tarfile.open(path, mode="r:*") as t:
                for n, m in enumerate(t):
                    if n >= max_members:
                        truncated = True
                        break
                    members.append({"name": m.name, "size": m.size, "type": "file" if m.isfile() else "other"})
            return {"kind": "tar", "members": members, "truncated": truncated}
    except (OSError, tarfile.TarError, zipfile.BadZipFile) as exc:
        return {"kind": "archive", "error": type(exc).__name__, "members": []}
    return None


def inventory_source_yard(
    root: str | Path,
    *,
    hash_files: bool = True,
    inspect_archives: bool = True,
    max_files: int = DEFAULT_MAX_FILES,
    hash_limit: int = DEFAULT_HASH_LIMIT,
    skip_policy: Callable[[Path], tuple[bool, str]] = should_skip_import_path,
) -> dict[str, Any]:
    source = Path(root).expanduser().resolve()
    if not source.exists():
        raise ValueError("source yard path does not exist")
    if not source.is_dir():
        raise ValueError("source yard path must be a directory")
    if max_files <= 0:
        raise ValueError("max_files must be positive")

    files: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    archive_count = 0
    total_bytes = 0
    truncated = False

    for path in source.rglob("*"):
        skip, reason = skip_policy(path)
        if skip:
            skipped.append({"path": str(path), "reason": reason})
            continue
        if not path.is_file():
            continue
        if len(files) >= max_files:
            truncated = True
            break

        try:
            stat = path.stat()
        except OSError:
            skipped.append({"path": str(path), "reason": "stat failed"})
            continue

        rel = str(path.relative_to(source)).replace("\\", "/")
        item: dict[str, Any] = {
            "relativePath": rel,
            "name": path.name,
            "extension": "".join(path.suffixes).lower(),
            "size": stat.st_size,
            "mtimeNs": stat.st_mtime_ns,
            "sha256": None,
            "hashState": "NOT_REQUESTED" if not hash_files else "PENDING",
        }
        total_bytes += stat.st_size

        if hash_files:
            if stat.st_size <= hash_limit:
                try:
                    item["sha256"] = sha256_file(path)
                    item["hashState"] = "HASHED"
                except OSError:
                    item["hashState"] = "READ_ERROR"
            else:
                item["hashState"] = "SKIPPED_SIZE_LIMIT"

        if inspect_archives and path.name.lower().endswith(ARCHIVE_SUFFIXES):
            archive = _archive_members(path)
            if archive is not None:
                item["archive"] = archive
                archive_count += 1

        files.append(item)

    return {
        "schemaVersion": "source-yard-inventory-v1",
        "root": str(source),
        "readOnly": True,
        "fileCount": len(files),
        "totalBytes": total_bytes,
        "archiveCount": archive_count,
        "skippedCount": len(skipped),
        "truncated": truncated,
        "hashFiles": hash_files,
        "inspectArchives": inspect_archives,
        "files": files,
        "skipped": skipped[:5000],
        "privacyBoundary": {
            "contentsCopied": False,
            "filesExecuted": False,
            "archiveMembersExtracted": False,
            "secretLikeAndBrowserCredentialPathsSkipped": True,
        },
    }
