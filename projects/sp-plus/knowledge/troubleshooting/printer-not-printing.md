# Printer Not Printing

Work through these in order. Stop when it prints.

## First: the two-minute checks

1. **Is the printer on and awake?** Many printers sleep deeply and ignore everything for a minute after waking. Press a button on the printer itself, wait about ten seconds, then try printing again.
2. **Is the online? light or display showing an error?** Paper jams, open lids, and empty ink all make a printer refuse work silently from the computer's point of view. Clear the printer's own complaint first.
3. **Restart the printer.** Power it off, count to ten, power it on. Wait until it says ready. Try again.

Still nothing? Continue below.

## Check what the computer thinks

1. Open your system settings and go to **Printers**.
   - KDE edition: System Settings, then Printers.
   - Mac-style edition: Activities search, type "printers".
2. Your printer should be listed with a state next to it. Look for these:

**"Paused"**: click or right-click the printer and choose resume/start. Printers pause themselves after repeated failures and then refuse everything, including successful retries.

**"Stuck job" in the queue**: open the print queue, cancel every waiting job (old jobs block new ones), then print one small test page. Do not re-print a 40-page proposal to test; print one page.

**"Not listed at all"**: skip to adding it, below.

## Add the printer

Modern printers connect without driver discs. If your printer was made in roughly the last decade and supports AirPrint or Mopria (most network printers do), this works:

1. In the Printers settings, choose **Add a printer**.
2. Wait a few seconds for discovery. Select your printer from the list. Careful: some printers appear more than once under slightly different names, and fax entries show up too. Pick the plain printer name, not "fax".
3. Confirm, then print a test page from that same window.

If discovery finds nothing: make sure the printer is connected to the same network as the computer (check the printer's own network settings screen for its Wi-Fi name), restart the printer once more, and try discovery again.

## Add it by address (when discovery keeps failing)

Every network printer has an IP address, shown on the printer's own display or its network report (usually a menu option like "network settings" or "print network configuration").

1. Choose **Add a printer**, then the option to enter an address instead of discovering.
2. Type the printer's IP address exactly.
3. Accept the suggested connection type and finish.
4. Print a test page.

## When to hand it to the Assistant

If you get here without success, ask the Assistant and mention what you tried ("paused queue cleared, added by IP, still nothing"). It can inspect the print service directly, and its diagnosis will be sharper because you skipped the basics already.

## Honest limits

Very old printers (pre-2010, especially USB-only models without network features) and some cheap multifunction devices may never cooperate fully. That is a hardware reality, not something this guide can fix. Support can tell you quickly whether a device is worth fighting for.

## Related pages

- [Getting more help](../advisor-help/getting-more-help.md)
- [Wi-Fi won't connect](wifi-wont-connect.md): printing fails if the printer and computer are on different networks
