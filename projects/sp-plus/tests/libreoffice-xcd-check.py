#!/usr/bin/python3
"""Static validation of the SP+ LibreOffice configuration layer.

Runs at image build time, where no LibreOffice can be started. It proves
the packaging is right; tests/libreoffice-parity-gate.sh proves the
settings actually take effect.

Every negative assertion strips XML comments first. The prose in these
files explains why oor:finalized is not used and names the three commands
that do not exist in the shipping build, so a naive grep for those strings
matches the explanation and fails a correct file.
"""
import re
import sys
import xml.etree.ElementTree as ET

OOR = "{http://openoffice.org/2001/registry}"
WRITER = "com.sun.star.text.TextDocument"

# Names that look plausible and are wrong in LibreOffice 26.2. Each was
# carried in from research and caught by read-back against the real build.
BOGUS = [".uno:SpacePara1_5", ".uno:IncreaseIndent", ".uno:DecreaseIndent"]


def strip_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def main(parity_path, keys_path, kgs_path):
    fails = []

    def check(cond, msg):
        if not cond:
            fails.append(msg)

    parity_raw = open(parity_path, encoding="utf-8").read()
    keys_raw = open(keys_path, encoding="utf-8").read()
    parity = strip_comments(parity_raw)
    keys = strip_comments(keys_raw)

    for path in (parity_path, keys_path):
        try:
            ET.parse(path)
        except ET.ParseError as exc:
            fails.append("%s is not well formed XML: %s" % (path, exc))
    if fails:
        return report(fails)

    # --- the layer is a shared default, not policy and not a cage ---
    for name, blob in (("parity", parity), ("keys", keys)):
        check("oor:finalized" not in blob,
              "%s: oor:finalized would stop the advisor changing this" % name)
        check("oor:mandatory" not in blob,
              "%s: oor:mandatory is not the mechanism for a default" % name)

    # --- load order: writer.xcd sorts after any spplus- file and will
    #     reimpose writer8 on the default save filter without these ---
    for dep in ("main", "writer", "calc", "impress", "draw"):
        check('<dependency file="%s"/>' % dep in parity,
              "parity: missing <dependency file=\"%s\"/>; load order is "
              "filename order and writer.xcd would win" % dep)

    # --- ToolbarMode is its own component, not a node under Office.UI ---
    check('oor:name="ToolbarMode"' in parity and
          'oor:package="org.openoffice.Office.UI"' in parity,
          "parity: ToolbarMode must be its own component with package "
          "org.openoffice.Office.UI, or the ribbon setting addresses nothing")

    # --- default save formats ---
    for filt in ("Office Open XML Text", "Calc Office Open XML",
                 "Impress Office Open XML"):
        check(filt in parity, "parity: missing save filter %r" % filt)
    check("writer_OOXML" not in parity,
          "parity: writer_OOXML is a type name; the factory wants a filter name")
    check("notebookbar.ui" in parity, "parity: ribbon mode not set")
    check("<value>colibre</value>" in parity, "parity: Colibre icons not set")

    # --- a financial model must not silently change its answers ---
    check("EmptyStringAsZero" not in parity,
          "parity: EmptyStringAsZero changes the result of a financial "
          "model and is deliberately not shipped")

    # --- module nodes must fuse, never replace ---
    root = ET.parse(keys_path).getroot()
    modules = 0
    for node in root.iter("node"):
        name = node.get(OOR + "name")
        if name and name.startswith("com.sun.star."):
            modules += 1
            check(node.get(OOR + "op") == "fuse",
                  "keys: module %s uses oor:op=%r; replace discards every "
                  "other binding LibreOffice defines for that module"
                  % (name, node.get(OOR + "op")))
    check(modules == 3, "keys: expected 3 module nodes, found %d" % modules)

    # --- every bound command must be a real one ---
    for bogus in BOGUS:
        check(bogus not in keys, "keys: %s does not exist in 26.2" % bogus)

    cmds = re.findall(r"<value[^>]*>(\.uno:[^<]*)</value>", keys)
    check(len(cmds) >= 26,
          "keys: only %d bindings; expected at least 26" % len(cmds))
    for c in cmds:
        check(c.startswith(".uno:"), "keys: %r is not a .uno: command" % c)

    # --- Ctrl+Q stays on Quit: never strand the advisor ---
    check("Q_MOD1" not in keys,
          "keys: Ctrl+Q must keep quitting the application")

    # --- Plasma must not be holding Office's function keys ---
    kgs = open(kgs_path, encoding="utf-8").read()
    check("[kwin]" in kgs, "kglobalshortcutsrc: no [kwin] section")
    for line in kgs.splitlines():
        if re.match(r"^(Expose|Switch to Desktop|show dashboard)", line):
            current = line.split("=", 1)[1].split(",")[0]
            check("Ctrl+F" not in current,
                  "kglobalshortcutsrc: Plasma still holds an Office key: %s"
                  % line.strip())

    return report(fails)


def report(fails):
    if fails:
        print("LIBREOFFICE_XCD_CHECK FAILED (%d)" % len(fails))
        for f in fails:
            print("  - " + f)
        return 1
    print("LIBREOFFICE_XCD_CHECK_OK")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("usage: %s <parity.xcd> <keys.xcd> <kglobalshortcutsrc>"
              % sys.argv[0], file=sys.stderr)
        sys.exit(2)
    sys.exit(main(*sys.argv[1:]))
