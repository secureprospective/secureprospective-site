import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "runtime"))
os.environ["ADVISOR_OS_ROOT"] = str(ROOT)
os.environ["ADVISOR_PRINTER_FIXTURE"] = "1"

import advisor_rpc  # noqa: E402


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="advisor-os-test-")
        advisor_rpc.STATE_DIR = Path(self.tmp.name)
        advisor_rpc.STATE_PATH = advisor_rpc.STATE_DIR / "printer-fixture.json"
        advisor_rpc.EVENTS_PATH = advisor_rpc.STATE_DIR / "events.jsonl"
        advisor_rpc.ensure_state()

    def tearDown(self):
        self.tmp.cleanup()

    def test_sanitized_snapshot_has_no_paths_or_credentials(self):
        snapshot = advisor_rpc.sanitized_snapshot()
        text = json.dumps(snapshot)
        self.assertNotIn("/home/", text)
        self.assertNotIn("password", text.lower())
        self.assertNotIn("client", text.lower())
        self.assertEqual(snapshot["printer"]["name"], "Advisor Test Printer")

    def test_printer_workflow_requires_approval_and_verifies(self):
        diagnosis = advisor_rpc.rpc("diagnose_printer", {})
        self.assertEqual(diagnosis["provider"], "deterministic-test-provider")
        with self.assertRaisesRegex(ValueError, "approval"):
            advisor_rpc.rpc("run_remediation", {})
        approval = advisor_rpc.rpc("approve_remediation", {})
        result = advisor_rpc.rpc("run_remediation", {"approval_id": approval["approval_id"]})
        self.assertTrue(result["ok"])
        self.assertTrue(advisor_rpc.rpc("verify_printer", {})["verified"])

    def test_tampered_playbook_is_blocked(self):
        original = advisor_rpc.PLAYBOOK_PATH.read_bytes()
        try:
            advisor_rpc.PLAYBOOK_PATH.write_bytes(original + b"\n")
            with self.assertRaisesRegex(ValueError, "integrity"):
                advisor_rpc.rpc("run_remediation", {"approval_id": "test"})
        finally:
            advisor_rpc.PLAYBOOK_PATH.write_bytes(original)


if __name__ == "__main__":
    unittest.main()
