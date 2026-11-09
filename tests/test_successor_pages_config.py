"""The native Pages build must retain the approved one-run commissioning contract."""
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
BASE_VARS = {
    "TWIS_REMOTE_HULL_MODE": "public-shell",
    "TWIS_ALLOW_AI": "false",
    "TWIS_ALLOW_REMOTE_WRITE": "false",
}


class SuccessorPagesConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "wrangler.jsonc").read_text(encoding="utf-8"))

    def test_existing_pages_identity_and_compatibility_are_preserved(self):
        self.assertEqual(self.config["name"], "ollie-twis-holo-workshop")
        self.assertEqual(self.config["pages_build_output_dir"], "./dist")
        self.assertEqual(self.config["compatibility_date"], "2026-06-18")
        self.assertEqual(set(self.config), {
            "$schema", "name", "pages_build_output_dir", "compatibility_date", "vars", "env",
        })

    def test_production_has_exact_reviewed_control_and_supervised_submission(self):
        production = self.config["env"]["production"]
        self.assertEqual(set(production), {"vars"})
        self.assertEqual(production["vars"], {
            **BASE_VARS,
            "FRIDAY_SUCCESSOR_CONTROL_SHA": "08f86bcfed3a9e41a0cb95ef0112db32082dc479",
            "FRIDAY_SUCCESSOR_READ_ENABLED": "true",
            "FRIDAY_SUCCESSOR_SUBMIT_ENABLED": "true",
        })

    def test_local_and_preview_do_not_receive_successor_settings(self):
        self.assertEqual(self.config["vars"], BASE_VARS)
        self.assertEqual(set(self.config["env"]), {"production"})
        self.assertFalse(any(key.startswith("FRIDAY_SUCCESSOR_") for key in self.config["vars"]))

    def test_credentials_and_other_bindings_remain_provider_managed(self):
        for variables in (self.config["vars"], self.config["env"]["production"]["vars"]):
            self.assertTrue(all(isinstance(value, str) for value in variables.values()))
            self.assertFalse(any(key.startswith("FOUNDATION_") for key in variables))
            self.assertFalse(any("TOKEN" in key or "SECRET" in key for key in variables))


if __name__ == "__main__":
    unittest.main()
