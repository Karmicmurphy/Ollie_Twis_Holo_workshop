from __future__ import annotations

import tarfile
import zipfile
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"companion"))

from source_yard_inventory import inventory_source_yard


def test_inventory_hashes_files_and_lists_archives_without_extracting(tmp_path: Path):
    (tmp_path/"a.txt").write_text("alpha",encoding="utf-8")
    with zipfile.ZipFile(tmp_path/"bundle.zip","w") as z:
        z.writestr("inside/file.txt","hello")
    tar_src=tmp_path/"tar-source.txt"
    tar_src.write_text("tar-data",encoding="utf-8")
    with tarfile.open(tmp_path/"bundle.tar","w") as t:
        t.add(tar_src,arcname="nested/tar-source.txt")

    result=inventory_source_yard(tmp_path)
    by_name={item["name"]:item for item in result["files"]}

    assert result["readOnly"] is True
    assert by_name["a.txt"]["hashState"]=="HASHED"
    assert by_name["bundle.zip"]["archive"]["members"][0]["name"]=="inside/file.txt"
    assert any(m["name"]=="nested/tar-source.txt" for m in by_name["bundle.tar"]["archive"]["members"])
    assert result["privacyBoundary"]["contentsCopied"] is False
    assert result["privacyBoundary"]["archiveMembersExtracted"] is False


def test_inventory_skips_secret_like_files(tmp_path: Path):
    (tmp_path/".env").write_text("SECRET=1",encoding="utf-8")
    (tmp_path/"normal.txt").write_text("ok",encoding="utf-8")
    result=inventory_source_yard(tmp_path)
    names={x["name"] for x in result["files"]}
    assert "normal.txt" in names
    assert ".env" not in names
    assert result["skippedCount"] >= 1


def test_inventory_prunes_skipped_directories_before_descent(tmp_path: Path):
    blocked=tmp_path/"blocked"
    blocked.mkdir()
    (blocked/"should-never-be-seen.txt").write_text("nope",encoding="utf-8")
    (tmp_path/"visible.txt").write_text("yes",encoding="utf-8")

    visited=[]
    def policy(path: Path):
        visited.append(str(path))
        if path.name=="blocked":
            return True,"test blocked directory"
        return False,""

    result=inventory_source_yard(tmp_path,skip_policy=policy)
    names={x["name"] for x in result["files"]}
    assert "visible.txt" in names
    assert "should-never-be-seen.txt" not in names
    assert not any("should-never-be-seen.txt" in p for p in visited)
