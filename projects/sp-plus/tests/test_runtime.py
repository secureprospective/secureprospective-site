import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "runtime"))
os.environ["SPPLUS_ROOT"] = str(ROOT)
os.environ["SPPLUS_PRINTER_FIXTURE"] = "1"

import spplus_rpc  # noqa: E402


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="sp-plus-test-")
        spplus_rpc.STATE_DIR = Path(self.tmp.name)
        spplus_rpc.STATE_PATH = spplus_rpc.STATE_DIR / "printer-fixture.json"
        spplus_rpc.EVENTS_PATH = spplus_rpc.STATE_DIR / "events.jsonl"
        spplus_rpc.ensure_state()

    def tearDown(self):
        self.tmp.cleanup()

    def test_sanitized_snapshot_has_no_paths_or_credentials(self):
        snapshot = spplus_rpc.sanitized_snapshot()
        text = json.dumps(snapshot)
        self.assertNotIn("/home/", text)
        self.assertNotIn("password", text.lower())
        self.assertNotIn("client", text.lower())
        self.assertEqual(snapshot["printer"]["name"], "Advisor Test Printer")

    def test_printer_workflow_requires_approval_and_verifies(self):
        diagnosis = spplus_rpc.rpc("diagnose_printer", {})
        self.assertEqual(diagnosis["provider"], "deterministic-test-provider")
        with self.assertRaisesRegex(ValueError, "approval"):
            spplus_rpc.rpc("run_remediation", {})
        approval = spplus_rpc.rpc("approve_remediation", {})
        result = spplus_rpc.rpc("run_remediation", {"approval_id": approval["approval_id"]})
        self.assertTrue(result["ok"])
        self.assertTrue(spplus_rpc.rpc("verify_printer", {})["verified"])

    def test_tampered_playbook_is_blocked(self):
        original = spplus_rpc.PLAYBOOK_PATH.read_bytes()
        try:
            spplus_rpc.PLAYBOOK_PATH.write_bytes(original + b"\n")
            with self.assertRaisesRegex(ValueError, "integrity"):
                spplus_rpc.rpc("run_remediation", {"approval_id": "test"})
        finally:
            spplus_rpc.PLAYBOOK_PATH.write_bytes(original)


if __name__ == "__main__":
    unittest.main()
