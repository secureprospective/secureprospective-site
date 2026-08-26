# Browser and Passwords

Your browser is Brave. It looks and behaves like Chrome, because it is built from the same foundation. Everything you do on the web works the same: sign in to Google Workspace or Microsoft 365, your CRM, carrier portals, e-signature, and video calls.

## What was set up for you, and why

A few browser settings were configured before the computer reached you. You will notice them as things that are simply off:

- **Ads and tracking protections are on.** Fewer trackers means faster pages and less of your activity following you around.
- **Crypto wallet and rewards features are disabled.** They have no business on a work computer handling client data.
- **Brave's own AI chatbot is disabled.** The Assistant on this computer is the supported way to get AI help, because it is built to respect client-data boundaries. Browser chatbots are not.
- **Extensions are locked down.** Only Bitwarden is allowed. This is deliberate: extensions are one of the most common ways browsers get compromised. If you genuinely need another extension for work, raise it with support rather than looking for a workaround.
- **Your start page is the Advisor Assistant.** One click from anywhere gets you help.

To confirm what is set up, you can type `brave://policy` in the address bar. That page lists the managed settings. It exists mostly so support can verify your setup quickly.

## Passwords: Bitwarden does the remembering

Bitwarden is already installed in your browser and it is the only password tool on this computer. The computer's own "remember my password" prompts are turned off on purpose, so every login lives in one encrypted vault instead of being scattered across two tools.

### Three ideas cover everything

1. **Sign in to Bitwarden once.** That is logging into your vault account with your master password. Do it again only if you ever log out.
2. **Unlock during the day.** After a period of idle time, the vault locks itself. Unlocking takes seconds and needs your PIN or master password. Locked means protected; it does not mean signed out.
3. **Autofill does the typing.** On a login page, click the Bitwarden icon in the address bar and choose the account, or press **Ctrl+Shift+L** to fill automatically. It fills the right login for the site you are on.

### Good habits

- Let the vault lock itself. Fifteen minutes of idle time is a sensible default. This matters more than it sounds: an unlocked vault is an open diary to anyone at your keyboard, including a client who stepped into your office.
- When a site asks you to change a password, let Bitwarden generate a long random one and save it. You never need to remember it again.
- Never save client information in notes outside Bitwarden. If it must be written down, it belongs in the vault, which is encrypted.

## Private browsing windows

For anything you would not want appearing in history, such as researching on a client's behalf from their perspective, use a Private Window (menu, then "New Private Window"). A private window forgets its cookies and history when closed. It is also useful for signing into two accounts of the same service at once.

Note what private mode does not do: it does not make you anonymous online, and it does not hide activity from websites themselves. It keeps the local browser clean, nothing more.

## Related pages

- [What leaves this computer](../security/what-leaves-this-computer.md): how the Assistant stays out of your browser
- [Screen lock and privacy](../security/screen-lock-and-privacy.md)
- [Getting more help](getting-more-help.md)
