> **Provenance:** rescued 2026-09-05 from the retired BlueBuild repo `secureprospective/sp-plus-kde`, which is being deleted. This file existed nowhere else. Original path in that repo is noted below.
>
> Original path: `docs/sp-plus-welcome-research.md` in `secureprospective/sp-plus-kde`.

# SP+ Welcome / Help & Fixes — Research Brief

**Research only — no application code was written.**
**Date:** 2026-08-28

## Decision

Build **one persistent native SP+ application**, not a disposable first-run wizard:

- On first login it presents itself as **“Welcome to SP+”** and offers a short, skippable *Ready for work* checklist.
- Thereafter it is **“SP+ Help & Fixes”**: permanently available from the top/favorites area of the KDE launcher, with an explicit **“Do not show at sign-in again”** preference.
- Its primary job is not to teach Linux. Its job is to get an advisor back to work safely: diagnose a familiar office symptom, offer one bounded fix, explain the consequence, verify the result, and hand the case to cloud-default Pi when the support flow needs agent assistance.

**Do not fork a distro Welcome app as the core product.** KDE Plasma Welcome is useful for first-run visual and packaging ideas, but it is GPL-licensed and is designed around a skippable onboarding wizard. A durable, policy-controlled, Pi-integrated support center needs its own application and action registry.

## What the current SP+ repository establishes

At commit `7f001489`:

- SP+ is an **Apache-2.0** BlueBuild image based on **Fedora Kinoite 44 / KDE Plasma** (`recipes/recipe.yml`). It is an immutable, rpm-ostree-based desktop image.
- The current image recipe explicitly installs `firewalld`, `cups`, `cups-filters`, and `nss-mdns`. Printer support is therefore the one office support area already evidenced in the image definition.
- `docs/fin-coaching-tips-discovery.md` establishes product rules worth carrying into this surface: plain advisor language; no random/nagging tips; show only verified capabilities; local-only state; no telemetry; do not retain prompts, client names, file names, contents, or Fin answers; and do not imply legal, suitability, or compliance decisions.
- There is **no Welcome application, Pi/Fin executable, D-Bus API, service, prompt contract, desktop entry, or support-playbook implementation** in this repository today. The Pi handoff interface must be specified before implementation.

Fedora 44 is also moving its KDE variants toward **Plasma Setup** for core first-boot account/system configuration. SP+ Help & Fixes should coexist with that system OOBE; it should not duplicate account creation, locale, or installer work. [Fedora Unified KDE OOBE](https://fedoraproject.org/wiki/Changes/Unified_KDE_OOBE)

## Product shape for a high-consequence, low-technical-confidence advisor

Treat “paranoid” as a legitimate need for **proof, control, reversibility, and privacy**, not as a need for more warnings.

### Home screen

```
What do you need help with?
[ Printer will not print                          ]

[ Fix a problem ]  [ Change something ]  [ Learn how ]

Today
• Printer status: Ready                         [Check]
• Updates: Ready to install after restart       [Review]
• Ask Pi for help                               [Open]

Recent fixes                                      [View history]
```

Use symptom language and synonyms, not Linux nouns:

- “My printer will not print” / “scanner” / “print queue”
- “I cannot get online” / “Wi-Fi” / “VPN”
- “My camera or microphone is not working”
- “I cannot open, save, or find a document”
- “A website or client portal is not working”
- “My computer needs an update or restart”
- “I need to change a setting”

### The support-flow contract

Every issue follows the same visible sequence:

1. **Describe the symptom** in plain language.
2. **Check safely** — automatic, read-only checks first. State what is being checked.
3. **Explain what was found** in one or two sentences, without raw logs by default.
4. **Offer one recommended next action**, not a dashboard of technical fixes.
5. Before a write/change, show a **change receipt**:
   - what changes;
   - why it may help;
   - scope (this printer / this network / this account);
   - whether administrator approval, a restart, network access, or data sharing is involved;
   - how to undo or recover.
6. **Verify the result** after the action: e.g. test page printed, queue cleared, connection restored.
7. If unresolved, offer **Ask Pi**, a guided document, or a safe native settings page.

Use a consistent impact indicator:

| Level | Meaning | Example |
|---|---|---|
| Check | Read-only; no approval needed | Is CUPS running? Is the printer paused? |
| Guide | Opens the relevant KDE settings target | Open the printer configuration page |
| Change | Reversible local change; explicit approval | Resume a known queue or reconnect a saved network |
| System | Admin/restart or material impact; show full receipt | Add a printer, alter firewall/network policy, stage a host change |
| Escalate | No automatic action | Ask Pi with a reviewed diagnostic summary |

Never make a consequential action look like a harmless “Fix it” button.

### First-run mode

Keep it to four optional cards. The first-value target is: **the advisor knows where to get help and can complete one real office check without a terminal.**

1. **Your work computer is ready** — explain that SP+ Help & Fixes is always available.
2. **Print a test page / add your office printer** — only after the shipped printer path is verified.
3. **Keep work secure** — explain what SP+ and Pi do and do not send or change.
4. **Meet Pi** — a short, non-blocking example of asking in normal language.

Controls: **Start**, **Not now**, and **Do not show at sign-in again**. The last choice suppresses automatic launch only; it never removes the launcher entry or disables manual access.

Do not use a full-screen tour, celebratory ceremony, rotating promos, or required lessons. The existing Fin discovery brief is right: one useful, contextual suggestion is stronger than random capability advertising.

## Information architecture

The same topic graph should power search, cards, documents, and Pi escalation.

```text
SP+ Help & Fixes
├── Fix a problem
│   ├── Print and scan
│   ├── Internet, Wi-Fi, VPN, and websites
│   ├── Camera, microphone, speakers, and meetings
│   ├── Documents, PDFs, files, and storage
│   ├── Updates, restart, and recovery
│   └── Sign-in, passwords, and access
├── Change something
│   ├── Printer and default printer
│   ├── Display, sound, camera, and accessibility
│   ├── Network and connected devices
│   ├── Notifications and desktop preferences
│   └── Security, privacy, and backups
├── Learn how
│   ├── Daily office work
│   ├── Working safely with client information
│   ├── Using Pi safely
│   ├── Recovery and what to do before a restart
│   └── Reference articles
├── My computer
│   ├── What is working / needs attention
│   ├── Updates and restart status
│   ├── Connected printers and devices
│   └── Recent fixes and reversals
└── Ask Pi
```

Each topic should be a local, versioned content record rather than a hard-coded page:

```text
id, plain-language title, aliases/symptoms, affected SP+ builds,
read-only preflight checks, evidence-to-display, recommended action,
risk level, required authorization, native app/KCM destination,
expected result, verification check, undo/recovery, local help article,
Pi escalation template, data allowed in the handoff, owner, last-tested date
```

That structure prevents an attractive but dangerous failure mode: a button survives after the underlying capability has changed.

## Pi: use a structured, consented handoff — not arbitrary prompt injection

The request is to let Help & Fixes hand unresolved problems to the preloaded Pi. That is useful, but an arbitrary “inject this prompt into Pi” bridge is unsafe for a financial-services workstation.

### Recommended interaction

After the app completes its allowed read-only checks, show a preview such as:

```text
Ask Pi about: Printer will not print

Pi will receive
• The symptom you selected
• Checks performed: printer reachable, CUPS service status, queue state
• Safe diagnostic results: “Queue paused; 2 jobs waiting”

Pi will not receive
• Client documents, document names, email, credentials, clipboard, or browser content
• Any system change permission

[Edit description] [Ask Pi] [Cancel]
```

Pi may explain, ask a follow-up, or propose an action. **Trusted application code—not Pi—must decide whether any proposed action is allowed.** Pi should return a structured proposed action ID and parameters; the app must validate them against the local action registry, the user’s original issue, current system state, and the action’s risk class.

For any write, network change, file deletion, external transmission, permission change, or reboot: display the exact action and require fresh user approval. No client content should be included in diagnostics by default.

This follows OWASP’s guidance to treat tool and retrieved content as untrusted, enforce authorization outside the model, use least privilege, and require human approval for consequential actions. [OWASP Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) · [NIST AI RMF Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

### Direction confirmed after this survey

Pi is **cloud-default** and may both propose and execute actions within its preconfigured guardrail. The unresolved planning question is not whether Pi may act; it is what technically enforces that guardrail—prompt, tool policy, extension, external action broker, sandbox, or a combination.

The detailed runtime, prompt-injection, cloud-data, session, testing, and license-options research is in [Pi Cloud / Prompt-Injection Research Addendum](sp-plus-welcome-pi-cloud-research.md). It identifies Pi RPC as the leading integration candidate and explicitly leaves the product license undecided.

Before implementation, identify the guardrail’s name/path and describe its permitted tools, external destinations, privilege model, session retention, and confirmation behavior. A prompt-only guardrail is not an enforcement boundary for cloud Pi running with local process permissions.

## Apple patterns worth copying — and what not to copy

Apple has several separate support surfaces, not one giant “help” app. SP+ should use that separation internally while presenting one familiar front door.

| Apple pattern | Evidence | SP+ translation |
|---|---|---|
| **Setup Assistant** handles a few essential choices, migration, account/accessibility, then gets out of the way. | [Set up a Mac](https://support.apple.com/guide/macbook-pro/set-up-your-mac-apd831707cb3/2026/mac/26), [Set up iPhone](https://support.apple.com/guide/iphone/turn-on-and-set-up-iphone-iph1fd7e482f/26/ios/26) | Keep first-run short, skippable, and focused on becoming ready for office work. Leave Fedora Plasma Setup responsible for OS/OEM setup. |
| **Tips** is a collection of small, saveable, periodically updated lessons; notifications are optional. | [Tips on iPhone](https://support.apple.com/guide/iphone/tips-iph3afc3b3fc/ios) | Provide an on-demand “What else can Pi/SP+ help with?” collection and quiet staged suggestions. No random rotation or required notifications. |
| **Settings search** accepts familiar words/phrases and gives direct results and suggestions. | [Mac System Settings search](https://support.apple.com/guide/mac-help/find-system-settings-mchl8d10839d/mac), [iPhone Settings search](https://support.apple.com/guide/iphone/find-settings-iph079e1fe9d/26/ios/26) | Index symptoms, office language, and setting aliases. Each result should lead directly to a fix, the relevant KDE page, or a specific article—not merely a category. |
| **Built-in Help/User Guide** combines a searchable guide, table of contents, history, and share/printable articles. | [Mac built-in help](https://support.apple.com/guide/mac-help/get-help-on-your-mac-hlpvw003/13.0/mac/13.0), [Mac User Guide](https://support.apple.com/guide/mac-help/welcome-mh43558/mac) | Bundle a local searchable help tree that works offline. Add “Take me there” and “Show the steps” alongside every article. |
| **Apple Support** personalizes help, chat, repair, and videos around the owned product. | [Apple Support](https://support.apple.com/contact?cid=mc-nav-contact-contactlp-marcom-06032024) | Offer local device state and a privacy-reviewed Pi escalation, not a generic web forum dump. |
| **Safety Check** distinguishes selective review from an emergency reset, and explains the scope of sharing changes. | [Safety Check](https://support.apple.com/guide/iphone/manage-information-sharing-with-safety-check-iph42f0b2d53/ios) | Separate routine diagnostics from recovery/emergency actions. Label scope, consequence, and reversibility. Do not hide a sweeping reset behind a generic fix button. |

Apple’s code, artwork, UI text, screenshots, and trademarks are proprietary. Use it as a behavioral reference only.

## Newcomer-Linux survey

This is a representative benchmark set rather than a claim to have exhaustively reviewed every Linux derivative. It includes the requested Mint, Zorin, MX Linux, and CachyOS examples, the Fedora/KDE target stack, and complementary projects with distinct onboarding or action-center patterns.

| Project | What it does | Best lesson for SP+ | Limitation / avoid | Source |
|---|---|---|---|---|
| **KDE Plasma Welcome** | First-run/on-update Plasma wizard: network, Discover, customization, KDE features. Supports distro intro customization and numbered external QML pages. | It is native to the target desktop and explicitly supports distro-specific intro/pages. Its modes distinguish first run, post-update, and live media. | It is a skippable wizard; custom QML pages lack custom C++ support code; its `runCommand()` model is not a policy engine. Do not use it as the Pi/action core. | [repo + extension guide](https://github.com/KDE/plasma-welcome) |
| **Linux Mint Welcome** | Sidebar for Welcome, First Steps, Documentation, Help, and Contribute; direct links to updates, software, backup, drivers, firewall, settings, codecs. An autostart launcher honors a per-user “Show this dialog at startup” checkbox. | The exact permanent-app / optional-autostart pattern SP+ needs. It gathers common initial actions without hiding their native tools. | Its task list is distro-setup-centric and assumes an apt/Mint stack. Do not copy shell/state code. | [repo](https://github.com/linuxmint/mintwelcome) · [launcher](https://github.com/linuxmint/mintwelcome/blob/master/usr/bin/mintwelcome-launcher) · [actions](https://github.com/linuxmint/mintwelcome/blob/master/usr/lib/linuxmint/mintwelcome/mintwelcome.py) |
| **MX Welcome + MX Tools** | Separate welcome/resources screen and centralized categorized configuration-tool dashboard; can display hardware/system information and reports; filters tools by desktop/session state. | Split first-run orientation from a persistent operational toolbox internally, even if SP+ exposes one front door. Generate a useful support report only when requested. | A launcher grid is not a diagnosis experience. SP+ needs symptom-first playbooks, not a list of admin tools. | [MX Welcome](https://github.com/MX-Linux/mx-welcome) · [MX Tools](https://github.com/MX-Linux/mx-tools) |
| **CachyOS Welcome** | Rust/GTK welcome utility with active utilities, tweaks, package fixes, DNS configuration, update actions, and conditional UI based on installed hardware/software. | Real state detection before showing a tool; report success/failure instead of merely opening a terminal. This is the strongest example of “welcome becomes helper.” | Its actions are Arch/power-user specific and include broad system maintenance. SP+ must use an allowlisted, reversible action registry and no generic package cleanup buttons. | [repo](https://github.com/CachyOS/CachyOS-Welcome) · [utility wiring](https://github.com/CachyOS/CachyOS-Welcome/blob/develop/src/pages/mod.rs) |
| **Zorin OS** | The public Zorin organization does not expose a first-party persistent Welcome application comparable to Mint’s. Its beginner strategy is Windows-familiar layouts, a structured help site, and **Zorin Exec Guard** for unknown executables. | Use familiar transition language and provide a safe default: warn about an unknown/high-risk action, explain why, present a trusted alternative, and make cancel easy. | Do not invent a fake “official Zorin Welcome” reference. Zorin’s documentation is mostly external rather than an in-product action center. | [Zorin Help](https://help.zorin.com/docs/) · [Exec Guard](https://github.com/ZorinOS/zorin-exec-guard) |
| **elementary Onboarding** | Short, modular first-login application; skips/replays views, conditionally includes only capabilities that exist, and directs people to the relevant settings page. | Best model for capability gating: if a feature/tool is absent, do not display its card. One useful feature per view, with skip support. | It is deliberately first-run only. SP+ must retain its documentation and repair center after onboarding. | [repo](https://github.com/elementary/onboarding) · [design rationale](https://blog.elementary.io/get-settled-into-elementary-os-with-onboarding/) |
| **Ubuntu MATE / Ubuntu Budgie Welcome** | Large browser-like welcome experiences with recommended software, drivers, codecs, themes/layouts, documentation, and environment/test-mode support. | Curated software and visual explanation can help a new user; test support content in live/guest/online/offline states. | Their broad app catalog and web-view style create choice overload and a large content/asset/license surface. SP+ should not become an app store. | [Ubuntu MATE legacy](https://github.com/ubuntu-mate/ubuntu-mate-welcome-legacy) · [Budgie Welcome](https://github.com/UbuntuBudgie/budgie-welcome) |
| **GNOME Initial Setup / Pop!_OS COSMIC Initial Setup** | Essential OOBE only: language, keyboard, network, privacy, account, and summary; vendor configuration controls which pages are relevant. | Keep actual first boot focused on decisions with no safe default; make vendor-specific pages configurable. | Not a persistent self-service model. Do not cram daily support into installer/OOBE flow. | [GNOME/Endless Initial Setup](https://github.com/endlessm/gnome-initial-setup) · [COSMIC Initial Setup](https://github.com/pop-os/cosmic-initial-setup) |
| **openSUSE Welcome** | Legacy Qt/WebEngine first-boot resource window. openSUSE is moving toward a launcher for desktop-native greeters such as Plasma Welcome/GNOME Tour. | Use desktop-native components and a small, maintainable surface rather than a heavyweight embedded web site. | Avoid embedding a web browser for primary local help/action flows; it increases attack surface and offline fragility. | [repo](https://github.com/openSUSE/openSUSE-welcome) · [makeover plan](https://news.opensuse.org/2025/08/21/os-welcome-makeover/) |
| **EndeavourOS Welcome / Manjaro Hello** | Arch-family welcomes include installer, docs, updates/mirrors/package-cache actions; Manjaro Hello includes a rescue direction. | Recovery should be findable from the same front door as help. | Their choices assume users comfortable with package/mirror maintenance. They are behavioral references, not ICP matches. | [EndeavourOS](https://github.com/endeavouros-team/welcome) · [Manjaro Hello](https://gitlab.manjaro.org/applications/manjaro-hello) |

### Cross-project findings

1. **Mint gets the availability rule right:** automatic launch is optional; manual access persists.
2. **MX gets the organizational rule right:** a welcome layer and a tool layer are different jobs.
3. **CachyOS gets the action rule right:** a helper earns trust when it actually checks state and reports a result.
4. **elementary gets the restraint rule right:** show only relevant, usable capabilities and let users skip.
5. **Zorin gets the safety rule right:** the safe option and the reason for it should be visible before a risky action.
6. **KDE/Fedora is the right technical home:** native Plasma integration can open known tools and settings directly, but Fedora’s immutable model changes what a “fix” may safely do.

## Fedora/KDE implementation constraints to design around

- Kinoite changes the host through **rpm-ostree deployments**. Package layering, host updates, and rollback can require a reboot. A rollback changes the booted system deployment but does not roll back `/var` user data. The app must say this plainly. [rpm-ostree administration](https://coreos.github.io/rpm-ostree/administrator-handbook/)
- Prefer **Flatpak/Discover** for ordinary desktop applications. Fedora packages a Discover rpm-ostree backend for system updates, but support paths must be tested on the exact SP+ image. [Fedora Discover rpm-ostree backend](https://packages.fedoraproject.org/pkgs/plasma-discover/plasma-discover-rpm-ostree/)
- Do not offer “install arbitrary RPM” as an office-user repair path. Layered packages should be an exceptional, receipt-bearing system action.
- Use existing printer infrastructure first. KDE Print Manager provides the Plasma/CUPS printer KCM, queue manager, status widget, and CUPS API wrapper; CUPS is already present in the SP+ recipe. [KDE Print Manager](https://github.com/KDE/print-manager) · [CUPS overview](https://openprinting.github.io/cups/doc/overview.html)

### Initial playbook priority

Do not advertise any of these until tested on the shipped image. Start with the known/likely paths below:

1. **Printer will not print** — CUPS service/queue/discovery checks; test page; launch the KDE printer KCM; redacted Pi escalation.
2. **I cannot get online** — only after Plasma NetworkManager behavior is verified on SP+.
3. **My computer needs an update/restart** — explain staged update and reboot consequences clearly.
4. **Ask Pi safely** — establish the consented handoff before broad Pi-driven remediation.
5. Add camera/mic, scan, browser/portal, PDF/file, email, and backup playbooks only after the SP+ application stack and support boundaries are known.

## FOSS source and license ledger

The image repository is Apache-2.0. That does **not** prevent shipping separate GPL applications in a Fedora image, but it does matter when copying or integrating source into the SP+ Welcome codebase. This is an engineering license screen, not legal advice; perform a file-level review and obtain counsel before distribution.

| Candidate | Use category | License signal | Recommendation |
|---|---|---|---|
| [KDE Kirigami](https://github.com/KDE/kirigami) | Native KDE/Qt Quick UI framework | LGPL-2.0-or-later | **Best UI foundation.** Build a new native Qt6/Kirigami interface that feels at home in Plasma. Follow LGPL obligations; do not static-link casually. |
| [KAuth](https://github.com/KDE/kauth) | Isolated privileged helper/action framework | Core source predominantly LGPL-2.1-or-later | **Best privilege pattern.** Keep UI/Pi unprivileged; implement one small, named helper per allowlisted action with PolicyKit authorization. |
| [KRunner](https://github.com/KDE/krunner) | Search/action framework for Plasma launcher | Predominantly LGPL-2.0/2.1-or-later | **Phase-two integration.** A narrowly scoped SP+ runner can surface “Fix printer” or “Ask Pi” from KDE search. Do not expose arbitrary shell actions. |
| [OpenPrinting CUPS / libcups](https://github.com/OpenPrinting/cups) | Printer discovery/status/IPP APIs | Apache-2.0 with project exceptions | **Good compatible protocol/API source.** Initially prefer calling the installed KDE Print Manager; later use CUPS/IPP only for bounded read-only diagnostics or reviewed workflows. |
| [KDE Print Manager](https://github.com/KDE/print-manager) | Existing CUPS/Plasma printer UI and KCM | Mixed repository; main UI source is largely GPL-2.0-or-later | **Invoke/reference, not copy.** Launch its printer KCM and study its CUPS model. Do not fold its GPL UI code into an Apache-only SP+ app. |
| [KDE Discover](https://github.com/KDE/discover) | Updates/software center | Mixed, GPL-dominant UI source | **Invoke/reference, not copy.** Let it own the update/software transaction UI where appropriate. |
| [KDE Plasma Welcome](https://github.com/KDE/plasma-welcome) | First-run QML wizard and distro extension points | Main QML/C++ sources: GPL-2.0-only OR GPL-3.0-only OR KDE Accepted GPL | **Reference or intentional separate GPL fork only.** Its custom-page mechanism is useful to study, but is not the core SP+ support architecture. |
| [Linux Mint Welcome](https://github.com/linuxmint/mintwelcome) | Optional-autostart welcome/action launcher | GPL-3.0-or-later | **Reference only** unless SP+ Welcome is intentionally GPL-licensed. Reuse the product pattern, not source. |
| [MX Welcome](https://github.com/MX-Linux/mx-welcome) / [MX Tools](https://github.com/MX-Linux/mx-tools) | Welcome and tool-center patterns | GPL-3.0-or-later | **Reference only** for an Apache app. |
| [CachyOS Welcome](https://github.com/CachyOS/CachyOS-Welcome) | Stateful fixes/tweaks UX | GPL-3.0 | **Reference only** for action wiring and feedback. |
| [elementary Onboarding](https://github.com/elementary/onboarding) | Modular conditional onboarding | GPL-3.0-or-later | **Reference only**; borrow the capability-gating behavior. |
| [Zorin Exec Guard](https://github.com/ZorinOS/zorin-exec-guard) | Risk confirmation and safer alternative UX | GPL-3.0 | **Reference only**; borrow the safe-default interaction design. |
| [Ubuntu MATE Welcome legacy](https://github.com/ubuntu-mate/ubuntu-mate-welcome-legacy) | Curated software/help content | GPL-2.0 | **Reference only.** Apache-2.0 and GPL-2.0-only are especially unsuitable for direct combination. |

### License decision rule

- **Recommended default:** make the new SP+ app Apache-2.0, use Qt/Kirigami/KAuth under their LGPL terms, call existing GPL system applications as separate processes/KCMs, and write original action/diagnostic code.
- **Alternative:** make a separately distributed GPL component or fork (for example, Plasma Welcome). This is valid only if SP+ deliberately accepts GPL distribution obligations for that component and reviews its assets/translations/file headers.
- **Never assume a repository-wide badge is enough.** KDE and Ubuntu-family projects contain file-level mixed licenses, artwork, translations, notices, and trademarks.
- Apache confirms that Apache-2.0 code may be included in a GPLv3 work, but a GPLv3 derivative cannot remain Apache-only; GPLv2-only is also incompatible with Apache-2.0 combination. [Apache GPL compatibility](https://www.apache.org/licenses/GPL-compatibility.html)

## Recommendation and exact next move

**Recommendation:** Build an original native Qt6/Kirigami SP+ Help & Fixes app with a locally versioned playbook registry, native KDE destinations, a smallest-possible KAuth/PolicyKit action helper, and a cloud-default Pi execution gateway that preserves the shipped guardrail. Treat Plasma Welcome, Mint, MX, CachyOS, elementary, and Zorin as source-of-truth product references—not copy-paste bases. The product license remains intentionally undecided; see the Pi addendum for options.

**Exact next move, still research/design rather than implementation:** create a one-page **Pi handoff contract** and validate the first four SP+ playbooks against a booted SP+ image:

1. Printer will not print.
2. Internet/Wi-Fi unavailable.
3. Update/restart needed.
4. Ask Pi safely.

For each, record the exact checks, native destination, action permissions, result verification, undo/recovery behavior, data permitted to reach Pi, and a screenshot/test proving that the advertised capability works.
