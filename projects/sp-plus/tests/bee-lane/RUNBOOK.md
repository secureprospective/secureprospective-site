# SP+ TEST LANE — RUNBOOK FOR BEE / LUNA
Version 1 · 2026-08-26 · lives at `~/sp-plus-bee/RUNBOOK.md` on the Beelink

You are running the **test loop** for SP+, a Fedora-44 bootc Linux distribution for
financial advisors. Christopher owns the machine. Headbrain (Claude on CT105) owns
the judgment. **You own the loop.**

---

## THE ONE RULE

**Return evidence, never a verdict.**

Paste the actual lines. Do not write "it works", "the fix succeeded", "SELinux is fine",
or "boot completed normally". Those sentences are what this lane exists to avoid — a
wrong root cause was recorded on 2026-08-26 from exactly that kind of summary, and cost
most of a day to unwind.

If you believe something, say: *"I think X, because these lines: <lines>"* — with the
lines. Headbrain decides whether X is true.

**"NOT FOUND" and "I could not tell" are correct, valuable answers.** A confident guess
is worse than a blank.

---

## NO ROOT NEEDED — READ THIS FIRST

Every script here runs as `chris`. QEMU, swtpm, socat and the gates need no privileges.
**Root lives inside the guest**, reached over the serial console with `spb-shell`.
So: if you find yourself wanting `sudo`, you are on the wrong path — use `spb-shell`.

The single exception is rebuilding the ISO, which needs rootful podman. That is wrapped
once, in `spb-build`, and you never compose a privileged command yourself.

---

## THE LOOP

```bash
cd ~/sp-plus-bee
export CYCLE=cycle7          # pick a NEW cycle name each run; never reuse cycle6

./spb-sha                    # 0. what ISO is on disk right now
./spb-build                  # 1. rebuild (~15 min, detached). SKIP if the ISO is current.
./spb-install                # 2. fresh VM, drives Anaconda, ~35 min
./spb-boot                   # 3. serial boot + LUKS unlock, ~5 min
./spb-evidence               # 4. THE DELIVERABLE — paste this whole output back
```

`spb-boot "enforcing=0"` boots permissive, for when you need the system up to inspect it.

`spb-shell '<cmd>'` runs one command in the guest and prints the output. Example:
```bash
./spb-shell 'semodule -DB; getenforce; ausearch -m AVC -ts boot | tail -40'
```

---

## WHAT WE ARE TRYING TO PROVE RIGHT NOW

Two defects block an advisor from using SP+. Both are open.

**DN-16 — `/etc` is `unlabeled_t`, so EVERY login fails under SELinux Enforcing.**
This is the login loop Christopher hit by hand; the password was always correct.
A fix shipped in ISO `6a593d70…` (`%post` runs `setfiles -F` over `/etc` and `/var`).
**It has never been observed working.** The test is:

- install that ISO, boot it, and report **every `avc:` line** — the target is zero
- then `spb-shell 'ls -Zd /etc/passwd /etc/nsswitch.conf'` — no `unlabeled_t`
- then log in on serial and report whether the login actually succeeded

**DN-15 — the LUKS passphrase prompt is INVISIBLE on the local VGA screen.**
`fbcon: Deferring console take-over`. The machine looks dead; it is waiting for a
passphrase nobody can see. Unfixed. This blocks the Dell on its own and is likely a
plymouth / fbcon console-handoff setting.

---

## DO NOT RETEST — ALREADY REFUTED

Each of these was tested and disproved. Re-running them wastes a night.

1. "SELinux Enforcing deadlocks the boot." **False** — false correlation from a timing
   artefact. It boots to a login prompt under Enforcing.
2. The first-boot password unit causes the hang. Masking it changed nothing.
3. The system asks for the LUKS passphrase twice. It does not.
4. "`/etc` is fully labeled" — a `find`/`ls -Z` survey said 0 unlabeled files.
   **The survey was wrong. The kernel AVC log is the authority, not `ls -Z`.**
5. Fedora 44 removed local graphical installs. False.
6. `/.autorelabel` is the fix. It is not — the ostree root is read-only (bootc #1087).
7. `chcon` in the Containerfile. OCI layers do not carry `security.selinux` xattrs.

---

## TRAPS THAT HAVE ALREADY BITTEN

- **`pkill -f <pattern>` and `ps | grep <pattern>` match your own shell** when the
  pattern appears in your command line. This killed the ssh session twice in one day.
  Kill from a **pidfile** (the scripts do) or match on `comm`.
- **An open forwarded port is NOT a listening service.** QEMU slirp accepts the TCP
  connect whether or not anything is listening. Prove sshd with a **banner grab**.
- **Exit 0 does not prove an artifact exists.** Check the file and its size. A build
  that "succeeded" with a 1 MB disk installed nothing.
- **`/tmp` is a 16 GB tmpfs.** Never copy a repo into it.
- **A VM named `chris` belongs to Christopher. Never kill it.**
- The build log contains `Failed to create directory ... /usr/local/sbin: Read-only
  file system`. **Non-fatal. Do not chase it.**
- Beelink is Christopher's daily driver. Leave RAM and disk tidy; delete VM disks you
  will not return to, but **never** delete a disk or log that evidence was drawn from.

---

## CREDENTIALS

`spplus-test` is a **disposable test-only** LUKS and root passphrase for throwaway VMs.
It may appear in run logs. It must **never** appear in the ISO, the Containerfile, the
repo, or any committed config. SP+ ships **no default account password** at all.

---

## WHEN YOU ARE DONE

Post the full `spb-evidence` output. Add, in plain words:
- which cycle and which ISO sha you tested
- what you ran, in order
- anything that did not behave as this runbook describes

Then stop. Headbrain writes the ledger and decides the next experiment.
