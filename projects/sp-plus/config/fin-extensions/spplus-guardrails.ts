/**
 * SP+ Guardrails — the mechanical boundary in front of Fin's bash tool.
 *
 * Fin runs AS the advisor, who is in `wheel`, which carries
 * `%wheel ALL=(ALL) NOPASSWD: ALL`. Fin therefore holds unprompted root. That is
 * deliberate and is argued in `sudoers-sp-plus`: a password prompt the advisor
 * cannot answer buys no security and stops every genuine repair.
 *
 * This file is the consequence of that grant. DN-31 decision 7: a system prompt
 * is not a guardrail. Instructional text telling a model not to do something is
 * a request it can be argued around, and it fails silently on the one occasion
 * it matters. The boundary has to sit in the tool path.
 *
 * ADAPTED FROM Bee's permission-gate.ts, WITH ONE DELIBERATE INVERSION.
 * Bee blocks `sudo` outright. Fin MUST NOT. Fixing a printer, reading a service
 * log, installing a font and repairing a mount are all sudo, and they are Fin's
 * entire job. Blocking sudo here would leave the advisor with an assistant that
 * can diagnose everything and repair nothing, which is the failure this product
 * exists to remove. So privilege is not what we gate. Irreversibility is.
 *
 * WHAT THIS GATES, and the rule behind the list:
 *   1. Anything that destroys the advisor's own files. DN-31 decision 5,
 *      verified on a live guest: `bootc rollback` restores `/usr` and the
 *      deployment, and restores NOTHING under `/var` or `/home`. The advisor's
 *      documents have no undo. The image does.
 *   2. Anything that weakens the machine's own protection. Standing project
 *      rule: never weaken SELinux or the firewall.
 *   3. Anything that sends mail. DN-31 decision 10: Fin composes, the advisor
 *      sends. An advisor's regulatory exposure sits on what leaves the account.
 *   4. Anything that destroys the ability to boot or to decrypt the disk.
 *
 *   5. Anything that OUTLIVES the conversation it was asked for: a new software
 *      source, a signing key, a service that starts by itself, another
 *      administrator, a different place to get updates. Added 2026-09-11.
 *
 * WHY 5 IS HERE, AND WHAT IT IS NOT. An external source review on 2026-09-11
 * showed that a click cannot be a boundary against malware already running as
 * the advisor: KWin's fake_input, portal preauthorization, XWayland XTEST via
 * libei, KWin's EIS D-Bus interface and AT-SPI DoAction each synthesise one, and
 * the first of those carries a literal `// TODO: make secure` upstream. That
 * verdict is accepted. It is why this is NOT described as a defence against
 * malware, and why nothing here claims to prove a human is present.
 *
 * The adversary class 5 does answer is different: instructions smuggled into
 * content Fin reads -- a log line, a filename, a web page, a document an advisor
 * was sent. There the attacker is TEXT, and text cannot answer this prompt. It
 * can only ask Fin to. Persistence is what such an instruction needs in order to
 * matter beyond the moment, so persistence is what gets shown to the advisor.
 *
 * Frequency is the design constraint, not coverage. A control the advisor is
 * shown too often is one they stop reading, and then we would be relying on
 * something that is no longer there. Installing a font stays silent. Installing
 * a timer asks. Package installation is deliberately NOT in this class.
 *
 * FAILS CLOSED. With no UI there is nobody present to approve, so a match is
 * blocked outright rather than waved through.
 *
 * SCOPE LIMIT, stated so nobody mistakes this for a sandbox: this covers the
 * `bash` tool. `spplus-workspace.ts` covers the write and edit tools.
 * Neither is a substitute for a sandbox, and a sufficiently creative command
 * will get past both. This raises the floor; it does not close the room.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

interface Rule {
	/** Plain-English, advisor-readable. It is shown to a non-technical person. */
	label: string;
	pattern: RegExp;
	/**
	 * What to do INSTEAD, addressed to the model, not the advisor. A block with
	 * no way forward makes an assistant hunt for another route -- which is both
	 * the expensive path and the dangerous one. Naming the safe form turns a
	 * refusal into a correction it can act on in one step.
	 */
	fix?: string;
	/**
	 * Why the rule exists, which decides what the advisor is actually asked.
	 * "irreversible" is the default and means their own work cannot be brought
	 * back. "persistence" means the command IS undoable but outlives this
	 * conversation, so the question is about what keeps running afterwards.
	 * Asking the wrong question trains people to stop reading the right one.
	 */
	kind?: "irreversible" | "persistence";
}

export default function (pi: ExtensionAPI) {
	const rules: Rule[] = [
		// --- 1. The advisor's own files, which no rollback can bring back ---
		{ label: "deletes a folder and everything inside it", pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive)/i },
		{ label: "permanently shreds a file", pattern: /\bshred\b/i },
		{ label: "empties a file completely", pattern: /\btruncate\b[^\n]*-s\s*0\b/i },
		{ label: "deletes files it finds while searching", pattern: /\bfind\b[^\n]*(-delete\b|-exec\s+rm\b)/i },
		{ label: "erases a whole disk or partition", pattern: /\b(mkfs(\.\w+)?|wipefs|sgdisk|parted|fdisk)\b/i },
		{ label: "writes directly over a disk", pattern: /\bdd\b[^\n]*\bof=\s*\/dev\//i },

		// --- 1b. The MUNDANE ways a helpful assistant destroys a document ---
		// Everything in section 1 is dramatic: mkfs, dd, shred. A sweep on
		// 2026-09-04 ran 10 realistic accidents -- the shapes an assistant reaches
		// for while tidying up, not while being malicious -- and 9 of 10 went
		// straight through. `cp` and `mv` overwrite silently by DEFAULT, which is
		// the whole problem: the advisor asks Fin to organize a folder and a
		// statement lands on top of a client file with no error and no undo.
		//
		// These do not forbid organizing. They forbid organizing DESTRUCTIVELY:
		// the reason text names `-n` so the model retries correctly on the first
		// attempt instead of hunting for another way in.
		{ label: "could overwrite a file in the advisor's own folders", pattern: /\b(cp|mv)\b(?![^\n]*(\s-\w*n\b|--no-clobber|--update))[^\n]*(~|\$HOME|\/(?:var\/)?home\/[^\/\s]+)\/(Documents|Desktop|Downloads|Pictures)\/(?!Fin\/)/i, fix: "Use `mv -n` or `cp -n` so an existing file is never replaced, then tell the advisor which files were already there." },
		{ label: "moves one of the advisor's main folders somewhere else", pattern: /\bmv\b\s+(-\S+\s+)*(~|\$HOME|\/(?:var\/)?home\/[^\/\s]+)\/(Documents|Desktop|Downloads|Pictures)\/?(\s|$)/i, fix: "Move the files inside the folder, not the folder itself." },
		{ label: "overwrites a file in the advisor's own folders", pattern: /(>{1,2}|\btee\b)[^\n]*(~|\$HOME|\/(?:var\/)?home\/[^\/\s]+)\/(Documents|Desktop|Downloads|Pictures)\/(?!Fin\/)/i, fix: "Write new files to Documents/Fin instead. Never write over something the advisor made." },
		{ label: "mirrors one folder over another, deleting whatever does not match", pattern: /\brsync\b[^\n]*--delete/i, fix: "Copy without --delete. Nothing an advisor asks for needs files removed from the destination." },
		{ label: "deletes work that was never saved to the project's history", pattern: /\bgit\s+clean\b[^\n]*\s-\w*[dx]/i },
		{ label: "removes every scheduled task at once", pattern: /\bcrontab\b[^\n]*\s-r\b/i },

		// --- 1c. The desktop the advisor depends on. Christopher's ruling,
		// 2026-09-12: "We need Fin to treat key desktop components like Dolphin
		// and other system utilities like it does root."
		//
		// MEASURED, not theorised. Asked to remove Dolphin, Fin escalated through
		// three commands in one turn -- `rpm-ostree uninstall dolphin`, then
		// `rpm-ostree override remove dolphin`, then, when a dependency refused,
		// `rpm-ostree override remove dolphin dolphin-plugins` -- and deleted the
		// advisor's FILE MANAGER out of the base image. No rule matched, and no
		// permission question was asked. Fin's system prompt does say "confirm
		// first if it would remove software they use"; it obeyed that fifteen
		// minutes earlier for a different command and ignored it here. DN-31
		// decision 7 demonstrating itself on a live machine.
		//
		// WHY THIS IS ITS OWN CLASS AND NOT PART OF SECTION 5. Section 5 is about
		// persistence, and its question is "this keeps working after this
		// conversation ends" -- true here, but far too mild. An advisor who loses
		// their file manager has lost a way to reach their own documents, and the
		// honest question is the irreversible one. So this sits ABOVE the generic
		// rpm-ostree rule below and takes the stronger label, because `rules.find`
		// returns the first match.
		//
		// WHY IT IS NOT COVERED BY "the OS is read-only". That assumption is what
		// let this through. rpm-ostree never touches the running system: it writes
		// a NEW deployment, so every destructive verb succeeds quietly and only
		// bites on the next restart. Nothing visibly breaks at the moment of the
		// mistake, which is precisely why nothing caught it.
		// WIDENED 2026-09-12 on Christopher's ruling -- "I would rather be thorough
		// on Fin than not. There are other ways to remove things, we just need Fin
		// to be a tool, not a destroyer." Every advisor-facing app the image
		// actually ships is now named, verified present with rpm -q on the running
		// v0.11.1 VM rather than assumed: the password manager (keepassxc) and the
		// four Flatpaks (bitwarden, signal, zoom, boxes) because they hold or reach
		// advisor credentials and client calls; kio-extras because DN-26 makes it
		// what lets the file manager browse an office share; the portal, sound,
		// software-centre and monitor because losing them looks like a broken
		// machine to someone who cannot diagnose it; okular, gwenview, ark, kate,
		// kitty and libreoffice because an advisor who loses their PDF reader or
		// their office suite has lost the working day.
		//
		// Thunderbird is deliberately NOT here: rpm -q says the image does not
		// ship it, and a rule naming software that does not exist protects nothing
		// while reading as though it does.
		//
		// The bare Flatpak names are enough for the full application ids --
		// `bitwarden` has a word boundary on both sides inside
		// `com.bitwarden.desktop` -- so the ids are not repeated here.
		{
			label: "removes part of the desktop this computer needs to work",
			pattern: /\b(rpm-ostree\b[^\n]*\boverride\b[^\n]*\b(remove|replace)|rpm-ostree\b[^\n]*\buninstall\b|dnf5?\b[^\n]*\b(remove|erase|autoremove)\b|flatpak\b[^\n]*\buninstall\b)[^\n]*\b(dolphin|konsole|plasma-workspace|plasma-desktop|plasma-nm|plasma-pa|plasma-discover|plasma-systemmonitor|kwin|kwin-wayland|sddm|systemsettings|kde-cli-tools|kscreen|kwallet\w*|keepassxc|kio-extras|xdg-desktop-portal\w*|polkit\w*|NetworkManager\w*|firewalld|cups\w*|pipewire|wireplumber|udisks2|okular|gwenview|ark|kate|kitty|libreoffice\w*|brave-browser|bitwarden|signal|zoom|boxes|sp-plus\w*|spplus\w*)\b/i,
			fix: "Do not remove it. This is part of the desktop or a service SP+ needs. If it is misbehaving, repair or restart it instead, and say what is actually wrong.",
		},

		// Christopher's original rule, 2026-08-28: the advisor must be safe from
		// "a 1 off application written into a .env directory or something crazy".
		// spplus-workspace.ts holds that for the write and edit TOOLS -- but bash
		// redirection walks straight around it, which the same sweep proved.
		{ label: "changes the advisor's own hidden settings files", pattern: /(>{1,2}|\btee\b)[^\n]*(~|\$HOME|\/(?:var\/)?home\/[^\/\s]+)\/\.[A-Za-z]/i, fix: "Fin writes in Documents/Fin. Ask the advisor before changing how their account is set up." },

		// --- 2. The machine's own protection ---
		// SELinux and the firewall are not tuning knobs. Turning either off to
		// make something work is the documented wrong answer in this project.
		{ label: "turns off one of this computer's built-in protections", pattern: /\bsetenforce\s+0\b|\bselinux\s*=\s*0\b|SELINUX\s*=\s*(disabled|permissive)/i },
		{ label: "turns off the firewall", pattern: /\bsystemctl\b[^\n]*\b(stop|disable|mask)\b[^\n]*\bfirewalld\b|\bfirewall-cmd\b[^\n]*(--set-default-zone\s*=\s*trusted|--zone\s*=\s*trusted)/i },
		{ label: "makes files readable by everyone on the machine", pattern: /\b(chmod|chown)\b[^\n]*777/i },
		{ label: "changes who can open a folder and everything inside it", pattern: /\b(chmod|chown)\b[^\n]*(\s-R\b|--recursive)/i },
		{ label: "runs a script downloaded from the internet", pattern: /\b(curl|wget)\b[^\n]*\|\s*(sudo\s+)?(ba|z|k)?sh\b/i },

		// --- 3. Outgoing mail. Fin drafts; the advisor sends. DN-31 decision 10 ---
		{ label: "sends an email", pattern: /\b(msmtp|sendmail|swaks|mutt|mailx)\b/i },
		{ label: "sends an email", pattern: /(^|[\s;&|(])mail\s+/i },
		{ label: "sends an email", pattern: /\bthunderbird\b[^\n]*(-compose|--compose)/i },

		// --- 3b. Fin updates with SP+, never from a registry. 2026-09-04 ---
		// Asked to update itself, the obvious move is `npm install -g`. Here /usr is
		// read-only so that fails -- and the natural retry, the same install with a
		// writable prefix, SUCCEEDS and is worse. /usr/local shadows the pinned agent
		// on PATH while `fin` still execs /usr/bin/pi, so the advisor is told the
		// update worked while Fin goes on running the old build. That is exactly what
		// happened on the test VM on 2026-09-04, nine seconds between the two
		// attempts, leaving 156 MB in /var on a disk that was already 95% full.
		{ label: "installs a second copy of Fin outside the system update", pattern: /\b(npm|pnpm|yarn)\b[^\n]*\b(install|add|up|update|upgrade|i)\b[^\n]*pi-coding-agent/i },
		{ label: "installs software into the system folders from the internet", pattern: /\b(npm|pnpm|yarn)\b[^\n]*\b(install|add|i)\b[^\n]*(--prefix[=\s]*\/usr\b|--prefix[=\s]*\/usr\/local\b|(^|\s)-g(\s|$)|--global\b)/i },

		// --- 4. Booting, and getting back into an encrypted disk ---
		// Losing a LUKS keyslot on a machine whose owner cannot recite the
		// passphrase is unrecoverable, and the data is client records.
		{ label: "changes the disk encryption keys", pattern: /\bcryptsetup\b[^\n]*\b(luksErase|luksKillSlot|luksFormat|luksRemoveKey|erase)\b/i },

		/*
		 * HELP IS NOT AN ACTION. Measured on the v0.11.2 VM, 2026-09-12: asked to
		 * reinstall the file manager, Fin ran three `rpm-ostree ... --help`
		 * commands to find out how, and the advisor was shown "This step changes
		 * where this computer gets its system updates, and it keeps working after
		 * this conversation ends." Reading help text changes nothing. The warning
		 * was simply false.
		 *
		 * That is worse than a missing rule. This file's own reasoning says an
		 * advisor who catches one warning lying stops believing the next one, and
		 * the next one may be about their client folder. dnf, flatpak and
		 * systemctl never had this problem -- their rules key off a target, and
		 * `--help` is not a target. Only the rpm-ostree family matched the verb
		 * alone, so only it is excluded here.
		 *
		 * THE BYPASS, AND WHY IT IS ACCEPTABLE. This does mean `rpm-ostree
		 * override remove dolphin --help` no longer matches THESE rules. It is
		 * safe in two independent ways: rpm-ostree short-circuits on --help and
		 * performs no action, and the desktop-protection rule above deliberately
		 * carries NO help exclusion, so anything naming an app the advisor
		 * depends on is still blocked whatever flags follow it.
		 */
		{ label: "removes an installed system version", pattern: /\bostree\b[^\n]*\badmin\b[^\n]*\bundeploy\b|\brpm-ostree\b(?![^\n]*(?:--help|--version|\s-h\b))[^\n]*\bcleanup\b[^\n]*-\w*[rp]/i },
		{ label: "changes how this computer starts up", pattern: /\b(grub2-install|bootctl\s+install|efibootmgr\b[^\n]*-B)\b/i },
		{ label: "removes a user account", pattern: /\buserdel\b|\bpasswd\b[^\n]*\s-d\b/i },

		// --- Process control. `pkill -F` reads a pidfile and is the safe form ---
		{ label: "stops programs by matching their name", pattern: /\bpkill\b(?![^\n]*\s-F\b)/ },
		{ label: "stops programs by matching their name", pattern: /\bkillall\b/i },

		// --- Credential and client-data stores, written from bash ---
		// Matching a WRITE verb together with a protected path keeps reads
		// working. Fin must still be able to look at these to diagnose; it is
		// rewriting them unasked that ends badly.
		{
			label: "changes a saved password, key or mail store",
			pattern: /(>{1,2}|\btee\b|\bdd\b|\bcp\b|\bmv\b|\brm\b|\bln\b|\bchmod\b|\bchown\b)[^\n]*(\/etc\/sp-plus\/|\.ssh\/|\.thunderbird|\.mozilla|kwalletd|\.kdbx|fin\.env|shadow\b)/i,
		},

		// --- 5. Things that outlive the conversation. 2026-09-11 -------------
		// Ordered last on purpose: `rules.find` returns the FIRST match, so a
		// command that is both destructive and persistent keeps its stronger
		// label. `crontab -r` stays "removes every scheduled task at once".
		//
		// Each of these is reversible. None is shown because it is dangerous;
		// they are shown because an instruction hidden in something Fin read
		// would need one of them to still be there tomorrow. Read-only forms
		// are excluded by construction -- `systemctl is-enabled` and
		// `bootc upgrade` must never reach this list.

		// New software sources and the keys that make them trusted.
		{ label: "adds a new place this computer installs software from", pattern: /\bdnf5?\b[^\n]*\bconfig-manager\b[^\n]*(--add-repo|\baddrepo\b)/i, kind: "persistence" },
		{ label: "adds a new place this computer installs software from", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\bln\b)[^\n]*\/etc\/yum\.repos\.d\//i, kind: "persistence" },
		{ label: "adds a new app source", pattern: /\bflatpak\b[^\n]*\bremote-add\b/i, kind: "persistence" },
		{ label: "trusts a new software signing key", pattern: /\b(rpm|rpmkeys)\b[^\n]*--import\b/i, kind: "persistence", fix: "Install from a source SP+ already trusts instead. Say which key and who issued it before asking again." },

		// Things that start by themselves from now on.
		{ label: "installs a background service that starts by itself", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\bln\b)[^\n]*\/etc\/systemd\/(system|user)\//i, kind: "persistence" },
		{ label: "installs a background service that starts by itself", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\bln\b)[^\n]*\.config\/systemd\//i, kind: "persistence" },
		{ label: "sets something to start automatically from now on", pattern: /\bsystemctl\b[^\n]*\b(re)?enable\b/i, kind: "persistence", fix: "If the advisor only needs it working now, use `systemctl start` and leave boot alone." },
		{ label: "sets something to start automatically from now on", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\bln\b)[^\n]*\.config\/autostart\//i, kind: "persistence" },
		{ label: "schedules something to run again later", pattern: /\bcrontab\b(?![^\n]*\s-[lr]\b)/i, kind: "persistence" },

		// Who may administer the machine.
		{ label: "changes who is allowed to administer this computer", pattern: /\bvisudo\b/i, kind: "persistence" },
		{ label: "changes who is allowed to administer this computer", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\bln\b)[^\n]*\/etc\/(sudoers|pam\.d\/)/i, kind: "persistence" },
		{ label: "creates another account on this computer", pattern: /\b(useradd|adduser|groupadd)\b/i, kind: "persistence" },
		{ label: "gives an account administrator rights", pattern: /\b(usermod|gpasswd)\b[^\n]*\b(wheel|sudo)\b/i, kind: "persistence" },

		// Where the operating system itself comes from, and what it will accept.
		{ label: "changes where this computer gets its system updates", pattern: /\bbootc\b[^\n]*\bswitch\b/i, kind: "persistence", fix: "`bootc upgrade` updates from the source SP+ already uses and does not need this." },
		{ label: "changes where this computer gets its system updates", pattern: /\brpm-ostree\b(?![^\n]*(?:--help|--version|\s-h\b))[^\n]*\brebase\b/i, kind: "persistence" },

		// The rest of the rpm-ostree family. Until 2026-09-12 only `cleanup -r|-p`
		// and `rebase` were named here, which left `install`, `uninstall`,
		// `override`, `reset` and `initramfs` completely open. Asked for a codec,
		// Fin installed the RPM Fusion release packages STRAIGHT FROM A URL with
		// `rpm-ostree install` -- walking round all four of the repo rules above,
		// which only describe `config-manager --add-repo`, writes into
		// /etc/yum.repos.d, `flatpak remote-add` and `rpm --import`. The audit log
		// recorded `key_enforce=0 gpg_res=0`: it went on unsigned. Seventeen
		// seconds, no prompt, and `bootc upgrade` then refused to run at all --
		// "Deployment contains local rpm-ostree modifications" -- so the machine
		// could no longer receive ANY future version of SP+.
		//
		// Named as a family rather than verb by verb, because enumerating the
		// verbs somebody thought of is what failed the first time.
		{ label: "changes the software that is built into this computer", pattern: /\brpm-ostree\b(?![^\n]*(?:--help|--version|\s-h\b))[^\n]*\b(install|uninstall|override|reset|initramfs)\b/i, kind: "persistence", fix: "Prefer a Flatpak from a source SP+ already trusts; it installs for the advisor alone and never blocks system updates." },

		// The same door with a different handle. `dnf install <a web address>`
		// fetches and installs a package nobody vetted; it is how a repository
		// gets added as a package rather than as a repo file.
		{ label: "installs software straight from a web address", pattern: /\bdnf5?\b[^\n]*\binstall\b[^\n]*https?:\/\//i, kind: "persistence", fix: "Install from a source SP+ already trusts instead, and say who published this one before asking again." },

		// --- 6. Switching things off, and the routes the 2026-09-12 sweep found
		// still open after the desktop rule landed. Every one of these was PROBED
		// against this handler, not reasoned about: ten commands passed that should
		// not have. Christopher's ruling the same day: "we just need Fin to be a
		// tool, not a destroyer."
		//
		// These sit LAST on purpose. `rules.find` returns the first match, so
		// putting them here means no existing rule's label changes -- e.g.
		// `rpm-ostree kargs --append=selinux=0` keeps the more accurate
		// "turns off one of this computer's built-in protections".

		// The same hole as the desktop rule, through a different door: we guarded
		// REMOVING the software and not SWITCHING IT OFF. Disabling the login
		// screen or masking networking leaves exactly the machine Fin produced on
		// 2026-09-12 -- one the advisor cannot use. The line is persistence, not
		// power: `start`, `stop` and `restart` stay free because a stopped service
		// returns on reboot and restarting IS the repair Fin is for. `disable` and
		// `mask` do not come back, so they ask.
		{
			label: "turns off something this computer needs to work",
			pattern: /\bsystemctl\b[^\n]*\b(disable|mask)\b[^\n]*\b(sddm|NetworkManager\w*|cups\w*|avahi\w*|pipewire\w*|wireplumber|polkit\w*|udisks2|plasma\w*|dbus\w*|systemd-resolved|rpm-ostreed\w*|bootc\w*|sp-plus\w*|spplus\w*)\b/i,
			kind: "persistence",
			fix: "If it is misbehaving, restart it instead with `systemctl restart <name>`. Leave disable and mask alone.",
		},

		// The hardening the posture gate measures lives on the kernel command
		// line. `--append=selinux=0` was already caught by section 2; DELETING a
		// hardening argument was not, so the machine could be quietly unhardened
		// and the gate would still report it as it found it. Listing is fine --
		// only the modifying flags ask.
		{
			label: "removes one of this computer's safety settings",
			pattern: /\brpm-ostree\b(?![^\n]*(?:--help|--version|\s-h\b))[^\n]*\bkargs\b[^\n]*(--delete|--replace|--append|--editor)/i,
			kind: "persistence",
			fix: "Do not change the kernel settings. These are the hardening SP+ ships. Say which one is causing a problem and why.",
		},

		// Workspace confinement covers Fin's write tool; shell redirection walks
		// round it, which is the same bypass the 2026-08-28 dotfile rule exists
		// for. A bad filesystem or encryption table is an unbootable machine, and
		// an advisor cannot recover one. Named files, not all of /etc, so ordinary
		// repair still works.
		{
			label: "changes a file this computer needs to start or stay secure",
			pattern: /(>{1,2}|\btee\b)[^\n]*\/etc\/(fstab|crypttab|default\/grub|sudoers|shadow|passwd|group|gshadow|pam\.d\/|selinux\/config|ssh\/|machine-id|kernel\/|dracut\.conf)/i,
			fix: "Do not write to this file. If something will not start or mount, say what is failing and let a person decide.",
		},

		// The restore path. These are how the machine goes back, and the Debian
		// plan makes Timeshift the rollback mechanism outright, so deleting them
		// removes the recovery rather than anything the advisor can see.
		{
			label: "deletes the machine's own safety copies",
			pattern: /\bbtrfs\b[^\n]*\bsubvolume\b[^\n]*\bdelete\b|\btimeshift\b[^\n]*--delete|\bsnapper\b[^\n]*\bdelete\b/i,
			fix: "These are how this computer goes back if something breaks. Do not delete them. If disk space is the problem, say how much is needed.",
		},

		// Adding a software source asks (section 5). Removing one did not, and
		// deleting Flathub is how the advisor stops getting app updates.
		{ label: "removes a place this computer installs software from", pattern: /\bflatpak\b[^\n]*\bremote-(delete|modify)\b/i, kind: "persistence", fix: "Leave the software sources alone. If an app is misbehaving, say which one." },

		// Changing the login shell can lock the advisor out of their own machine.
		{ label: "changes how the advisor signs in", pattern: /\bchsh\b/i, kind: "persistence", fix: "Do not change the login shell. Nothing an advisor asks for needs this." },

		// Loosening a kernel setting at runtime. Not persistent, but it weakens
		// the machine now and nothing in a repair needs it. Reading is fine.
		{ label: "changes a safety setting the computer relies on while it is running", pattern: /\bsysctl\b[^\n]*(\s-w\b|\b\w+\.\w+\s*=)/i, fix: "Do not change kernel settings to make something work. Say what is failing instead." },
		{ label: "changes which system updates this computer will trust", pattern: /(>{1,2}|\btee\b|\bcp\b|\bmv\b|\brm\b|\bln\b)[^\n]*\/etc\/(containers\/policy\.json|pki\/containers\/)/i, kind: "persistence" },
	];

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;

		const command = event.input.command as string;
		const matched = rules.find((rule) => rule.pattern.test(command));
		if (!matched) return undefined;

		// Written for the advisor, not for a developer. They are being asked to
		// authorise something they did not type and may not recognise, so the
		// question says what it does in their language and shows the command.
		const reason = `This step ${matched.label}`;
		const guidance = matched.fix ? ` ${matched.fix}` : "";

		if (!ctx.hasUI) {
			return { block: true, reason: `${reason}. Blocked: nobody is here to approve it.${guidance}` };
		}

		// A persistence rule that said "cannot be undone" would be lying, and an
		// advisor who notices that once discounts every later warning.
		const consequence = matched.kind === "persistence"
			? "and it keeps working after this conversation ends"
			: "which cannot be undone";

		const choice = await ctx.ui.select(
			`⚠️  ${reason}, ${consequence}.\n\n  ${command}\n\nAllow it?`,
			["No", "Yes"],
		);

		if (choice !== "Yes") {
			return { block: true, reason: `${reason}; the advisor declined.${guidance}` };
		}

		return undefined;
	});
}
