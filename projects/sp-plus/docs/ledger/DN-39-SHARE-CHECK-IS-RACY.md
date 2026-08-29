# DN-39 — the office folder check does not actually check the folder

**Found:** 2026-08-29, by the DN-38 headless self-test, on the Dell.
**Severity:** HIGH — advisor-facing, and it sends them the wrong way.
**Status:** OPEN. Not fixed. Do not ship ISO 44 believing this test works.

## Symptom

The self-test ran `check-share` against a reachable host and an unroutable one
(203.0.113.1, TEST-NET-3). Both returned the SAME advisor-visible message:

    The server was reached, but that shared folder was not found.
    Check the folder name.

For 203.0.113.1 that sentence is simply false. Nothing was reached.

## Cause

`ShareCheckWorker.run()` calls:

    location.mount_enclosing_volume(Gio.MountMountFlags.NONE, operation, None)

`mount_enclosing_volume` is an ASYNCHRONOUS GIO call. It takes a callback and a
`_finish` counterpart, starts the operation, and returns immediately. The code
treats it as synchronous, so it never waits for the mount to succeed or fail and
never inspects the outcome. Confirmed directly on the Dell: the call returns with
NO exception for both an unroutable IP and a live host.

Execution then falls through to `find_enclosing_mount`, which fails because
nothing has mounted yet, and `_message_for_error` substring-matches that error
into the "not found" bucket -- the third branch, because the text contains
"not found" and none of host/network/connect/timed out/unreachable.

So the check is racy by construction. Its result does not depend on the share.

## Why it matters

An advisor whose office server is down is told to check the FOLDER NAME. They
will retype the folder, not look at the network or call the office. The check is
worse than absent: absent would leave them uncertain, this points them away from
the cause with a confident sentence.

## Fix direction (NOT yet implemented, needs deciding)

1. Use the async API properly: pass a callback, run a GLib main loop with a
   timeout, and read the real outcome from `mount_enclosing_volume_finish`.
2. And/or probe reachability first (TCP 445, short timeout) so "cannot reach the
   server" is decided BEFORE any GIO error-string classification.
3. `_message_for_error` classifies by substring in a fixed order and is fragile
   to GIO wording and translations. Prefer the typed `Gio.IOErrorEnum` where one
   exists rather than matching English words.

## How it was found

Not by reading the code, and not by four GUI QC dispatches -- those produced 24
UNVERIFIED results. It fell out of the first run of the headless self-test,
because that harness could finally trigger the verb and read back what the page
would show.
