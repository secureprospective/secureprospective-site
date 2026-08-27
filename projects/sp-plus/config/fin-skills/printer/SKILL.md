---
name: printer
description: Diagnose and repair a printer that has stopped working, using the signed SP+ repair playbook. Use whenever the advisor mentions printing, a printer being offline, or documents not coming out.
---

# Repairing the printer

SP+ runs a small local service on `127.0.0.1:8765` that holds the vetted repair
playbooks. It listens on loopback only and is not reachable from the network.

Talk to it with `curl`. Every call is a POST to `/api/rpc` with `{"method": ...,
"params": {...}}`.

## The sequence

1. **Look first.** `curl -s -XPOST 127.0.0.1:8765/api/rpc -d '{"method":"get_printer_state"}'`
   returns the printer's state and any error code.

2. **Diagnose.** `{"method":"diagnose_printer"}` returns a plain-language summary
   and the recommended next action.

3. **Ask the advisor before repairing.** The playbook changes the machine. Say
   what it will do in one sentence and wait for a yes.

4. **Approve, then run.** `{"method":"approve_remediation"}` returns an
   `approval_id`. Pass it straight into
   `{"method":"run_remediation","params":{"approval_id":"..."}}`. Approvals are
   single-use and expire after ten minutes, so do not hold one.

5. **Verify.** `{"method":"verify_printer"}` confirms the fix and records a test
   page. Always finish with this — "it should work now" is not an answer.

## Notes

- The service verifies the playbook's sha256 before running it and refuses if it
  does not match. If you see an integrity failure, do not work around it: tell
  the advisor the repair is unavailable and that support should be called.
- `{"method":"report"}` returns the history of what has been done on this
  machine. Useful when the advisor asks "did something change?"
- This machine ships a scripted test printer named "Advisor Test Printer". It is
  a test fixture and says so. Do not present it as real hardware.
