"""Existing owner surface denies unconfigured intake; never invent owner identity."""
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'companion'))
import foundry_bridge
class BridgeTests(unittest.TestCase):
    def test_narrow_envelope_and_loopback_boundary(self):
        with self.assertRaises(ValueError):foundry_bridge.maintenance_request({'subject':'owner'})
        with patch.object(foundry_bridge,'foundry_base_url',return_value='https://example.com'):
            with self.assertRaises(ValueError):foundry_bridge.maintenance_request({'request_id':'test-001','instruction':'test'})
    def test_owner_request_status_is_explicit_in_existing_surface(self):
        script=(ROOT/'app/assets/app.js').read_text()
        self.assertIn('OWNER_INTAKE_NOT_CONFIGURED',script)
        self.assertIn('OWNER_AUTHORIZATION_REQUIRED',script)
        self.assertIn('No automatic re-execution',script)
        self.assertNotIn('owner_github_id',script)
