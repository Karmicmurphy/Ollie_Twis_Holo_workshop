"""Independent delivery verifier fixtures do not establish provider authentication."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('receipt_verifier_003', ROOT / 'tools/verify_hosted_receipt_003.py')
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class ReceiptVerifierTests(unittest.TestCase):
    def test_old_or_arbitrary_binding_is_not_an_authorization(self):
        for request in ('request-first-001', 'arbitrary'):
            with self.assertRaisesRegex(ValueError, 'reviewed successor binding'):
                verifier.verify(Path('not-read'), 123, binding={
                    'request_id': request, 'workflow_sha': 'a'*40,
                    'manifest_sha256': verifier.MANIFEST, 'owner_github_id': verifier.OWNER,
                    'recipe': verifier.RECIPE})

    @unittest.skipUnless(os.environ.get('FRIDAY_SUCCESSOR_PROOF'), 'retained disposable proof required')
    def test_retained_bytes_and_corruption_with_substituted_provider_fixture(self):
        source = Path(os.environ['FRIDAY_SUCCESSOR_PROOF'])
        read = lambda name: json.loads((source / name).read_text(encoding='utf-8'))
        envelope, manifest = read('receipt.json'), read('source-manifest.json')
        binding = {'request_id': verifier.REQUEST, 'recipe': verifier.RECIPE,
            'owner_github_id': verifier.OWNER, 'manifest_sha256': verifier.MANIFEST,
            'workflow_sha': verifier.CONTROL}
        dispatch = {**binding, 'run_id': 123, 'harness_commit': 'b'*40,
            'authentication': 'GITHUB_ACTIONS_PROVIDER_ACTOR'}
        envelope['dispatch'] = manifest['dispatch'] = dispatch
        for corrupt in (False, True):
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w') as archive:
                archive.writestr('receipt.json', json.dumps(envelope))
                archive.writestr('source-manifest.json', json.dumps(manifest))
                archive.writestr('verified-lesson.json', (source / 'verified-lesson.json').read_bytes())
                archive.writestr('capabilities.py', b'wrong' if corrupt else (source / 'capabilities.py').read_bytes())
            data = buffer.getvalue()
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'proof.zip';path.write_bytes(data)
                if corrupt:
                    with self.assertRaisesRegex(ValueError, 'certificate or repaired bytes differ'):
                        verifier.verify(path, 123, hashlib.sha256(data).hexdigest(), binding=binding)
                else:
                    report = verifier.verify(path, 123, hashlib.sha256(data).hexdigest(), binding=binding)
                    self.assertEqual(report['status'], 'OFFLINE_PROOF_MATCH')
                    self.assertFalse(report['provider_actor_reauthenticated'])


if __name__ == '__main__':
    unittest.main()
