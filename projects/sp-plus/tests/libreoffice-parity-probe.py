#!/usr/bin/python3
"""Ask a running LibreOffice what it actually resolved, key by key.

This is deliberately not an XML check. The .xcd being well formed proves
only that it parses; it says nothing about whether a key node name is one
LibreOffice recognises, whether a .uno: command exists, or whether the
shared layer won over the built-in defaults. Those are the ways this can
silently do nothing, so every assertion here is a read-back through the
same API the Customize dialog uses.
"""
import sys
import uno
from com.sun.star.awt import KeyEvent

MOD = {"SHIFT": 1, "MOD1": 2, "MOD2": 4, "MOD3": 8}
WRITER = "com.sun.star.text.TextDocument"
CALC = "com.sun.star.sheet.SpreadsheetDocument"
IMPRESS = "com.sun.star.presentation.PresentationDocument"

# (module, key spec as written in the .xcd, expected command)
KEYS = [
    (WRITER, "V_SHIFT_MOD1", ".uno:PasteUnformatted"),
    (WRITER, "V_MOD1_MOD2", ".uno:PasteSpecial"),
    (WRITER, "C_MOD1_MOD2", ".uno:FormatPaintbrush"),
    (WRITER, "M_MOD1_MOD2", ".uno:InsertAnnotation"),
    (WRITER, "E_SHIFT_MOD1", ".uno:TrackChanges"),
    (WRITER, "1_MOD1", ".uno:SpacePara1"),
    (WRITER, "2_MOD1", ".uno:SpacePara2"),
    (WRITER, "5_MOD1", ".uno:SpacePara15"),
    (WRITER, "1_MOD1_MOD2",
     ".uno:StyleApply?Style:string=Heading 1&FamilyName:string=ParagraphStyles"),
    (WRITER, "2_MOD1_MOD2",
     ".uno:StyleApply?Style:string=Heading 2&FamilyName:string=ParagraphStyles"),
    (WRITER, "3_MOD1_MOD2",
     ".uno:StyleApply?Style:string=Heading 3&FamilyName:string=ParagraphStyles"),
    (WRITER, "D_MOD1", ".uno:FontDialog"),
    (WRITER, "D_SHIFT_MOD1", ".uno:UnderlineDouble"),
    (WRITER, "L_SHIFT_MOD1", ".uno:DefaultBullet"),
    (WRITER, "M_MOD1", ".uno:IncrementIndent"),
    (WRITER, "M_SHIFT_MOD1", ".uno:DecrementIndent"),
    (WRITER, "8_SHIFT_MOD1", ".uno:ControlCodes"),
    (WRITER, "SPACE_MOD1", ".uno:ResetAttributes"),
    (WRITER, "F2_MOD1", ".uno:PrintPreview"),
    (WRITER, "F12_MOD1", ".uno:Print"),
    (WRITER, "F12", ".uno:SaveAs"),
    (CALC, "R_MOD1", ".uno:FillRight"),
    (CALC, "V_MOD1_MOD2", ".uno:PasteSpecial"),
    (CALC, "F12", ".uno:SaveAs"),
    (IMPRESS, "V_MOD1_MOD2", ".uno:PasteSpecial"),
    (IMPRESS, "F12", ".uno:SaveAs"),
]

# Ctrl+Q must still quit. Parity stops short of stranding the advisor.
# It lives in the GLOBAL accelerator set, not a module one, so it is
# checked separately below.
UNTOUCHED_GLOBAL = [("Q_MOD1", ".uno:Quit")]

# (config node path, property, expected value)
SETTINGS = [
    ("/org.openoffice.Office.Common/Misc", "SymbolStyle", "colibre"),
    ("/org.openoffice.Office.Common/Misc", "ShowDonation", False),
    ("/org.openoffice.Office.Common/Misc", "CrashReport", False),
    ("/org.openoffice.Office.Common/Appearance", "ApplicationAppearance", 1),
    ("/org.openoffice.Office.Common/Save/Document", "WarnAlienFormat", False),
    ("/org.openoffice.Office.Common/Save/Document", "CreateBackup", True),
    ("/org.openoffice.Office.Common/Font/Substitution", "Replacement", True),
    ("/org.openoffice.Office.Common/Security/Scripting", "MacroSecurityLevel", 3),
    ("/org.openoffice.Office.Writer/DefaultFont", "Standard", "Carlito"),
    ("/org.openoffice.Office.Writer/DefaultFont", "StandardHeight", 220),
    ("/org.openoffice.Office.Writer/Layout/Other", "MeasureUnit", 8),
    ("/org.openoffice.Office.Calc/Formula/Syntax", "Grammar", 1),
    ("/org.openoffice.Office.Calc/Formula/Syntax", "EnglishFunctionName", True),
    ("/org.openoffice.Office.Calc/Formula/Syntax", "StringRefAddressSyntax", 1),
    ("/org.openoffice.Office.Calc/Filter/Import/VBA", "Executable", False),
    ("/org.openoffice.Office.Recovery/AutoSave", "TimeIntervall", 5),
    ("/org.openoffice.Office.Update/Update", "Enabled", False),
    # ToolbarMode is its own component (package org.openoffice.Office.UI),
    # not a group inside Office.UI, so its node path is dotted. Writing it
    # the obvious way silently addresses nothing.
    ("/org.openoffice.Office.UI.ToolbarMode", "ActiveWriter", "notebookbar.ui"),
    ("/org.openoffice.Office.UI.ToolbarMode", "ActiveCalc", "notebookbar.ui"),
    ("/org.openoffice.Office.UI.ToolbarMode", "ActiveImpress", "notebookbar.ui"),
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Writer",
     "Active", "Tabbed"),
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Calc",
     "Active", "Tabbed"),
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Impress",
     "Active", "Tabbed"),
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Draw",
     "Active", "Tabbed"),
    # Draw is the one module whose stock Tabbed mode keeps a menu bar.
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Writer/Modes/Tabbed",
     "HasMenubar", False),
    ("/org.openoffice.Office.UI.ToolbarMode/Applications/Draw/Modes/Tabbed",
     "HasMenubar", False),
    ("/org.openoffice.Office.Compatibility/View", "MSCompatibleFormsMenu", True),
]

# A financial model must not silently change its answers for the sake of
# looking like Excel. This asserts the setting we chose NOT to ship.
REFUSED = [("/org.openoffice.Office.Calc/Formula/Syntax", "EmptyStringAsZero", False)]

FACTORIES = [
    ("com.sun.star.text.TextDocument", "Office Open XML Text"),
    ("com.sun.star.sheet.SpreadsheetDocument", "Calc Office Open XML"),
    ("com.sun.star.presentation.PresentationDocument", "Impress Office Open XML"),
]


def parse_key(spec):
    parts = spec.split("_")
    name, mods = parts[0], parts[1:]
    if name.isdigit():
        name = "NUM" + name
    code = uno.getConstantByName("com.sun.star.awt.Key." + name)
    bits = 0
    for m in mods:
        bits |= MOD[m]
    return code, bits


def connect(port):
    ctx = uno.getComponentContext()
    resolver = ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", ctx)
    return resolver.resolve(
        "uno:socket,host=127.0.0.1,port=%d;urp;StarOffice.ComponentContext" % port)


def accel_cfg(ctx, module):
    from com.sun.star.beans import PropertyValue
    pv = PropertyValue()
    pv.Name = "ModuleIdentifier"
    pv.Value = module
    return ctx.ServiceManager.createInstanceWithArgumentsAndContext(
        "com.sun.star.ui.ModuleAcceleratorConfiguration", (pv,), ctx)


def reader(ctx, path):
    from com.sun.star.beans import PropertyValue
    prov = ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.configuration.ConfigurationProvider", ctx)
    pv = PropertyValue()
    pv.Name = "nodepath"
    pv.Value = path
    return prov.createInstanceWithArguments(
        "com.sun.star.configuration.ConfigurationAccess", (pv,))


def main():
    port = int(sys.argv[1])
    ctx = connect(port)
    fails = []
    checked = 0

    cfgs = {m: accel_cfg(ctx, m) for m in (WRITER, CALC, IMPRESS)}
    for module, spec, want in KEYS:
        checked += 1
        code, mods = parse_key(spec)
        ev = KeyEvent()
        ev.KeyCode, ev.Modifiers = code, mods
        try:
            got = cfgs[module].getCommandByKeyEvent(ev)
        except Exception as exc:
            got = "<unbound: %s>" % type(exc).__name__
        tag = module.rsplit(".", 1)[-1]
        if got != want:
            fails.append("KEY  %-9s %-14s want %s got %s" % (tag, spec, want, got))
        else:
            print("  ok  KEY  %-9s %-14s %s" % (tag, spec, want))

    glob_cfg = ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.ui.GlobalAcceleratorConfiguration", ctx)
    for spec, want in UNTOUCHED_GLOBAL:
        checked += 1
        code, mods = parse_key(spec)
        ev = KeyEvent()
        ev.KeyCode, ev.Modifiers = code, mods
        try:
            got = glob_cfg.getCommandByKeyEvent(ev)
        except Exception as exc:
            got = "<unbound: %s>" % type(exc).__name__
        if got != want:
            fails.append("KEY  global    %-14s want %s got %s" % (spec, want, got))
        else:
            print("  ok  KEY  global    %-14s %s (deliberately not taken)"
                  % (spec, want))

    for path, prop, want in SETTINGS + REFUSED:
        checked += 1
        try:
            got = reader(ctx, path).getPropertyValue(prop)
        except Exception as exc:
            got = "<error: %s>" % exc
        if got != want:
            fails.append("CFG  %s/%s want %r got %r" % (path, prop, want, got))
        else:
            print("  ok  CFG  %s/%s = %r" % (path, prop, got))

    facs = reader(ctx, "/org.openoffice.Setup/Office/Factories")
    for name, want in FACTORIES:
        checked += 1
        got = facs.getByName(name).getPropertyValue("ooSetupFactoryDefaultFilter")
        if got != want:
            fails.append("SAVE %s want %s got %s" % (name, want, got))
        else:
            print("  ok  SAVE %-45s %s" % (name.rsplit(".", 1)[-1], got))

    print()
    if fails:
        print("FAIL: %d of %d checks" % (len(fails), checked))
        for f in fails:
            print("  " + f)
        return 1
    print("LIBREOFFICE_PARITY_OK %d checks passed" % checked)
    return 0


if __name__ == "__main__":
    sys.exit(main())
