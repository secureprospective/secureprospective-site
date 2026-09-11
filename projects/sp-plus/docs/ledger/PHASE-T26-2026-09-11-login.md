# T2.6 — login and password policy

**Date:** 2026-09-11
**Branch:** `session/sp-plus-defense-in-depth`
**Move:** Tier 1 invisible hardening, doc 15 §7 item 3
**Payload:** `localhost/sp-plus-kde:t26`, image id
`4f28ee5324779756c862c833ed5f3355ff8410577ad24a2195378c8b058529df`
**ISO:** `artifacts/t26-iso/bootc-sp-plus-1.0-bootc-generic-iso-x86_64/`,
sha256 `66b98f66a966691c3f1d83e5d33b0a1b38f12d5dd345ed11ac79d6841a45dfa4`

## What shipped

| Control | Value | Why this value |
|---|---|---|
| `deny` | 10 | Ten tries is past any plausible typo run and short of a guess campaign |
| `unlock_time` | 120 | The lockout clears itself. An advisor never needs to phone anyone |
| `even_deny_root` | **absent, deliberately** | A lockout must always be clearable from a recovery shell |
| `fail_interval` | 900 | Failures age out of the window in fifteen minutes |
| `minlen` | 12 | Length is the only composition rule |
| `dcredit`/`ucredit`/`lcredit`/`ocredit` | all 0 | No digit, case or symbol is demanded. A three-word passphrase passes |
| `enforce_for_root` | **absent, deliberately** | Recovery must never be locked out by the policy it enforces |
| `UMASK` | 027 | New files land 640, new directories 750 |
| `nullok` | removed | An empty password authenticates nobody |
| authselect features | `with-faillock without-nullok` added | On the custom/sp-plus profile |

## Evidence

**66 of 66 on a real t26 boot**, zero failed units, six hardening kargs present.

**Mutation against the pre-T2.6 t24 image: 6 red of 66.** `login shell umask 027`,
`new files group-read only`, `minlen 12 enforced`, `faillock locks after 10 tries`,
`lockout policy clears itself`, `empty passwords not accepted`.

## Day-one rule

Measured on the guest, not reasoned about:

- `harbour ledger spring` — no digit, no capital, no symbol — is **accepted**.
- A short password is refused with plain English: *"The password is shorter than 12 characters"*.
- Home directory stays `700`, the advisor's own files stay readable, CUPS stays active,
  zero failed units.
- `enforce_for_root` absent means recovery always has a way through the threshold.

## Four assertions that measured nothing and still passed

Recorded because each was written, believed, and then caught. All four are the same
defect: **the check could not produce a negative result.**

1. **`grep -c ':'` on `faillock` output counted the `<user>:` header line**, so it
   returned 1 on an account with zero recorded failures. Passed on a machine where
   pam_faillock had never fired.
2. **`sudo -k -S -u X true` authenticates the INVOKING user, never X.** Twelve
   attempts never touched X's auth stack. This is why the count was 1, not 12.
3. **`script -qec 'su X -c true'` exits 127** — the SP+ image does not ship
   `script(1)`. Every attempt was a silent no-op.
4. **`grep -c even_deny_root` matched the comment explaining its own absence.**
   Third time this session that a check matched its own comment; the build gate made
   the same mistake twice before it.

The working probe is `su(1)` under a real pty from `python3`, and it asserts
**exactly 10** recorded failures, not "more than zero" — the count stops at the
threshold because the account locked, which is the effect rather than the setting.
It travels to the guest as base64 so no ssh, heredoc or shell quoting layer can
mangle a backslash.

## One assertion that was not specific, and the fix

`weak password rejected` passed on t24, which had never seen T2.6: stock Fedora
pwquality already refuses a six-character password. It guards that pwquality is
live, not that `minlen` was raised. Added `minlen 12 enforced`, which tries an
**11 character** password — stock scores it 81 and accepts it, `minlen = 12` must
refuse it. That assertion is red on t24 and green on t26.

## One assertion that is a policy read, labelled as such

`lockout policy clears itself (policy read)` reads `unlock_time` and the absence of
`even_deny_root` from the shipped file. Waiting out a real 120 second unlock is not
something a gate should do. The behavioural half of faillock is the probe above it.
It is labelled in the output so nobody reads it as a measurement.

## Harness note

The kickstart-follows-the-ISO **rewrite** path fired and was observed for the first
time, during the t24 mutation install: the tree named `t26` while the ISO carried
`t24`, and it rewrote to match the ISO. The refusal path was already verified. Both
halves of the verification-integrity fix are now exercised.
