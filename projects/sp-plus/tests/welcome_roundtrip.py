#!/usr/bin/env python3
"""Drive the SP+ theme round trip THROUGH the Welcome application, on the Dell.

The acceptance criterion is Breeze -> Windows -> Breeze -> Windows performed only
through the Welcome app. So every transition here is a real mouse press and release
dispatched into the running app: the app's own JavaScript runs, it sets its
window-title bridge, welcome.py picks that up and invokes the apply helper. Nothing
is called directly.

Each transition is verified from OUTSIDE the app as well, because the app reporting
success is not evidence that the desktop changed. After every switch this records the
live look-and-feel, the decoration KWin actually loaded, the panel applet sequence and
the containment counts, so a state leak between the first and second visit to a theme
is visible.
"""
import json
import subprocess
import sys
import time

sys.path.insert(0, "/home/test")
from cdp import connect  # noqa: E402

WINDOWS = "org.secureprospective.spplus.windows11.dark"
BREEZE = "org.kde.breezedark.desktop"

# Breeze -> Windows -> Breeze -> Windows. Starting from Breeze makes the first
# transition a real change rather than a no-op, and visiting each theme twice is what
# exposes leaked state that a single apply cannot.
SEQUENCE = [
    (BREEZE, "t0-breeze-start"),
    (WINDOWS, "t1-windows"),
    (BREEZE, "t2-breeze"),
    (WINDOWS, "t3-windows"),
]


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()


def session_env():
    """The apply helper and the probes must see the real session, not an SSH shell."""
    pid = sh("pgrep -x plasmashell | head -1")
    if not pid:
        raise RuntimeError("plasmashell is not running; cannot drive or verify a theme switch")
    env = {}
    with open("/proc/%s/environ" % pid, "rb") as handle:
        for entry in handle.read().split(b"\0"):
            if b"=" in entry:
                key, value = entry.decode(errors="replace").split("=", 1)
                if key.startswith(("XDG_", "QT_", "KDE_", "WAYLAND_", "DBUS_")) or key == "DISPLAY":
                    env[key] = value
    return env


def probe(env):
    prefix = " ".join("%s=%s" % (k, v) for k, v in env.items())

    def read(f, g, k):
        return sh("%s kreadconfig6 --file %s --group %s --key %s" % (prefix, f, g, k))

    dump = sh("%s qdbus-qt6 org.kde.plasmashell /PlasmaShell "
              "org.kde.PlasmaShell.dumpCurrentLayoutJS 2>/dev/null" % prefix)
    applets = [line.strip('"') for line in
               sh("echo %r | grep -oE '\"org\\.kde\\.plasma\\.[a-z]+\"'" % dump).splitlines()]
    support = sh("%s qdbus-qt6 org.kde.KWin /KWin org.kde.KWin.supportInformation "
                 "2>/dev/null | grep -A3 -i '^Decoration' | head -4" % prefix)
    deco = ""
    for line in support.splitlines():
        if "Theme:" in line or "Plugin:" in line:
            deco += line.strip() + " "
    return {
        "lookandfeel": read("kdeglobals", "KDE", "LookAndFeelPackage"),
        "icons": read("kdeglobals", "Icons", "Theme"),
        "widgetStyle": read("kdeglobals", "KDE", "widgetStyle"),
        "plasmaTheme": read("plasmarc", "Theme", "name"),
        "colorScheme": read("kdeglobals", "General", "ColorScheme"),
        "decorationLoaded": deco.strip(),
        "applets": applets,
        "containments": sh("~/spplus-theme-capture.sh probe-%d 2>/dev/null | "
                           "grep '^containments=' | cut -d= -f2-" % int(time.time())),
        "shellAlive": bool(sh("pgrep -x plasmashell")),
    }


def click_selector(ws, expr, what):
    """Click the element the expression returns, by its rendered box."""
    box = ws.evaluate(expr)
    if not box:
        raise RuntimeError("cannot find a visible %s to click" % what)
    point = json.loads(box)
    ws.click(point["x"], point["y"])


def goto_theme_step(ws):
    """Navigate to 'Choose the look' the way an advisor would, via the route rail.

    The theme cards exist in the DOM on every step but have a zero-sized box until their
    step is shown, so clicking them from the hero screen silently does nothing. Navigate
    first, then confirm the step is actually visible before touching any card.
    """
    if ws.evaluate("document.getElementById('look-title').getBoundingClientRect().width > 0"):
        return "already-on-look"
    click_selector(
        ws,
        "(function(){var b=Array.from(document.querySelectorAll('button'))"
        ".filter(function(e){return /choose the look/i.test(e.textContent)"
        "&&e.getBoundingClientRect().width>0;})[0];"
        "if(!b)return null;var r=b.getBoundingClientRect();"
        "return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()",
        "'Choose the look' route",
    )
    for _ in range(30):
        time.sleep(1)
        if ws.evaluate("document.getElementById('look-title').getBoundingClientRect().width > 0"):
            return "navigated"
    raise RuntimeError("the 'Choose the look' step never became visible")


def close_preview(ws):
    """Dismiss the preview modal so the next card click reaches the card.

    After an apply the modal stays open showing APPLIED. It is a full-screen overlay, so
    every later click lands on it rather than on a theme card -- which is how a run can
    report a transition while no apply ever happened.
    """
    if ws.evaluate("document.getElementById('theme-preview').hidden"):
        return
    # The app disables Close while an apply is in flight and re-enables it when the apply
    # reaches a terminal state. The look-and-feel value changes before the helper has
    # finished its layout stage, so arriving here mid-apply is normal -- wait for the app
    # to finish rather than treating a legitimately disabled button as a failure.
    for _ in range(240):
        if ws.evaluate("(function(){var e=document.getElementById('preview-close');"
                       "return !!e && !e.disabled && e.getBoundingClientRect().width>0;})()"):
            break
        time.sleep(1)
    else:
        state = ws.evaluate("document.getElementById('preview-apply').textContent.trim()")
        raise RuntimeError("preview Close never became enabled; apply button reads %r" % state)
    click_selector(
        ws,
        "(function(){var e=document.getElementById('preview-close');"
        "if(!e||e.disabled)return null;var r=e.getBoundingClientRect();"
        "if(r.width<=0)return null;"
        "return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()",
        "preview close button",
    )
    for _ in range(20):
        time.sleep(1)
        if ws.evaluate("document.getElementById('theme-preview').hidden"):
            return
    raise RuntimeError("the preview modal would not close")


def click_theme(ws, lnf):
    """Click the theme card, then its confirmation control if the app shows one."""
    close_preview(ws)
    box = ws.evaluate(
        "(function(){var e=document.querySelector('[data-lnf=\"%s\"]');"
        "if(!e)return null;var r=e.getBoundingClientRect();"
        "return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});})()" % lnf
    )
    if not box:
        raise RuntimeError("no theme card for %s" % lnf)
    point = json.loads(box)
    if point["x"] <= 0 and point["y"] <= 0:
        raise RuntimeError("theme card for %s has no rendered box -- wrong step is showing" % lnf)
    ws.click(point["x"], point["y"])
    time.sleep(4)

    # Newer builds show a preview with an explicit confirm before applying. Older ones
    # apply on the card click. Handle both rather than assuming which is present.
    # Visibility must be judged by the rendered box, not offsetParent: the preview is a
    # position:fixed modal, and offsetParent is always null for fixed elements, so an
    # offsetParent test reports the Apply button as hidden and the click never happens.
    confirm = ws.evaluate(
        "(function(){var e=document.getElementById('preview-apply');"
        "if(!e||e.disabled)return null;var r=e.getBoundingClientRect();"
        "if(r.width<=0||r.height<=0)return null;"
        "return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2,sel:'#preview-apply'});})()"
    )
    if confirm:
        point = json.loads(confirm)
        ws.click(point["x"], point["y"])
        return "card+confirm(%s)" % point["sel"]
    raise RuntimeError("the preview Apply button was not clickable for this theme")


def current_lnf(env):
    prefix = " ".join("%s=%s" % (k, v) for k, v in env.items())
    return sh("%s kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage" % prefix)


def wait_for(env, lnf, previous, timeout=240):
    """Poll for the switch to land, and require it to be a real change.

    Checking only that the value equals the target lets an already-applied theme report
    success while nothing happened. Every step of this sequence is a genuine change, so
    demand that the value moved away from what it was before the click.
    """
    started = time.time()
    while time.time() - started < timeout:
        current = current_lnf(env)
        if current == lnf and current != previous:
            return True, round(time.time() - started, 1)
        time.sleep(2)
    return False, timeout


def main():
    env = session_env()
    ws = connect()
    print("navigation: %s" % goto_theme_step(ws))
    results = []
    for lnf, label in SEQUENCE:
        started = time.time()
        before = current_lnf(env)
        how = click_theme(ws, lnf)
        landed, waited = wait_for(env, lnf, before)
        # Wait for the app to declare a terminal state, then let the desktop settle.
        app_state = ""
        for _ in range(240):
            app_state = ws.evaluate(
                "document.getElementById('preview-apply').dataset.state || ''") or ""
            if app_state in ("applied", "failed"):
                break
            time.sleep(1)
        time.sleep(6)
        state = probe(env)
        results.append({
            "label": label, "requested": lnf, "clicked": how,
            "landed": landed, "appState": app_state,
            "seconds": round(time.time() - started, 1),
            "state": state,
        })
        print("%-18s %-8s app=%-8s %s -> %s  (%ss, %s)" % (
            label, "OK" if landed else "FAILED", app_state or "?", before,
            state["lookandfeel"], waited, how))
        if not state["shellAlive"]:
            print("  !! plasmashell is NOT running after this transition")

    with open("/home/test/roundtrip-results.json", "w") as handle:
        json.dump(results, handle, indent=2)

    print("\n=== round-trip comparison ===")
    ok = True
    for a, b in ((1, 3),):
        first, second = results[a]["state"], results[b]["state"]
        drift = {k: (first[k], second[k]) for k in first
                 if k != "containments" and first[k] != second[k]}
        if drift:
            ok = False
            print("DRIFT between %s and %s:" % (results[a]["label"], results[b]["label"]))
            for key, (x, y) in drift.items():
                print("  %s: %r -> %r" % (key, x, y))
        else:
            print("%s and %s are IDENTICAL" % (results[a]["label"], results[b]["label"]))
    every_landed = all(r["landed"] for r in results)
    shell_ok = all(r["state"]["shellAlive"] for r in results)
    print("\nall transitions landed: %s" % every_landed)
    print("shell survived every transition: %s" % shell_ok)
    print("VERDICT: %s" % ("PASS" if (every_landed and shell_ok and ok) else "FAIL"))
    return 0 if (every_landed and shell_ok and ok) else 1


if __name__ == "__main__":
    sys.exit(main())
