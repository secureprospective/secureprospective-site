# ISO 44 — batched fix queue

Opened 2026-08-29, after cycle43 shipped and was proven on the Dell (no-NIC install, DN-27
mandatory user, DN-28 weighted progress bar, DN-29 home directory — all PASS on bare metal).

Rule, standing: fixes are batched per build. Nothing is built until the Dell tests on the
previous build have run.

---

## Fix 1 — Pi cannot be updated on an installed machine. HIGH.

**Symptom (reported by Christopher, 2026-08-29 ~20:25Z):** "I am updating Pi right now on the
Dell, its having troubles." Exact error text NOT yet captured — see OPEN QUESTION below.

**Verified on the Dell (192.168.1.124, cycle43, digest dc85bfcd…):**

```
node   /usr/bin/node      v22.23.1
npm    MISSING
pi     /usr/bin/pi
touch /usr/.wtest  ->  Read-only file system
npm config get prefix -> bash: npm: command not found
```

**This is not a bug. It is the image working as designed**, and that is exactly why it needs a
designed answer rather than a patch. `images/kde/Containerfile` around line 346 says so:

```
# The version is PINNED. A security product must not float an npm dependency,
# npm itself is removed afterwards: nothing on an advisor's machine should be
# able to pull arbitrary code.
RUN dnf install -y ... nodejs npm nodejs22-full-i18n \
 && HOME=/tmp/npmhome npm_config_cache=/tmp/npmcache \
    npm install -g --prefix /usr @earendil-works/pi-coding-agent@0.84.3 \
 && dnf remove -y nodejs22-npm nodejs22-npm-bin
```

So Pi is pinned at **0.84.3**, baked into read-only `/usr`, with npm deliberately removed. There
is no on-device update path at all. npm latest is **0.84.4** (43 versions published).

**DO NOT "fix" this by putting npm back.** That would hand every advisor's machine the ability to
pull arbitrary code from the internet, which is the precise thing the current design refuses. On
a machine sold to financial advisors that is a security regression, not a convenience.

**The right fix — update the image, not the machine.** This is what bootc is for. The install
already sets `--target-imgref ghcr.io/secureprospective/sp-plus-kde:edge`, so the machine already
knows where its updates come from.

1. Bump the pin in `images/kde/Containerfile` to the chosen version. Pin it; never float it.
   **DONE 2026-09-01: 0.84.3 -> 0.84.4**, which is `latest` on npm (published 2026-08-28; 43
   versions exist). The version is now a single `ARG PI_VERSION` rather than the two hardcoded
   copies it used to be -- install and read-back -- because a bump could update one and leave
   the assertion checking the old number, at which point the gate verified nothing.
   Verified: 0.84.4 installs from the registry and `pi --version` prints `0.84.4`; the Fin
   guardrails extension gate still passes 49/49 against it, and 0.84.4 still ships jiti at the
   path that gate imports.
2. Make `bootc upgrade` actually work end to end: publish the payload image to
   `ghcr.io/secureprospective/sp-plus-kde:edge`, then verify on the Dell that
   `sudo bootc upgrade` stages a new deployment and `bootc status` shows it.
   **UNVERIFIED:** whether that registry path is currently published and pullable. Check before
   promising the mechanism works.
3. Give the advisor a human-sized front door: a Welcome verb ("Check for updates") that runs the
   staged upgrade and says, in plain words, that the machine will use the new version after a
   restart. Advisors must never be asked to run `bootc` by hand.
4. Build gate, in the DN-27/28/29 style: assert the pinned version is an exact literal (no `^`,
   no `~`, no `latest`), that `pi --version` in the built image reports that same version, and
   that npm is absent from the finished image.
   **DONE 2026-09-01.** `PI_PIN_GATE_OK` in the Containerfile rejects anything that is not a
   bare three-part version before it is used, and the image still reads `pi --version` back
   against the pin and asserts `/usr/bin/npm` is gone. A source-level twin runs in
   `config-preflight.sh` so a float is caught without a build. Mutation-tested four ways: a
   caret on the pin, a hardcoded version reintroduced alongside the ARG, the npm-absent
   assertion dropped, and the version read-back weakened each fail on their own line.

**OPEN QUESTION for Christopher — needed before the fix is finalised:** what were you actually
doing when it "had troubles", and what did it say? Three different failures hide behind that
sentence and they need different answers:
  * running `npm i -g` on the Dell — expected to fail, npm is gone by design;
  * `pi` itself erroring at runtime (auth, provider, config) — a different bug entirely, nothing
    to do with updating;
  * an update mechanism inside Pi trying to write to `/usr` — needs Pi configured to know it is
    on an immutable host.

Do not implement past this question. Guessing here risks building the wrong fix into an ISO that
costs hours to test.

---

## Carried forward / still open

- **Welcome app live QC on the Dell** — Bee dispatched 2026-08-29 20:24Z against cycle43. Results
  pending; triage before acting. Leads, not findings.
- **Automatic performance tuning** — the data from the Dell vitals report feeds a future Welcome
  feature (detect optimal resolution, wifi drivers, per-machine "best setup").
- **Fedora 45 / live-disk installer** — research prompt issued to external AI; answers not yet
  triaged. Target is the SP+ Beta; cycle43 on Fedora 44 is pre-alpha.
