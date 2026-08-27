# SP+ Welcome v2 — ICP and first-run flow

The primary user is an independent financial advisor or small practice team. They are task-competent but system-unfamiliar: they know the work outcome they want and can follow visible instructions, but should not need Linux vocabulary, filesystem paths, package formats, desktop-environment names or a command line.

## First-hour outcomes and fears

They need to choose a look, know where apps/files/settings/help live, understand LibreOffice before opening it, connect an office folder, bring Fin into the work, test the printer and choose email, then optionally add practice tools. They need to be able to stop and come back without losing their place.

The important fears are “I broke it,” confidentiality exposure, credential confusion, irreversible setup, an interruption that asks for information they do not have, and a false green success. The UI must inspect what it can, explain what it will change, distinguish computer/share/cloud credentials, and show verified results rather than infer success from a process launch.

The DN-26 share decision remains a real system mount with a root-only `0600` credential file; the UI calls this “saved for this computer.” Fin opens without a key and its `/login` command owns provider sign-in. Flathub is open by decision, but an open store is not a practice approval.

## Day one versus later

Day one: visual theme choice, KDE orientation, LibreOffice reassurance, office folder, Fin handoff, printer/email, optional Bitwarden/Tailscale, and the no-show/reopen choice. Later: backup policy, driver review, broad app browsing, advanced email/calendar/scanner workflows and Fin's multi-document processes. The full store is discoverable but visually secondary to the named optional tools.

## Seven-screen flow

### 1. Welcome

Keep the accepted “Welcome to your new work computer” and “We’ll make the essentials ready, one small step at a time” voice. The advisor sees the promise that nothing changes until they choose it.

### 2. Choose the look

A proper eight-preview gallery, not names alone. SP+ Light is selected and carries the yellow `RECOMMENDED` badge. The remaining cards show real desktop pictures: SP+ Dark, Breeze, Breeze Dark, Fedora Light, Fedora Dark, Breeze Twilight and Windows Modern. Image-installed versus preview-only status is honest. Applying an in-image ID is asynchronous and verified from Plasma config; the draft never claims success for an absent custom theme.

### 3. Know your way around

Keep the labelled KDE desktop map. Beneath it is a breadcrumb help tree: `Know your way around › Category › Article`. The six help jobs follow the existing help standard: Start here, Everyday work, Fix a problem, Safety and privacy, Updates and recovery, Get more help. LibreOffice is a prominent first card. Everything opens in the same Welcome window, and returning leaves the setup screen/state untouched.

### 4. Connect this computer to the office

One screen combines office folder, printer and email. Each section has its own action and its own “I’ll do this later” path. The share username keeps “Not your computer login” beside it. No section requires another section to finish.

### 5. Bring Fin into your work

Keep the accepted provider cards, no key field, and explicit `/login` handoff. The safe first prompt remains non-sensitive and leaves advice responsibility with the advisor.

### 6. Add optional practice tools

Bitwarden and Tailscale remain the named recommended path. A separate Discover entry offers open software browsing after the Flathub remote is configured. The copy says plainly that open Flathub is not the same as practice approval.

### 7. Ready to work

Show completed/skipped states for look, office connections, Fin and optional tools. Keep “Don’t show this setup again” and the Applications → SP+ Welcome reopen path. The sidebar and progress labels are `N OF 7`.

## Real versus stub boundary

Real for cycle35, conservatively: installed look-and-feel application plus config read-back; Flathub remote add and verification; Discover launch; Bitwarden install verification; Tailscale service/login state; wsdd/share discovery and a privileged mount helper; printer/test-page result; Fin process launch with `/login`; `.desktop`, autostart and first-login plumbing.

Stubs until result channels are tested: cloud email OAuth, this prototype's credential submission, arbitrary open-Flathub app approval, source-help correction and any “ready” claim based only on a process return. A stub names what would happen and says what is not verified.
