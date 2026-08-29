#!/usr/bin/python3
"""Make the bootc payload's network requirement honest about its transport.

Upstream pyanaconda hardcodes `network_required = True` for every bootc source.
SP+ ships its payload inside the ISO as `containers-storage:`, so nothing is
fetched over the network at install time. With the upstream value, the Network
spoke can never complete on a machine with no link, and "Begin Installation"
stays greyed out with no way forward.

Proven on a 14-year-old Dell with no ethernet and no Intel wifi firmware,
2026-08-29. It cannot reproduce in QEMU: a virtual NIC always has a link.

Refuses to modify anything unless the anchor matches exactly once.
"""
import sys

TARGET = ("/usr/lib64/python3.14/site-packages/pyanaconda/"
          "modules/payloads/source/bootc/bootc.py")

ANCHOR = '''    @property
    def network_required(self):
        """Does the source require a network?

        :return: True or False
        """
        return True
'''

REPLACEMENT = '''    @property
    def network_required(self):
        """Does the source require a network?

        SP+ patch: a payload already on the install media needs no network.
        Upstream returns True unconditionally, which strands the installer on
        any machine without a link. See patch-anaconda-network.py.

        :return: True or False
        """
        _LOCAL_TRANSPORTS = (
            "containers-storage:",
            "oci:",
            "oci-archive:",
            "dir:",
        )
        try:
            _source = str(self._configuration.sourceImgRef or "")
        except AttributeError:
            return True
        if _source.startswith(_LOCAL_TRANSPORTS):
            return False
        return True
'''


def main():
    try:
        src = open(TARGET).read()
    except OSError as exc:
        print("SPPLUS_NETWORK_PATCH FAILED: cannot read %s: %s" % (TARGET, exc))
        return 1

    hits = src.count(ANCHOR)
    if hits != 1:
        print("SPPLUS_NETWORK_PATCH FAILED: anchor matched %d times, expected 1. "
              "Anaconda changed upstream; re-derive the patch." % hits)
        return 1

    open(TARGET, "w").write(src.replace(ANCHOR, REPLACEMENT))

    back = open(TARGET).read()
    if "_LOCAL_TRANSPORTS" not in back or "containers-storage:" not in back:
        print("SPPLUS_NETWORK_PATCH FAILED: read-back did not contain the patch")
        return 1

    import py_compile
    try:
        py_compile.compile(TARGET, doraise=True)
    except py_compile.PyCompileError as exc:
        print("SPPLUS_NETWORK_PATCH FAILED: patched file does not compile: %s" % exc)
        return 1

    print("SPPLUS_NETWORK_PATCH OK bootc source is network-free for local transports")
    return 0


if __name__ == "__main__":
    sys.exit(main())
