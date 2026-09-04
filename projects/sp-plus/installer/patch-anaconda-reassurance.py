#!/usr/bin/env python3
"""Fill the empty space on the install progress screen with an explanation.

THE PROBLEM THIS SOLVES:

The progress screen has a notebook with two pages. Page 2 is the "installed
successfully, go ahead and reboot" message. Page 1, shown for the entire
install, is literally:

    <object class="GtkBox" id="emptyBox">
      <child><placeholder/></child>
    </object>

So during the longest and most anxious part of the process, the screen offers
the advisor nothing. Two questions go unanswered, and both of them read as
"something has gone wrong" when they are not answered:

  1. Is this thing actually encrypted, or is that a step I have to do later?
  2. Why is the bar barely moving? Has it hung?

The second one matters most on the hardware advisors actually have. The bar is
honest (see patch-anaconda-progress.py, which made it track the real deploy),
but honest and slow looks identical to stuck if nobody says otherwise.

WHAT THE COPY MAY CLAIM, AND WHY:

Only what the kickstart actually guarantees. interactive-defaults.ks runs
`autopart --type=lvm --fstype=xfs --encrypted --luks-version=luks2` with no
--passphrase, so Anaconda prompts the operator, the passphrase exists nowhere
in the image or the repo, and root plus /var/home are inside LUKS2. /boot and
the ESP are not encrypted, which is why the text says "your files" and not
"the whole disk". DO-NOT.md records an install that silently produced NO
encryption; a reassurance on screen that is not true of the machine in front of
the advisor is worse than an empty box, so the gate in the Containerfile checks
the kickstart still encrypts before this text is allowed to ship.

Same discipline as the sibling patcher: exactly one match or the build fails.
"""
from pathlib import Path

GLADE = Path("/usr/share/anaconda/ui/spokes/installation_progress.glade")

ANCHOR = """                      <object class="GtkBox" id="emptyBox">
                        <property name="visible">True</property>
                        <property name="can_focus">False</property>
                        <child>
                          <placeholder/>
                        </child>
                      </object>"""

MESSAGE = (
    "Your files are being encrypted as SP+ installs.\n"
    "This is not a setting you switch on later. Every SP+ machine is encrypted "
    "from the moment it is built, with the passphrase you chose a few screens "
    "ago. Keep that passphrase somewhere safe. It is the only way into this "
    "computer.\n"
    "\n"
    "This is the long part of the install. The bar moves at the speed of your "
    "own processor and disk, so on some computers it will crawl, and it may sit "
    "in one place for a while. That is normal. Nothing has failed and nothing "
    "is stuck."
)

REPLACEMENT = """                      <object class="GtkBox" id="emptyBox">
                        <property name="visible">True</property>
                        <property name="can_focus">False</property>
                        <child>
                          <object class="GtkLabel" id="spplusReassuranceLabel">
                            <property name="visible">True</property>
                            <property name="can_focus">False</property>
                            <property name="halign">start</property>
                            <property name="valign">end</property>
                            <property name="xalign">0</property>
                            <property name="justify">left</property>
                            <property name="wrap">True</property>
                            <property name="max_width_chars">78</property>
                            <property name="margin_top">18</property>
                            <property name="margin_bottom">6</property>
                            <property name="label">%s</property>
                          </object>
                        </child>
                      </object>""" % MESSAGE


def main():
    text = GLADE.read_text()
    found = text.count(ANCHOR)
    if found != 1:
        raise SystemExit(
            "patch-anaconda-reassurance: expected exactly 1 emptyBox match, found %d.\\n"
            "  The progress glade changed shape; re-read it before assuming this\\n"
            "  patch is still correct." % found
        )
    GLADE.write_text(text.replace(ANCHOR, REPLACEMENT))
    print("SPPLUS_REASSURANCE_PATCHED progress screen explains encryption and pace")


if __name__ == "__main__":
    main()
