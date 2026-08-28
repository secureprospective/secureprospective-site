#!/usr/bin/env python3
"""Assert the SP+ installer branding is what Anaconda will actually render.

Run at image build time. This walks the same configuration path as
/usr/sbin/anaconda so the values checked here are the values the UI uses.
"""
import sys

from pyanaconda.core import util
from pyanaconda.core.configuration.anaconda import conf
from pyanaconda.core.product import (
    get_product_is_final_release,
    get_product_name,
    get_product_version,
)

EXPECTED_CSS = "/usr/share/sp-plus/branding/installer/anaconda-gtk.css"

# Replicate the startup order in /usr/sbin/anaconda.
conf.set_from_defaults()

os_id = util.get_os_release_value("ID")
variant_id = util.get_os_release_value("VARIANT_ID")
try:
    conf.set_from_detected_profile(os_id, variant_id)
except Exception as exc:  # a missing profile must not mask the branding check
    print("NOTE: no profile matched ID=%s VARIANT_ID=%s (%s)" % (os_id, variant_id, exc))

conf.set_from_files()

name = get_product_name()
version = get_product_version()
final = get_product_is_final_release()
css = conf.ui.custom_stylesheet

failures = []
if name != "SP+":
    failures.append("product name is %r; the installer would call itself ANACONDA" % name)
if version != "1.0":
    failures.append("product version is %r; expected '1.0'" % version)
if final is not True:
    failures.append("IsFinal is %r; the installer would show the red PRE-RELEASE banner" % final)
if css != EXPECTED_CSS:
    failures.append("custom_stylesheet is %r; SP+ styling would never load" % css)

if failures:
    for f in failures:
        print("DN19 BRANDING FAILED: %s" % f, file=sys.stderr)
    sys.exit(1)

# Parse the stylesheet with the real GTK parser. No display is required to
# build a CssProvider, so a syntax error is caught here rather than on screen.
import gi

gi.require_version("Gtk", "3.0")
from gi.repository import Gtk  # noqa: E402

provider = Gtk.CssProvider()
provider.load_from_path(css)

print(
    "DN19_BRANDING_OK product=%s version=%s final=%s profile_os_id=%s stylesheet parsed"
    % (name, version, final, os_id)
)
