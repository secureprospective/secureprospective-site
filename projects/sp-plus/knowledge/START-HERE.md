# SP+ Help

## Find the answer quickly

This is the main guide for the SP+ computer. Start with the sentence that sounds most like your question. If you do not see your answer, use [Getting more help](advisor-help/getting-more-help.md).

> **Important while SP+ is being tested:** a test image may not contain every screen or feature named here. If a menu or button is missing, do not try to work around it with random downloads or command-line instructions. Make a note of what you see and contact the test support channel.

### I want to...

| What you want | Go here |
|---|---|
| Learn what SP+ is | [What this computer is](advisor-help/welcome.md) |
| Find your way around | [Finding your way around](advisor-help/getting-around.md) |
| Use the browser or Bitwarden | [Browser and passwords](advisor-help/brave-and-bitwarden.md) |
| Install SP+ for the first time | [Install and first-day checklist](#install-and-first-day-checklist) |
| Connect to Wi-Fi | [Wi-Fi will not connect](troubleshooting/wifi-wont-connect.md) |
| Connect a printer | [Printer is not printing](troubleshooting/printer-not-printing.md) |
| Connect headphones or another Bluetooth device | [Bluetooth devices](troubleshooting/bluetooth-devices.md) |
| Use a second monitor or projector | [Second monitor problems](troubleshooting/second-monitor.md) |
| Fix sound or a microphone | [No sound](troubleshooting/no-sound.md) |
| Understand updates and restarts | [Updates and restarts](advisor-help/updates-and-restarts.md) |
| Answer a recovery-key screen | [Computer asks for a recovery key](troubleshooting/computer-asks-for-recovery-key.md) |
| Understand the Assistant | [The Assistant](advisor-help/asking-the-assistant.md) |
| Check what goes online | [What leaves this computer](security/what-leaves-this-computer.md) |
| Protect the recovery key | [Your encryption and recovery key](security/your-encryption-and-recovery-key.md) |
| Lock the screen and protect privacy | [Screen lock and privacy](security/screen-lock-and-privacy.md) |
| Make a security evidence record | [Security Evidence Report](advisor-help/security-evidence-report.md) |
| Get human help | [Getting more help](advisor-help/getting-more-help.md) |

### Search words that lead to the same answer

- **Internet, wireless, network, router, hotspot**: [Wi-Fi will not connect](troubleshooting/wifi-wont-connect.md)
- **Print, printer, queue, paper, fax**: [Printer is not printing](troubleshooting/printer-not-printing.md)
- **Earbuds, headphones, speaker, mouse, keyboard**: [Bluetooth devices](troubleshooting/bluetooth-devices.md)
- **Monitor, screen, projector, HDMI, dock, blurry display**: [Second monitor problems](troubleshooting/second-monitor.md)
- **Volume, speaker, microphone, mic, Zoom audio**: [No sound](troubleshooting/no-sound.md)
- **Unlock, startup key, disk key, recovery code**: [Computer asks for a recovery key](troubleshooting/computer-asks-for-recovery-key.md)
- **Password, login, autofill, vault, Bitwarden**: [Browser and passwords](advisor-help/brave-and-bitwarden.md)
- **Update, restart, old version, undo**: [Updates and restarts](advisor-help/updates-and-restarts.md)

---

## What SP+ is

SP+ is a computer operating system prepared for advisors who work with private client information. It is designed to keep the important protections on, make ordinary work feel familiar, and give you a clear way to get help when something goes wrong.

You do not need to learn Linux to use SP+. Your normal work still happens in a browser: email, calendars, carrier portals, quoting systems, CRM systems, electronic signatures, video calls, and cloud files.

SP+ is not a compliance certificate. It can provide useful evidence about this computer, but you and your business are still responsible for your policies, training, backups, vendors, and legal obligations.

### The five habits that matter most

1. **Lock the screen whenever you step away.** Closing the lid also locks a laptop.
2. **Keep the recovery key away from the computer.** A key stored only on the computer cannot help when the computer will not start.
3. **Let updates finish with a restart.** Do this at a suitable break instead of postponing it indefinitely.
4. **Keep passwords in Bitwarden.** Do not scatter them between browser prompts, notes, and scraps of paper.
5. **Ask before guessing.** Use the help pages or the Assistant instead of downloading a random repair tool.

---

## The first five minutes

1. Look at the bottom or top edge of the screen and identify your desktop style. The Windows-like version is KDE. The Mac-like version is GNOME. Both editions do the same work.
2. Open the browser and check that your important work sites open.
3. Open Bitwarden and sign in to your vault. See [Browser and passwords](advisor-help/brave-and-bitwarden.md).
4. Connect to Wi-Fi and print one test page if you have a printer.
5. Find the Assistant in the browser home page. You do not need to ask it anything yet. Knowing where it is removes pressure later.
6. Lock the screen, unlock it, and confirm that your login password works.

If this is a fresh installation, complete the recovery-key step below before moving client work onto the computer.

---

## Install and first-day checklist

SP+ installation changes the contents of a disk. Read this section before starting. Back up anything you cannot replace, keep the laptop plugged in, and do not begin just before an appointment.

### Before you install

- Confirm that the exact laptop model is on the supported hardware list for the release you received. Untested hardware is not the same as supported hardware.
- Copy important files to a separate, working backup. Open a few of those copies to prove that the backup works.
- Make sure you know the passwords for your email, cloud storage, and Bitwarden account.
- Check for a work program that only runs on Windows and has no web version. SP+ is not the right fit if your work depends on one of those programs.
- If you need Windows, use another computer. Dual boot is not supported in SP+ v1 because it adds a difficult recovery problem.
- Have the installation USB, your Wi-Fi password, and a planned disk passphrase ready.

### The installation decisions

The installer prepares routine choices for you. It asks you for the decisions that can erase data or create secrets:

1. **Which disk to use.** Check the model and size. Do not assume the first disk is the right one.
2. **Your disk passphrase.** This protects the data on the laptop when it is powered off. It is not the same thing as your normal login password. Choose one you can enter accurately and do not reuse a work-site password.
3. **Your user account.** Choose your name, username, and normal login password.
4. **Final confirmation.** Read the disk warning. Continuing erases the selected disk.
5. **Restart.** Remove the USB when the installer tells you to.

Never use a passphrase supplied by another person or printed in an instruction sheet. The secret must be yours and must not be included in an image, USB stick, screenshot, or support message.

### After the first boot

Complete these steps before using the computer for client work:

1. **Record the recovery key.** SP+ creates this on the computer. Store it away from the computer in a safe or lockbox. Do not save the only copy in the laptop, a screenshot folder, or a phone that travels with the laptop.
2. **Confirm that the recovery key can be found.** A key that nobody can locate is not a backup.
3. **Connect to Wi-Fi.** If it fails, use [Wi-Fi will not connect](troubleshooting/wifi-wont-connect.md).
4. **Allow the first update to finish.** Restart when asked.
5. **Test the hardware you use for work:** Wi-Fi, printer, second monitor, speakers, microphone, camera, and Bluetooth headset.
6. **Open the browser and Bitwarden.** Check a non-sensitive test login before moving work over.
7. **Generate a Security Evidence Report** if your program asks for one. It is evidence about the computer, not a compliance certificate.
8. **Keep the old computer or backup untouched** until you have opened the files and completed a normal workday on SP+.

---

## Everyday work

### Files and folders

Use the file app that matches your desktop:

- KDE calls it **Dolphin**. It works like Windows File Explorer.
- GNOME calls it **Files**. It works like macOS Finder.

Your **Home** folder is the normal place for files that belong to you. Create folders with names you will recognize, such as `Applications`, `Clients`, or `To review`. Keep client information in the approved work system or storage location for your business. Do not treat the desktop as a filing system or as a backup.

When you download a file, check where it went before opening it. If it contains sensitive information, move it to the approved location and remove extra copies from the Downloads folder when you are finished.

SP+ does not recover a file that was never backed up. Disk encryption protects a lost computer. It does not protect against deleting the only copy of a document.

### Browser and passwords

Brave is the SP+ browser. It works like Chrome because it uses the same basic page technology. Bitwarden is the one password manager supplied for SP+.

- Use Bitwarden to fill logins and create new passwords.
- Do not save the same password in the browser as well as Bitwarden.
- Let Bitwarden lock itself when you are away.
- Treat unexpected password requests, pop-ups, and browser extensions as suspicious.
- If a work site does not work, do not disable the browser protections on your own. Ask support first.

See [Browser and passwords](advisor-help/brave-and-bitwarden.md) for the full walkthrough.

### Apps and downloads

Look in the SP+ software library before downloading an installer. Avoid repair tools, browser extensions, and programs from random websites. A program that says it must disable protection, run as administrator, or install a special driver is a support question, not an instruction to follow.

If an app will not install or open:

1. Close it and try once more.
2. Restart the computer if the problem began recently.
3. Check whether the app is supported on SP+.
4. Ask the Assistant or support. Include the app name and the exact message, but never include a password, client name, or client document.

### Printing

Use **Ctrl+P** in the app or browser, select the printer, and print one page. If it fails, start with [Printer is not printing](troubleshooting/printer-not-printing.md).

### Displays

Plug in the monitor or projector, then open display settings. Choose whether to extend the desktop or mirror it. If the picture is blurry, the wrong size, sideways, or missing, use [Second monitor problems](troubleshooting/second-monitor.md).

### Sound, microphone, and camera

The volume control near the clock chooses the current speaker or headphones. Video-call apps have their own speaker and microphone choices, so check both places. For silence or a missing microphone, use [No sound](troubleshooting/no-sound.md).

Before a client call, do a short test call. Check the camera view, microphone input, speaker output, and the mute button. A camera or microphone indicator should appear when an app uses it. If an indicator appears when nothing should be using that device, close the app and ask support.

### Screenshots and copied text

Treat screenshots and clipboard contents as client information. Before sharing a screenshot, crop or cover names, policy numbers, account numbers, and other private information. Do not paste client information into the Assistant, a support chat, or a public website.

---

## Safety and privacy

### Encryption in plain English

The parts of the computer that hold your working files are encrypted. When the computer is powered off, someone who takes the drive should not be able to read those files without an unlock secret. A small startup area may remain outside the protected area because the computer needs it to start.

Encryption does not protect:

- A computer that is already unlocked and left unattended.
- A file copied to an unencrypted USB stick or another computer.
- A file sent to a website, email account, cloud service, or printer.
- The only copy of a file that you accidentally delete.

For the exact key and recovery instructions, read [Your encryption and recovery key](security/your-encryption-and-recovery-key.md).

### The disk passphrase, login password, and recovery key are different

- **Disk passphrase:** unlocks the encrypted storage during installation or when automatic startup unlocking cannot be used.
- **Login password:** opens your user session after the computer starts.
- **Recovery key:** a long, machine-specific emergency key used when normal startup unlocking is refused.

Do not send any of these to support. A support person can guide you without receiving your secret.

### Keep the screen private

Lock the screen before you leave, even for a minute. Automatic locking is a backup, not a reason to leave a client record visible. See [Screen lock and privacy](security/screen-lock-and-privacy.md).

### What the Assistant can see

The Assistant is for computer problems. It can check technical facts such as whether the print service is running, whether Wi-Fi is connected, and which error code appeared.

It should not need your:

- Documents, PDFs, spreadsheets, or downloaded files.
- Email, calendar, contacts, CRM records, or client names.
- Browser history, open tabs, cookies, bookmarks, or passwords.
- Bitwarden vault, clipboard, or private screenshots.
- File names and folder paths.

A diagnosis shows the technical information prepared for sending. Read [What leaves this computer](security/what-leaves-this-computer.md) before using cloud help with sensitive work.

### If a website asks for private information

Stop and check the web address. Do not type client information into a form just because a pop-up or email told you to. If you are unsure, close the page and contact the company through a phone number or bookmark you already trust.

---

## Updates and restarts

SP+ prepares system updates in the background. A restart completes the change. Your files, browser bookmarks, passwords, and settings should remain in place.

When you see an update notice:

1. Finish or save your work.
2. Close client portals and video calls.
3. Restart during a natural break.
4. Wait for the computer to return to the login screen.
5. Sign in and check the one work app you need next.

Do not turn off the computer during an update unless the screen has clearly stopped responding for a long time. If an update appears stuck, use [Updates and restarts](advisor-help/updates-and-restarts.md) or ask the Assistant.

SP+ keeps an earlier system version as an undo path when the product supports rollback for that release. Rollback changes the operating system, not your documents. Ask support before using it, and do not assume it can recover a deleted file.

---

## Fix a problem without making it worse

Use this order for almost any problem:

1. **Read the message exactly.** Take a photo only after removing private information from view.
2. **Check the simple cause.** Power, mute, cable, Wi-Fi, battery, paper, or a wrong output device are common.
3. **Restart once** if the problem started recently and no work is at risk.
4. **Use the matching help page** in the table at the top of this guide.
5. **Ask the Assistant.** Describe what changed, what you expected, and what you see now.
6. **Request human support** when the Assistant cannot resolve it or when the problem involves disk unlocking, a failed update, lost data, or a security concern.

### Stop and ask for help immediately if

- The computer asks for a recovery key and you cannot find it.
- The installer shows a disk you do not recognize.
- You see a request for a password, recovery key, or payment that you did not expect.
- A website or caller asks you to disable SP+ protection.
- You suspect client information was sent to the wrong person or website.
- A proposed fix would erase a disk, remove files, or install a driver.

Never keep guessing a recovery key. Stop after a few careful checks and contact support.

---

## The Assistant and support

The Assistant follows a simple pattern:

1. You describe the problem.
2. It checks only the relevant computer information.
3. It explains what it found.
4. It waits for your approval before making a change.
5. It checks whether the change worked.
6. It records the diagnosis, approval, action, and result.

Approval is specific to the proposed action. Approving a printer reconnect does not approve a different repair.

When requesting support, prepare:

- What you were doing.
- What changed, if anything.
- The exact error message.
- Whether a restart changed the problem.
- The model of the device involved, such as the printer or laptop.

Do not send passwords, recovery keys, client records, or full screenshots. See [Getting more help](advisor-help/getting-more-help.md).

---

## Security Evidence Report

The Security Evidence Report is a dated record of what this computer observed about itself. Depending on the release, it may include encryption status, Secure Boot status, firewall status, update history, device events, and approved Assistant actions.

Use it as evidence for your own records or to answer a questionnaire. It is not a certification, an audit, legal advice, or a promise that your entire business is compliant.

Generate a new report when someone asks for current information. Check the date before sending it. Read [Security Evidence Report](advisor-help/security-evidence-report.md).

---

## Small glossary

- **Assistant:** The SP+ helper for diagnosing computer problems and offering approved repairs.
- **Bitwarden:** The password manager supplied with SP+.
- **Browser:** The program you use to visit websites. SP+ supplies Brave.
- **Desktop:** The main screen, menus, windows, and controls you see after signing in.
- **Disk encryption:** Scrambling stored data so it cannot be read from a powered-off drive without an unlock secret.
- **Recovery key:** A long, unique emergency key for this one computer. It is not your login password.
- **Secure Boot:** A startup check that helps the computer reject untrusted startup software.
- **Security chip:** The hardware that can hold a startup secret and check important startup changes. Your computer may call it a TPM.
- **Update:** A newer prepared version of the operating system or an app.
- **PWA:** A website installed so it opens like an app. It is still a website and does not automatically gain access to your files.

---

## Related pages

- [What this computer is](advisor-help/welcome.md)
- [Finding your way around](advisor-help/getting-around.md)
- [Getting more help](advisor-help/getting-more-help.md)
- [What leaves this computer](security/what-leaves-this-computer.md)
