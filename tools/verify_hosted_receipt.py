"""Verify the fixed FRIDAY result offline; never executes or extracts a result."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import zipfile

REQUEST = "request-commissioning-002"
RECIPE = "aios-path-containment-fixture-v1"
CONTROL = "74039e9103848922fa5cb7fbc13f830bd0abb1d7"
MANIFEST = "b160b07429a29e7fe8fe7aa1c237da7dc519fb18201b71b468ee2863c01c1d7b"
REHEARSAL_JOB = "job:644d806c386c213f0a5cc50c"
OWNER = 141688225
LIMIT = 2_000_000
FILES = {"receipt.json": 1_000_000, "source-manifest.json": 200_000,
         "verified-lesson.json": 100_000, "capabilities.py": 100_000}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def pairs(values):
    result = {}
    for key, value in values:
        require(key not in result, "duplicate JSON member")
        result[key] = value
    return result


def load(data):
    return json.loads(data.decode("utf-8"), object_pairs_hook=pairs)


def verify(path, run_id, archive_sha=None, *, binding):
    REQUEST, CONTROL, MANIFEST = (binding[k] for k in ("request_id", "workflow_sha", "manifest_sha256"))
    require(set(binding) == {"request_id", "workflow_sha", "manifest_sha256", "recipe", "owner_github_id"}
            and REQUEST == "request-commissioning-002" and binding["recipe"] == RECIPE
            and binding["owner_github_id"] == OWNER and re.fullmatch(r"[0-9a-f]{40}", CONTROL)
            and MANIFEST == "b160b07429a29e7fe8fe7aa1c237da7dc519fb18201b71b468ee2863c01c1d7b",
            "reviewed successor binding required")
    require(type(run_id) is int and 0 < run_id < 2**53, "invalid original run ID")
    with path.open("rb") as stream:
        data = stream.read(LIMIT + 1)
    require(len(data) <= LIMIT, "proof file exceeds size limit")
    if path.suffix.lower() == ".zip":
        require(re.fullmatch(r"[0-9a-f]{64}", archive_sha or "") and sha(data) == archive_sha,
                "archive digest missing or different from independently recorded digest")
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            require(len(entries) == len(FILES) and {entry.filename for entry in entries} == set(FILES),
                    "unexpected, missing, or duplicate ZIP entry")
            for entry in entries:
                require(entry.file_size <= FILES[entry.filename], "ZIP entry exceeds size limit")
            output = archive.read("capabilities.py")
            envelope = load(archive.read("receipt.json"))
            manifest = load(archive.read("source-manifest.json"))
            lesson = load(archive.read("verified-lesson.json"))
        download = None
    else:
        require(path.suffix.lower() == ".json" and archive_sha is None,
                "expected a Workshop JSON download or original ZIP")
        download = load(data)
        require(download["request_id"] == REQUEST and download["run_id"] == run_id
                and download["status"] == "COMPLETE", "Workshop download identity differs")
        output = download["output"].encode("utf-8")
        require(len(output) <= FILES["capabilities.py"], "output exceeds size limit")
        envelope, manifest, lesson = (download[k] for k in ("receipt", "manifest", "lesson"))

    dispatch = envelope["dispatch"]
    require(dispatch == {"request_id": REQUEST, "recipe": RECIPE, "owner_github_id": OWNER,
                         "manifest_sha256": MANIFEST, "workflow_sha": CONTROL, "run_id": run_id,
                         "harness_commit": dispatch["harness_commit"],
                         "authentication": "GITHUB_ACTIONS_PROVIDER_ACTOR"}
            and re.fullmatch(r"[0-9a-f]{40}", dispatch["harness_commit"]),
            "receipt does not bind the original run, owner and reviewed request")
    result = envelope["result"]
    receipt = result["receipt"]
    admission = receipt["admission"]
    certificate = receipt["core_result"]["certificate"]
    boundary = certificate["certificate_boundary"]
    job, cert, output_sha = result["job_id"], certificate["certificate_id"], sha(output)
    require(re.fullmatch(r"job:[0-9a-f]+", job) and re.fullmatch(r"cert:[0-9a-f]+", cert)
            and job == receipt["job_id"] == boundary["foundry_job_id"] == manifest["job_id"]
            and result["lesson_id"] == cert
            and result["status"] == "CERTIFIED_AWAITING_HUMAN_REVIEW"
            and result["activation_performed"] is False and result["owner_authenticated"] is True
            and admission["request_id"] == REQUEST and admission["issuer"] == "github"
            and admission["subject"] == str(OWNER) and certificate["verdict"] == "CERTIFIED"
            and boundary["candidate_path"] == "src/untethered_aios/capabilities.py"
            and certificate["evidence"]["final_candidate_matches"] is True
            and output_sha == receipt["certificate_sha256"] == boundary["candidate_sha256"]
            == certificate["evidence"]["final_candidate_sha256"], "certificate or repaired bytes differ")

    original = dict(manifest)
    require(original.pop("dispatch") == dispatch and manifest["files"] == result["candidate_sources"],
            "manifest and receipt binding differ")
    original["job_id"] = REHEARSAL_JOB
    require(sha((json.dumps(original, indent=2) + "\n").encode()) == MANIFEST,
            "source manifest differs from the retained five-repo pin")
    row = lesson["lesson"]
    require(row["job_id"] == job and row["certificate_id"] == cert
            and row["candidate_sha256"] == output_sha and row["authority_grants"] == []
            and sha(json.dumps(row, sort_keys=True, separators=(",", ":")).encode()) == lesson["digest"],
            "retained lesson differs from verified output")
    if download is not None:
        require(download["job_id"] == job and download["certificate_id"] == cert
                and download["output_sha256"] == output_sha, "Workshop summary differs from proof")
    return {"status": "OFFLINE_PROOF_MATCH", "request_id": REQUEST, "run_id": run_id,
            "job_id": job, "certificate_id": cert, "output_sha256": output_sha,
            "archive_digest_matched": archive_sha is not None,
            "provider_actor_reauthenticated": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("proof", type=Path)
    parser.add_argument("--run-id", required=True, type=int)
    parser.add_argument("--archive-sha256", help="Independently recorded GitHub digest for a ZIP")
    parser.add_argument("--binding", required=True, type=Path, help="Reviewed Harness successor receipt, not artifact-supplied authority")
    args = parser.parse_args()
    try:
        approved = load(args.binding.read_bytes())["hosted_fixture"]
        result = verify(args.proof, args.run_id, args.archive_sha256, binding=approved)
    except (OSError, ValueError, TypeError, KeyError, AttributeError,
            zipfile.BadZipFile, NotImplementedError, RuntimeError):
        print("Proof rejected: missing, malformed, or mismatched evidence.", file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
