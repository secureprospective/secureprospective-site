# SP+ privilege confirmation — consolidated security findings

- **Author:** Bee, Beelink
- **Date:** 2026-09-11
- **For:** Christopher Campbell / ClaudeBox
- **Request:** Security design judgment on passwordless privilege confirmation for Fin; subsequently recheck every claim below 95% confidence.
- **Input:** `/home/chris/Downloads/SPPLUS-SUDO-PANEL-BRIEF.md`, dated 2026-09-11.
- **Status:** Completed design/source review; **not an audit or exploit test of the SP+ image**.
- **Authority of this document:** This consolidates and supersedes Bee's earlier chat answers. In particular, use the corrected XWayland analysis and sudo approval-plugin failure semantics below.
- **Delivery:** Local handoff artifact for Christopher to give to Claude. No remote delivery or production configuration changes were performed.

## Executive judgment

**Do not implement the proposal as written and claim a physical-presence security boundary.** Its central assumptions do not hold:

1. With upstream sudo's sudoers policy, a matching `NOPASSWD` grant skips PAM authentication. An enforcement helper placed only in PAM's `auth` stack will not gate those invocations.
2. An ordinary native Wayland dialog does not prove that its activation came from physical human input. KWin, portals, accessibility, and modern XWayland have relevant automation mechanisms.
3. Command-string inspection is not a sound general-purpose way to divide arbitrary root programs into harmless diagnostics and alterations.
4. Making loss of the approval channel grant arbitrary privilege defeats that channel's intended enforcement.
5. Read-only `/usr`, deployment rollback, and LUKS do not replace containment of live privileged processes or protection of persistent customer data.

**The passwordless constraint is acceptable. It does not imply that every unconfined process running as the advisor must have unrestricted root authority.**

Recommended direction:

- Investigate sudo's approval-plugin API if preserving Fin's sudo invocation surface is essential. PAM is not the only integration point.
- Keep ordinary diagnostics and the general shell unprivileged wherever possible.
- Use bounded, root-owned operations for routine privileged diagnostics and repairs.
- Approve a specific repair transaction rather than issuing a reusable privilege window.
- If arbitrary root execution remains a required fallback, label it honestly as full administration. A normal desktop confirmation is not demonstrated protection against same-user malware.
- Fail closed for new arbitrary authority when confirmation is unavailable. Provide separately preauthorized, bounded recovery operations and an independently usable local recovery path.

**These are design recommendations, not evidence that a replacement implementation already meets SP+'s day-one compatibility or recovery requirements.**

## 1. Scope and confidence discipline

### Product assumptions supplied in the brief

SP+ is intended for a single nontechnical insurance/financial advisor, without an IT department or support desk. It uses Fedora bootc/image mode, KDE Plasma on Wayland, LUKS2, and a first-boot-created account. Fin runs as that account and has a general shell tool for diagnosis and open-ended repair. Memorized-password requirements and production VM compartmentalization are outside the permitted solution space.

The supplied grant is:

```sudoers
%wheel ALL=(ALL) NOPASSWD: ALL
```

Fin's existing bash gate attempts to block destructive file operations, protection weakening, mail sending, and damage to boot/decryption. The brief acknowledges that it covers only Fin's bash tool, is not a sandbox, and can be bypassed by creative commands. Its code was not supplied or independently audited here.

### What was actually verified

The second pass inspected relevant source in these pinned versions:

| Component | Version inspected | Relevant area |
|---|---|---|
| sudo | 1.9.17p2 | sudoers tag handling, authentication branching, PAM, frontend approval lifecycle |
| KWin | 6.5.0 | Wayland interface permissions, fake input, input routing, XWayland launch, EIS backend |
| KService | 6.18.0 | Application lookup and application-directory discovery |
| Qt | 6.9.2 | Standard directories, AT-SPI action dispatch, accessible button behavior |
| KDE portal backend | 6.5.0 | Remote-desktop preauthorization and input dispatch |
| xdg-desktop-portal | 1.20.3 | Permission-store implementation |
| Flatpak | 1.16.1 | Permission-setting client |
| XWayland | 24.1.0 | XTEST-to-libei implementation |

These versions are evidence of upstream behavior. **They are not asserted to be SP+'s shipped versions.** Earlier research also consulted moving upstream branches, but the central findings here are grounded in pinned sources where available.

Additional primary documentation was checked for bootc, systemd pagers/journal permissions, Yama, polkit, Flatpak sandboxing, and KDE portal permissions.

### Meaning of confidence labels

- **H — at least 95% review confidence:** Confidence in the narrowly stated source behavior or technical proposition. This is an expert judgment, not a measured exploit-success probability.
- **C — conditional / not established for SP+:** A mechanism exists, but applicability or exploitability depends on the shipped configuration or unprovided implementation. Do not present it as a demonstrated SP+ vulnerability.
- **R — recommendation:** Security/product design advice. Its usability, completeness, compatibility, and operational reliability require evidence rather than confidence inflation.

**No SP+ image was booted; no confirmation UI was exercised; no synthetic input or exploit was run against the operator's desktop.** No proposed replacement control was built or benchmarked.

## 2. Answers to the four questions

## Question 1 — Is click-to-confirm a boundary against same-UID malware?

### Answer

**Not as established by this proposal. An ordinary Plasma dialog should be documented as an additional consent step, not as proof of physical presence or a reliable boundary against unrestricted same-user malware.**

This does not mean every possible passwordless confirmation design is impossible. It means Wayland plus a normal dialog does not supply the claimed property. A protected approval agent, protected input/display path, and enforceable operation authorization would be separate engineering work.

Distinguish two meanings of “headless malware”:

- A process without its own visible window, running while the advisor's session exists. Such a process may still use session-bus and compositor APIs.
- A process running when there is no usable desktop session. This is primarily the failure/recovery problem in question 2.

Lacking a visible window is not the same as lacking access to desktop automation.

### A. KWin fake input: the authorization declaration is user-controlled

**H — source behavior, under normal application-directory configuration.**

KWin 6.5.0 exposes the private `org_kde_kwin_fake_input` protocol. For restricted interfaces, its Wayland-server code checks the application's declared `X-KDE-Wayland-Interfaces` metadata. Its helper finds that metadata through `KApplicationTrader`, matching an application desktop entry to the executable path.

The second pass followed the lookup into KService and Qt:

1. KService discovers applications through the normal application-directory mechanism.
2. Standard application locations include the user's application-data directory, normally `~/.local/share/applications`.
3. Therefore, an unrestricted host process can supply its own desktop metadata; this is not a root-managed authorization allowlist.
4. Once the interface is available and the client requests authentication, the fake-input handler contains:

```cpp
// TODO: make secure
device->setAuthenticated(true);
```

The backend can emit pointer, button, and keyboard events into KWin's input processing. Ordinary Wayland pointer-button delivery does not give the receiving application an independently authenticated physical-origin attestation.

**C — SP+ exploitability:** The actual shipped KWin version, downstream patches, application-directory policy, process confinement, and proposed confirmation UI are unknown. The source chain establishes a concrete attack mechanism, not a completed SP+ exploit.

**Test:** From an unprivileged host process, attempt the desktop-declaration/fake-input path against a harmless native Wayland mock approval dialog. Do not test by approving a real privileged operation.

Sources: [S1–S5].

### B. Portal preauthorization: the user session can store permission to skip the prompt

**H — source behavior.**

KDE documents `kde-authorized` / `remote-desktop` entries that bypass the interactive remote-desktop permission workflow. The feature was introduced in Plasma 6.3. KDE also explicitly warns that host applications may impersonate application IDs.

The second pass verified the implementation chain:

1. Flatpak's permission-setting client connects to the user's session bus and calls the permission store's setter.
2. The permission store implements the update and stores its database in the user's data area.
3. KDE's remote-desktop backend looks up the application's entry.
4. A matching permission containing `yes` causes its `isAppMegaAuthorized()` check to succeed and the normal authorization dialog to be skipped.

This is more than a possibility of reusing a previously granted session. In the normal unrestricted host-session model, the mechanism allows storing preauthorization without a physical click.

Do not run a permission-changing command on the operator's live session merely to demonstrate the point.

**C — SP+ exploitability:** Verify session-bus access, downstream policy, feature availability, and whether the resulting synthetic input operates the actual approval UI. A sandboxed application does not automatically have the same access as an unrestricted host process.

Sources: [S6–S9].

### C. XWayland: correction to the first review

**The original answer's shared-X-server versus native-Wayland distinction was incomplete.**

There are two different mechanisms:

1. **Ordinary X11/XTEST interaction:** Clients sharing an X server are not isolated like ordinary native Wayland clients. An X11 confirmation dialog is therefore especially unsuitable.
2. **XTEST translated through libei:** Modern XWayland can translate XTEST requests into compositor-level emulated input. With the relevant authorization/connection, those events can reach native Wayland applications too.

**H — version-specific facts:**

- XWayland 24.1.0 implements the XTEST-to-libei path and portal integration.
- KWin 6.5.0 can start XWayland with `-enable-ei-portal` when the integration is built and the relevant configuration selects it.
- KWin has an `XwaylandEisNoPrompt` setting, whose upstream default is **false**.
- When the no-prompt setting is enabled in the inspected implementation, KWin provisions an alternative EIS socket connection for XWayland.

Consequently, “the dialog is native Wayland” is not sufficient to exclude input that originated in an X11 automation client. The portal preauthorization issue above is relevant to the portal-mediated route.

**C — SP+ applicability:** Actual XWayland build options, launch flags, KWin settings, and policies need inspection. Do not claim no-prompt EIS is enabled by default; it is not the upstream default in the inspected version.

**Recommendation:** Keep the dialog native Wayland, but test both XTEST/libei and native KWin input mechanisms. Blanket removal of XWayland is not justified by this review and may violate day-one compatibility.

Sources: [S10–S13].

### D. Direct KWin EIS D-Bus interface: additional inspection target

**H — narrowly stated source observation.**

KWin 6.5.0's EIS backend registers `/org/kde/KWin/EIS/RemoteDesktop` with interface `org.kde.KWin.EIS.RemoteDesktop` on the session bus. The exported `connectToEIS` handler accepts requested capabilities and creates a connection/file descriptor. The inspected handler has no in-handler authorization check. The EIS plugin metadata marks the plugin enabled by default when present.

**C — reachability and exploitability:** This is not sufficient by itself to certify a working SP+ bypass. Verify that the plugin is built/loaded, the caller can reach the method, and no surrounding or downstream policy supplies authorization. Then test input delivery to the mock dialog.

Do not confuse this implementation interface with the public portal's permission-checking frontend.

Source: [S13].

### E. Accessibility can activate a standard Qt button without a mouse event

**H — Qt 6.9.2 implementation behavior.**

Qt's AT-SPI adapter handles `org.a11y.atspi.Action.DoAction` by dispatching an accessible action. For an enabled standard Qt button, the press action invokes `animateClick()`.

**C — applicability to SP+:** The proposed UI implementation is absent. Its toolkit, accessible action exposure, accessibility activation state, and accessibility-bus access are unknown. Therefore:

- Correct: “Test whether AT-SPI can activate the approval control.”
- Incorrect: “We proved that AT-SPI bypasses SP+'s approval control.”

Disabling accessibility throughout the product is not an acceptable shortcut. A trusted confirmation design must account for accessible interaction without treating every accessible action as physical-presence proof.

Source: [S14].

### F. Attacking the confirmation agent rather than its button

**C — implementation-dependent attack classes, not demonstrated vulnerabilities.**

Inspect:

- Whether approval IPC accepts an affirmative answer from any process with the advisor's UID.
- Whether agent code, configuration, plugins, service definitions, or launch state are user-writable.
- Whether same-user process injection is permitted by Yama, SELinux, process dumpability, and process relationships.
- Whether killing the agent allows replacement by an attacker-controlled instance.

**Same UID does not automatically mean ptrace/injection succeeds.** The first review listed this conditionally; that qualification must be retained. Kernel and MAC controls may block it.

Conversely, checking only an IPC caller's UID or a process name cannot distinguish a trusted agent from other unrestricted processes using that same identity. An executable-path sudoers rule permits invocation of the executable; it does not establish that Fin was the invoker.

A root broker attached to an ordinary same-user UI does not automatically establish a trusted approval path. Running the UI as root also does not, by itself, establish trustworthy input from the compositor.

Source for tracing restrictions: [S15].

### G. Spoofing, covering, focus manipulation, and approval racing

**C — credible design hazards, not findings against an existing implementation.**

- An attacker can reproduce ordinary application branding. A fake window alone cannot forge a properly authenticated broker response, but it can mislead the user about a real request.
- Whether an attacker can usefully cover, reposition, or manipulate focus around the genuine dialog depends on compositor behavior and available interfaces. Do not assume arbitrary click-through works.
- Whether an attacker can consume an approval meant for another request depends on request binding, concurrency handling, and caching. No approval protocol was provided to test.

Recommended anti-race properties:

1. Unique, expiring, single-use approval for one captured request.
2. Bind approval to the actual operation, arguments, targets, and relevant immutable/staged input contents.
3. Execute that captured request, not a newly submitted command after the click.
4. Never create a generic “approved for five minutes” window.
5. Prevent another queued request from inheriting an approval.
6. Cancel pending approval on relevant request changes, lock/logout, or approval-agent disconnect.
7. Prevent a preexisting mouse-down or held activation key from accepting a newly appearing prompt.

These measures address particular replay, substitution, and accidental-activation failures. **They do not prevent synthetic input, social engineering, or all influence over arbitrary approved root programs.** Arbitrary programs may consume attacker-controlled dependencies that are not represented in their argument vector.

### Documentation wording that is defensible now

> Confirmation adds an explicit consent step for administrative actions. It does not prove physical presence or reliably block malicious software already running unrestricted in the desktop account.

Do not promise a quantified reduction in attacks or a particular attacker cost without measurements.

## Question 2 — Fail closed or fail open when no desktop is available?

### Answer

**Fail closed for new arbitrary privileged operations.** Loss of the confirmation channel must not create authority.

Fail-open is not merely vulnerable while nobody is logged in. Depending on implementation, a process might trigger the same branch by disrupting or killing the agent, forcing a timeout, or causing a communication error. We have not demonstrated that any specific such disruption is possible on SP+; the policy flaw is that an unavailable channel would authorize execution if it occurred.

An active login session is not proof of an unlocked desktop or an attentive owner.

### Third option: previously authorized, bounded recovery

Separate:

- **New arbitrary authority:** Deny when the approval channel is unavailable.
- **A previously authorized maintenance operation:** It may run headlessly within its fixed scope.

Examples of possible preauthorized operations:

- Restart one designated failed service under specified conditions and rate limits.
- Revert a configuration transaction made through the repair broker.
- Select a verified previous deployment after a defined update-health failure.
- Start a protected local recovery interface.

A recovery routine must not accept arbitrary shell strings, model-generated scripts, unrestricted paths, or unbounded package choices. Otherwise it recreates the headless root bypass.

### Recovery must be a product feature

For broader failures, the proposed direction is an offline recovery environment with a simpler dependency chain than the normal desktop, a nontechnical interaction flow, and explicitly scoped privileged actions. Boot integrity, deployment selection, and disk unlocking require their own design and tests.

“Ask Fin to run rollback” is not a recovery design if Fin or the desktop cannot start. Nor is a written technical runbook a usable fallback under the brief's constraints.

**R — unverified proposal:** No recovery implementation was inspected. This review does not establish that such a workflow is already feasible on every supported device or covers every open-ended repair.

### The irreducible conflict

There is no mechanism that guarantees all of the following simultaneously:

- Arbitrary repairs remain available.
- Every approval/recovery interaction path may be broken.
- There is no independent trusted interaction, credential, or assistance.
- Malware cannot obtain equivalent authority.

The product must supply some independent recovery capability or accept a limit on repair availability. A PAM setting cannot remove that dependency.

A recovery key generated at setup is not proof of recoverability. Establish where it is retained, whether the owner can retrieve it when the laptop is unavailable, and what happens if the sole decryption route is lost. An assistant cannot reconstruct an unavailable encryption key.

## Question 3 — How should diagnostic and altering tiers be drawn?

### Answer

**Authorize narrowly defined operations, not arbitrary command strings described as “read-only.”**

Reading secrets may be more consequential than a bounded configuration change. “Diagnostic” is a purpose label, not a security property of every program used for that purpose.

### Proposed operation classes

| Class | Examples | Recommended handling |
|---|---|---|
| User-accessible operations | User logs, service listings, installing a user font | Run as the user; do not elevate out of habit |
| Bounded privileged diagnostics | Selected records from a protected log, specific device/service state | Small fixed operations, minimal authority, silent only where justified |
| Defined administrative transactions | Add a selected printer, repair one network profile, change one known service configuration | One approval for the actual bounded transaction |
| Arbitrary administration | Root shell/interpreter, arbitrary script/package, unrestricted configuration editing | Explicit full-administration fallback, never presented as harmless diagnostics |

The final class preserves a route for genuinely open-ended repairs. It is a broad delegation and must not inherit the safety claims of the fixed-operation classes.

### Why generic command inspection is unsound

An apparently diagnostic command can exercise additional authority through:

- Pager shell escapes or file-writing features.
- Execution options such as `find -exec`.
- Interpreters and shell wrappers.
- Plugins, helpers, configuration, environment, and working-directory dependencies.
- Arbitrary path arguments, symlinks, or inputs changed after inspection.
- Subcommands with very different behavior under the same executable.
- Reading credentials or sensitive state instead of ordinary diagnostic output.

Unknown commands should not be auto-approved merely because a string classifier failed to identify a modification. A conservative classifier can send every unknown command to full-administration approval; that is different from solving arbitrary program semantics.

### Pager qualification

Do not claim that every privileged `journalctl` invocation provides an immediate shell escape. Current systemd tools include secure-pager behavior. Their documentation nevertheless explicitly recommends secure pager configuration or disabling paging for privileged use.

For broker diagnostics, a fixed noninteractive output path without a pager is preferable to relying on interactive-tool defaults. Source: [S20].

### Properties of the silent privileged surface

Keep a small positive allowlist of complete operations, not a list of executable names. Each operation should have:

- Root-owned fixed implementation and constrained arguments.
- The minimum authority needed.
- Controlled environment and working directory.
- No general shell evaluation, interactive pager, or arbitrary child execution.
- Bounded output and appropriate confidentiality filtering.
- Safe resource resolution and protection against input substitution.
- Defined error handling, limits, and audit events that avoid recording unnecessary secrets.

Measure how much diagnostic work actually needs root. Some service state is public, and journal permissions may already permit the required access. Exact journal access depends on the shipped group/ACL configuration; membership in `%wheel` must not be treated as proof of every actual filesystem permission without checking it.

### Reducing click-through training

**R — design hypothesis, not validated usability evidence:** Group actions into meaningful repair transactions rather than prompting for each shell command.

For example, a single user-requested printer repair might authorize a known configuration update plus restart of printing. The broker should generate the description from the actual operation and explain material consequences, such as interrupted print jobs.

The model's explanation is not an authorization proof. Do not approve “whatever Fin decides during this conversation.” A materially different repair requires a new approval.

There is no evidence here for a universal safe prompt count or a required size of the altering set. Measure prompts per completed repair, repeated prompts, comprehension, unexpected requests, cancellations, and repair completion with the actual target users.

**No ≥95% claim is made that this design will eliminate prompt fatigue or preserve every repair.**

## Question 4 — What is missing, and is there a better mechanism?

### A. The PAM proposal has a verified implementation blocker

**H — upstream sudo/sudoers behavior.**

In sudo 1.9.17p2:

1. Matching a `NOPASSWD` tag sets `def_authenticate = false`.
2. `check_user()` skips credential verification when authentication is disabled.
3. PAM's `pam_authenticate()` call is inside the skipped verification path.
4. Authentication machinery may still be initialized and PAM account/session functions may run separately.

Therefore an `auth`-stack helper alone does not enforce the proposal while preserving the supplied `NOPASSWD` grant.

Moving a helper into PAM account processing would be a different proposal. It does not validate the original design, and PAM remains an awkward interface for operation-semantic authorization.

`PASSWD` requires authentication under sudoers; it is not intrinsically a demand for a memorized password under every possible PAM configuration. A custom passwordless authentication mechanism is conceptually possible. However, authentication caching and invocation modes then become part of the design. Merely changing tags is not a completed fix.

Sources: [S16–S18].

### B. Sudo approval plugins are a real alternative, with a crucial failure trap

**H — upstream sudo 1.9.17p2.**

The frontend runs approval checks after successful policy acceptance for command execution and sudoedit. Approval callbacks receive command information, argument vectors, and environment information. This allows constraints to be added without replacing sudoers and without relying on PAM authentication running.

The callback lifecycle matters:

| Callback/result | Observed effect |
|---|---|
| `open()` returns `1` | Plugin initialized; its check can run |
| `open()` returns `0` | Plugin asks to be disabled and is removed; this is **not command denial** |
| `open()` returns `-1` | Fatal initialization error |
| `check()` returns `1` | This check approves |
| `check()` returns `0` | Command rejected |
| `check()` returns `-1` | Error; command does not proceed |

An approval plugin that returns `0` from `open()` when the UI/broker is unavailable may disable its own enforcement. A missing check callback also cannot enforce anything. Verify installation, loading, lifecycle, and error handling, not only the successful prompt path.

A cached authentication timestamp does not itself replace the frontend's execution approval path. Nevertheless, test actual invocation modes, including `sudo -n`, `sudoedit`, shell modes, and authentication-cache state on the shipped implementation.

An approval plugin is an integration point, **not a sandbox, trusted UI, or a solution to arbitrary-command classification**. Verify the exact sudo implementation and plugin support packaged by SP+ rather than assuming all programs named `sudo` expose identical APIs.

Sources: [S18–S19].

### C. Polkit is not a drop-in confirm-only switch, but PAM is not the only home

Standard polkit policy results include authorization/denial and authentication outcomes, not a generic built-in confirm-only outcome. A dedicated privileged service can nevertheless implement bounded operations and a separate approval protocol.

Polkit identity/session checks alone do not prove physical presence. Cached `*_KEEP` authorization also requires care: polkit documents that a retained action authorization can apply even when action variables change. This is another reason not to treat a reusable authorization cache as binding to one exact repair request.

Source: [S21].

### D. The immutable-OS rationale is materially overstated

**H — bootc's documented default filesystem model, with configuration qualifications.**

“Every change lands in a new deployment” is false for ordinary mutable/live state:

- `/etc` is mutable by default and can contain privileged executable configuration, including systemd units.
- `/var` is shared persistent state across deployments by default.
- The brief itself states that home data is not restored by rollback.
- Processes, mounts, networking, and `/run` can change immediately.
- Unrestricted root can damage or disclose persistent data without modifying `/usr`.
- User-level malware surviving in persistent state can execute again after rollback.

`/etc` has distinct deployment/merge semantics. Normal upgrades can preserve local changes through a three-way merge. `bootc rollback` reorders existing deployments; it does not merge current `/etc` edits into the old deployment. Some bootc configurations can make `/etc` transient. Inspect the actual image rather than assuming one model.

Do not claim that a malicious `/etc` change necessarily appears in every earlier deployment. The supported conclusion is that rollback is not a general restoration of all state and is not a data-recovery facility.

Sources: [S22–S23].

### E. LUKS and locking protect different states

**H — technical distinction.**

Ordinary desktop locking does not close an already unlocked LUKS mapping. Malware already running continues to have the filesystem access its credentials and confinement permit. LUKS protects encrypted storage at rest; it is not a live same-user malware boundary.

Shipping signed container images also does not by itself establish enforcement throughout deployment selection, boot, mutable configuration, and recovery. The end-to-end trust policy and actual enforcement configuration need inspection. This review does not assert that SP+'s boot chain is broken; it asserts that the brief has not established that chain's properties.

### F. Fin needs an enforceable separation if it is to have exclusive authority

Giving a particular executable a sudoers allowance does not restrict invocation to Fin. Other processes can invoke it. Process names, untrusted environment variables, or a token readable by all advisor processes do not supply exclusive agent identity.

A possible architecture is:

```text
Fin's unprivileged shell and planning
             |
             v
Small protected broker with fixed routine operations
             |
             +-- bounded privileged diagnostics
             +-- explicitly approved repair transactions
             +-- separately identified full-administration fallback, if required
```

Broker policy, code, and execution inputs must not be writable by untrusted advisor processes. If components must be distinguished from other same-user software, use actual isolation—potentially a separate UID and targeted SELinux policy—not a naming convention.

This can improve operation scope and request integrity. **It does not automatically make approval input trustworthy.** That requires separate engineering of the approval agent, compositor/input trust, and communication channel.

Nor is a separate UID alone proof of a complete solution: inspect IPC, writable dependencies, launch authority, and the permitted actions.

### G. Root and same UID are not substitutes for inspecting confinement

The supplied rule grants broad sudoers authority to matching credentials. Other controls can still constrain execution. A sandbox, `no_new_privs`, MAC policy, namespace restrictions, or inaccessible host interfaces can make two processes with apparently similar UIDs materially different.

Accordingly, use “unrestricted/unconfined host process running as the advisor” when stating the direct root-escalation consequence. Do not claim that every Flatpak or every same-UID process can automatically exercise every listed attack path.

An approved **unrestricted** root shell can retain privilege, create persistence, and change future enforcement where the system permits it. One prompt is not ongoing confinement of that shell or its descendants. A genuinely confined privileged service is a different case and must be evaluated under its actual policy.

### H. Sudo is not the complete privilege surface

Inventory other entry points before claiming all privilege is gated:

- Existing polkit rules and active-session grants.
- Privileged system D-Bus services.
- Setuid executables and file capabilities.
- Rootful container-engine sockets, if present.
- Update/package/deployment helpers.
- Service, network, printer, and mount-management helpers.
- Existing root shells and privileged background processes.

This list identifies things to inspect; it does not assert that SP+ has an exploitable instance of each.

### I. Flatpak filesystem access and host execution are distinct

Broad writable filesystem access can expose user data or permit modification of user startup/configuration. It does not automatically make a Flatpak identical to an unsandboxed host process with unrestricted process and D-Bus access.

Flatpak's documentation separately describes filesystem, bus, device, process, and other restrictions. State the actual path from a particular application's permissions to host execution or privileged APIs. Do not abbreviate it to “host filesystem access means arbitrary host sudo always works.”

Source: [S24].

### J. Customer data and communications can be harmed without root

Depending on accessible files and credentials, malware running as the advisor may already be able to read/encrypt documents, alter user-level application state, steal usable session material, exfiltrate over the network, or act through accessible account sessions.

Fin's bash guardrail is not a system-wide no-mail/no-exfiltration policy. No claim is made here that a specific mail account or browser credential store has been accessed or can be accessed on SP+; these are threat-model exposures that require their own controls.

For this product, tested restoration and backups that the compromised workstation cannot simply overwrite or delete are essential. Local rollback of an OS deployment is not such a backup. A local snapshot writable by the same compromised authority is not automatically an independent recovery boundary either.

### K. Prompt injection can turn Fin into a confused deputy

Fin reads potentially attacker-controlled logs, documents, filenames, websites, and device responses. Such content can contain instructions intended to redirect the model.

A dialog that says “Fin recommends this repair” can lend apparent authority to a maliciously induced action. The broker must authorize the actual operation independently of the model's persuasive explanation.

The existing bash gate may reduce accidents and catch known patterns. Its own stated bypassability and coverage limit prevent treating it as complete enforcement of file protection, protection settings, communications policy, or boot/decryption safety.

No claim is made that a prompt-injection exploit was successfully executed against Fin in this review.

## 3. Confidence register

| Claim | Status | Exact boundary of the claim |
|---|---|---|
| Matching `NOPASSWD` bypasses PAM authentication with the inspected sudoers implementation | H | Not a claim that all PAM account/session processing is skipped |
| Sudo has a post-policy approval-plugin API | H | Verify the actual implementation/build shipped by SP+ |
| Approval `open() == 0` disables the plugin in sudo 1.9.17p2 | H | Distinct from `check() == 0`, which denies |
| KWin 6.5.0 fake-input authentication unconditionally accepts an admitted device | H | Does not prove the complete SP+ exploit chain |
| Normal KWin metadata lookup includes user-supplied application declarations | H | Normal inspected KService/Qt directory configuration; downstream hardening unknown |
| KDE remote-desktop preauthorization can skip the backend dialog | H | End-to-end access/input delivery on SP+ untested |
| XWayland can translate XTEST into libei compositor input | H | Build, authorization, launch settings, and target behavior matter |
| KWin no-prompt XWayland EIS setting defaults to false in 6.5.0 | H | Do not imply it is enabled by default |
| Direct KWin EIS handler lacks an in-handler authorization check | H | Reachability and surrounding policy are C |
| Qt AT-SPI dispatch can activate an enabled standard button | H | Approval UI exposure/bus access are C |
| Same-user ptrace/injection succeeds on SP+ | C | Requires checking Yama, MAC, dumpability, relationships |
| Approval agent can be replaced or its IPC forged | C | No agent implementation was supplied |
| Covering/clickjacking or approval stealing succeeds | C | No compositor/UI/approval protocol test performed |
| Ordinary lock does not close an unlocked LUKS mapping | H | No claim about specially engineered key-eviction workflows |
| Bootc rollback restores all security-relevant or customer state | Rejected, H | It does not; `/etc` details depend on deployment/configuration |
| Every same-UID or host-filesystem-enabled Flatpak can directly run host sudo | Rejected as overbroad, H | Confinement and actual host access matter |
| A broker/recovery redesign preserves every day-one function and repair | R / unverified | Requires implementation and compatibility/failure tests |
| Transaction grouping eliminates prompt fatigue | R / unverified | Requires testing with actual advisors |
| An ordinary Wayland dialog proves physical human presence | Rejected, H | Relevant upstream input/activation mechanisms contradict that generic claim |

## 4. Corrections to the prior chat answers

1. **XWayland coverage was incomplete.** Ordinary X11-client isolation does not describe the XTEST-to-libei bridge. Native Wayland dialogs can receive compositor input that originated through that bridge.
2. **Approval-plugin failure semantics were omitted.** Returning `0` from `open()` is not a safe denial strategy in the inspected sudo version; it disables the plugin.
3. **Portal evidence was strengthened.** This is not limited to stealing an existing permission. The inspected user-session permission-setting path and KDE skip-dialog branch form a concrete source-level mechanism.
4. **Accessibility was strengthened at the toolkit level but remains conditional for SP+.** Standard Qt action-to-button activation is verified; exposure of the unprovided approval UI is not.
5. **Process injection, agent replacement, clickjacking, forged IPC, and races remain conditional.** Treat them as tests/design hazards, not completed exploits.
6. **Replacement architecture is not a validated product outcome.** The security rationale does not prove repair coverage, recovery reliability, accessibility, or day-one compatibility.
7. **Use precise threat-model language.** Same UID and broad filesystem permissions do not erase MAC/sandbox distinctions. Claims of unrestricted administrative power are about processes that can actually exercise the grant without such confinement.

## 5. Required evidence and next actions for Claude

### First action

Obtain the exact shipping image/deployment identifier and a disposable booted instance. Record the component versions and relevant downstream patches. Do not infer the deployed state from the upstream versions used in this review.

**First behavioral test:** Use an unprivileged host client to attempt KWin fake-input activation of a harmless native Wayland mock confirmation control. Record whether the mock receives an activation without physical input. No root operation should be connected to this test.

- If synthetic activation succeeds, the ordinary-dialog physical-presence claim is directly disproved for that tested stack.
- If it fails, investigate why and continue the other paths. One failed technique does not establish a boundary.

A disposable VM/test machine for verification does not imply adding VM compartmentalization to the production product.

### Collect configuration evidence

- Exact sudo implementation/version/build, plugin support, sudoers, sudo configuration, and relevant PAM stack.
- KWin/Plasma/KService/Qt/XWayland/portal versions and downstream patches.
- Wayland interface filtering and user application-directory policy.
- EIS plugin availability and session-bus reachability.
- XWayland launch flags and `XwaylandEisNoPrompt` configuration.
- Portal permission entries and whether an unprivileged host caller can set them.
- Accessibility activation, action exposure, and bus access.
- Fin and approval-agent UIDs, SELinux domains, unit definitions, writable dependencies, and IPC protocol.
- Yama/dumpability policy as applicable.
- Polkit and other privilege paths.
- bootc `/etc` mode, persistence layout, update/deployment trust policy, boot/recovery path, and backup design.

Do not put passwords, recovery keys, private credentials, or customer data in this report or follow-up artifacts.

### Behavioral verification matrix

| Test | Passing behavior for a claimed boundary |
|---|---|
| Normal `NOPASSWD` command execution | The chosen enforcement hook demonstrably runs; an `auth`-only PAM helper is not sufficient |
| Approval plugin initialization failure | No arbitrary privileged command runs; `open() == 0` is not misused as denial |
| Plugin missing/disabled/misconfigured | Deployment validation detects loss of enforcement; documented behavior is not silently assumed |
| UI absent, killed, disconnected, or timed out | New arbitrary privileged operations denied |
| Lock/logout during pending approval | Pending approval cannot execute later through a stale response |
| KWin fake input | Cannot approve if physical-presence protection is claimed |
| Portal preauthorization and synthetic input | Cannot silently satisfy the approval requirement |
| Direct KWin EIS interface | Cannot supply input that satisfies the claimed physical-presence check |
| XTEST/libei and ordinary X11 automation | Neither can satisfy the claimed physical-presence check |
| AT-SPI actions | No untrusted caller can authorize the privileged request by activating an exposed control |
| Forged/replayed IPC | Rejected; no shared-UID-only trust assumption |
| Concurrent pending requests | Approval applies only to the displayed captured request |
| Changed executable/script/target/configuration after approval | Bounded transaction cannot execute substituted behavior; arbitrary-root fallback remains explicitly broad |
| Sudo shell modes, `sudo -n`, sudoedit, cache states | All applicable execution paths have the intended enforcement; no cache-based approval window |
| Existing/root-descendant execution | Document exactly what remains privileged; do not claim repeated gating where none exists |
| Alternative privileged APIs | Intended policy cannot be bypassed through unexamined grants |
| Broken desktop and offline recovery | Owner can perform the documented recovery flow without technical instructions; authority remains bounded |
| Lost decryption route | Honest, tested handling of available recovery methods; no impossible recovery promise |
| Customer-data restoration | Files can be restored from a backup independent of the compromised authority |

If the goal is only cost-raising consent, some input tests may legitimately succeed—but the product must then withdraw the stronger security claim rather than describe those results as passing a physical-presence boundary.

### Day-one compatibility evidence

Run the brief's full supported-hardware regression set: printing, device discovery, Wi-Fi, browser, PWAs, audio, camera, microphone, suspend/resume, external display, Bluetooth, and Fin's real repair workflows.

A compilation result, successful sudo invocation, or one repaired printer does not establish this requirement. Record actual task completion and recovery behavior, not just service startup.

### Decision requested from Claude

Choose explicitly between:

1. **Consent/cost-raising control:** Preserve the desktop integration and open-ended repair route, document the limits, and do not call the click physical-presence proof.
2. **Enforced trusted confirmation:** Engineer and verify the approval agent, input/display trust, operation scope, and recovery path as a security subsystem, then demonstrate compatibility.

A sudo approval plugin can be part of either direction; it does not determine which security property has actually been delivered.

## 6. Sources

All sources below were consulted during the two-pass review. Pinned implementation links are evidence for those versions, not proof of deployment on SP+.

### KWin fake input and application lookup

- **[S1] KWin 6.5.0 — interface filtering:** https://github.com/KDE/kwin/blob/v6.5.0/src/wayland_server.cpp
- **[S2] KWin 6.5.0 — desktop metadata lookup:** https://github.com/KDE/kwin/blob/v6.5.0/src/utils/serviceutils.h
- **[S3] KWin 6.5.0 — fake-input authentication and events:** https://github.com/KDE/kwin/blob/v6.5.0/src/backends/fakeinput/fakeinputbackend.cpp
- **[S4] KService 6.18.0 — application lookup/directories:** https://github.com/KDE/kservice/blob/v6.18.0/src/services/kapplicationtrader.cpp ; https://github.com/KDE/kservice/blob/v6.18.0/src/sycoca/vfolder_menu.cpp ; https://github.com/KDE/kservice/blob/v6.18.0/src/sycoca/kbuildsycoca.cpp
- **[S5] Qt directory defaults and KWin input delivery:** https://github.com/qt/qtbase/blob/v6.9.2/src/corelib/io/qstandardpaths_unix.cpp ; https://github.com/KDE/kwin/blob/v6.5.0/src/input.cpp ; https://github.com/KDE/kwin/blob/v6.5.0/src/wayland/pointer.cpp

### Portal authorization

- **[S6] KDE — portal preauthorization documentation:** https://develop.kde.org/docs/administration/portal-permissions/
- **[S7] KDE portal 6.5.0 — remote-desktop authorization/input:** https://github.com/KDE/xdg-desktop-portal-kde/blob/v6.5.0/src/remotedesktop.cpp
- **[S8] Flatpak 1.16.1 — session-bus permission setter:** https://github.com/flatpak/flatpak/blob/1.16.1/app/flatpak-builtins-permission-set.c
- **[S9] xdg-desktop-portal 1.20.3 — permission store:** https://github.com/flatpak/xdg-desktop-portal/blob/1.20.3/document-portal/xdg-permission-store.c

### XWayland and EIS

- **[S10] Wayland — X11 application isolation/compatibility model:** https://wayland.freedesktop.org/docs/html/ch05.html
- **[S11] XWayland 24.1.0 — XTEST/libei implementation:** https://gitlab.freedesktop.org/xorg/xserver/-/blob/xwayland-24.1.0/hw/xwayland/xwayland-xtest.c
- **[S12] KWin 6.5.0 — XWayland launch/settings:** https://github.com/KDE/kwin/blob/v6.5.0/src/xwayland/xwaylandlauncher.cpp ; https://github.com/KDE/kwin/blob/v6.5.0/src/kwin.kcfg ; https://github.com/KDE/kwin/blob/v6.5.0/src/options.cpp
- **[S13] KWin 6.5.0 — EIS backend, exported API, context, and metadata:** https://github.com/KDE/kwin/blob/v6.5.0/src/plugins/eis/eisbackend.cpp ; https://github.com/KDE/kwin/blob/v6.5.0/src/plugins/eis/eisbackend.h ; https://github.com/KDE/kwin/blob/v6.5.0/src/plugins/eis/eiscontext.cpp ; https://github.com/KDE/kwin/blob/v6.5.0/src/plugins/eis/metadata.json

### Accessibility and process isolation

- **[S14] Qt 6.9.2 — AT-SPI/action/button implementation:** https://github.com/qt/qtbase/blob/v6.9.2/src/gui/accessible/linux/atspiadaptor.cpp ; https://github.com/qt/qtbase/blob/v6.9.2/src/widgets/accessible/simplewidgets.cpp ; https://github.com/qt/qtbase/blob/v6.9.2/src/gui/accessible/linux/dbusconnection.cpp ; https://github.com/qt/qtbase/blob/v6.9.2/src/gui/accessible/qaccessiblebridgeutils.cpp
- **[S15] Linux kernel — Yama/ptrace restrictions:** https://docs.kernel.org/admin-guide/LSM/Yama.html

### Sudo

- **[S16] sudo 1.9.17p2 — sudoers `NOPASSWD` handling:** https://github.com/sudo-project/sudo/blob/v1.9.17p2/plugins/sudoers/lookup.c
- **[S17] sudo 1.9.17p2 — authentication/PAM:** https://github.com/sudo-project/sudo/blob/v1.9.17p2/plugins/sudoers/check.c ; https://github.com/sudo-project/sudo/blob/v1.9.17p2/plugins/sudoers/auth/pam.c
- **[S18] sudo 1.9.17p2 — frontend execution and approval-plugin lifecycle:** https://github.com/sudo-project/sudo/blob/v1.9.17p2/src/sudo.c
- **[S19] Sudo approval API documentation:** https://www.sudo.ws/docs/man/sudo_plugin.man/ ; https://www.sudo.ws/posts/2020/08/sudo-1.9-using-the-new-approval-api-from-python/

### Other system properties

- **[S20] systemd journalctl — journal access and privileged pager behavior:** https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
- **[S21] polkit — authorization results, sessions, and retained authorization caveats:** https://www.freedesktop.org/software/polkit/docs/latest/polkit.8.html
- **[S22] bootc — filesystem, mutable `/etc`, shared `/var`, transient options:** https://bootc.dev/bootc/filesystem.html
- **[S23] bootc — rollback semantics:** https://bootc.dev/bootc/man/bootc-rollback.8.html
- **[S24] Flatpak — distinct sandbox permissions and filesystem exclusions:** https://docs.flatpak.org/en/latest/sandbox-permissions.html

## Final handoff state

- The requested four-question review and the confidence recheck are consolidated above.
- No SP+ code or configuration has been changed.
- No attack has been demonstrated on the SP+ image.
- The main design objection is supported by upstream code, not by a claim that every listed bypass was reproduced.
- **Blocked on:** exact deployed image/configuration and a safe test instance for SP+-specific conclusions.
- **Next move:** Claude should assess the actual shipped stack and intended security claim, then perform the harmless input test before designing around physical-click assumptions.
