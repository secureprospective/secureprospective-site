# shellcheck shell=bash
# Shared runner for every gate that drives the Welcome page in QtWebEngine.
#
# WHY THIS FILE EXISTS: on 2026-09-04 five of these gates were found failing on
# a clean tree, all for the same three plumbing reasons and none for a reason
# about SP+. Each had its own copy of the launch, so each had its own copy of
# the rot. There is now one copy.
#
#   1. They looked for the app under $HOME/sp-plus-welcome-src, a staging
#      directory from a workflow that no longer exists on either machine.
#      The source of truth is the repo.
#   2. QtWebEngine is not installed outside the SP+ image, so PySide6 would not
#      import at all. When this host cannot run it, it runs inside the image --
#      which is the more faithful place to run it regardless.
#   3. Inside the image podman runs as root, and Chromium's zygote refuses to
#      start as root. --no-sandbox is safe here: the container has no network.
#
# And the reason none of that was visible: every one of them sent the probe's
# stderr to /dev/null. Errors are captured here and printed on failure.
#
# Usage:
#     . "$HERE/lib/webengine.sh"
#     we_init                      # sets WE_APP, WE_SRC, WE_WORK, WE_MODE
#     WE_ENV=( "FOO=bar" )         # optional, passed to the probe either way
#     out=$(we_run 150 "$PROBE" "$WE_APP" arg2) || we_err
#
# Paths handed to a probe must be built from WE_APP / WE_SRC_CTX / WE_WORK_CTX,
# never from WE_SRC directly: in image mode the probe sees them at /welcome and
# /work, not at their host paths.

we_init() {
  local here spplus
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # .../tests
  spplus="$(dirname "$here")"                               # .../sp-plus
  WE_SRC="${SPPLUS_WELCOME_SRC:-$spplus/welcome}"
  if [ ! -f "$WE_SRC/app/index.html" ]; then
    echo "  FAIL welcome source missing: $WE_SRC/app/index.html"
    return 2
  fi
  WE_WORK="$(mktemp -d)"
  WE_ENV=()
  if python3 -c 'import PySide6.QtWebEngineWidgets' >/dev/null 2>&1; then
    WE_MODE=host
    WE_SRC_CTX="$WE_SRC"
    WE_WORK_CTX="$WE_WORK"
  else
    if ! command -v podman >/dev/null 2>&1; then
      echo "  SKIP no PySide6 and no podman; the page was NOT driven"
      return 3
    fi
    WE_IMAGE="${SPPLUS_IMAGE:-$(sudo -n podman images --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' 2>/dev/null \
              | grep '^localhost/sp-plus-kde:' | sort -k2 -r | head -1 | awk '{print $1}')}"
    if [ -z "$WE_IMAGE" ]; then
      echo "  SKIP no PySide6 here and no localhost/sp-plus-kde image; the page was NOT driven"
      return 3
    fi
    WE_MODE=image
    WE_SRC_CTX=/welcome
    WE_WORK_CTX=/work
  fi
  WE_APP="$WE_SRC_CTX/app/index.html"
  return 0
}

we_where() {
  if [ "$WE_MODE" = image ]; then echo "  driving the page inside $WE_IMAGE"
  else echo "  driving the page on this host"; fi
}

# we_run <timeout-seconds> <probe.py on the host> [args for the probe...]
# Probe stdout goes to our stdout; stderr is kept for we_err.
we_run() {
  local secs="$1" probe="$2"; shift 2
  local base; base="$(basename "$probe")"
  [ "$probe" -ef "$WE_WORK/$base" ] || cp "$probe" "$WE_WORK/$base"
  : > "$WE_WORK/last.err"
  if [ "$WE_MODE" = host ]; then
    env QT_QPA_PLATFORM=offscreen "${WE_ENV[@]}" \
        timeout "$secs" python3 "$WE_WORK/$base" "$@" 2>"$WE_WORK/last.err"
  else
    local envargs=() e
    for e in "${WE_ENV[@]}"; do envargs+=( -e "$e" ); done
    # The timeout is applied on this side of podman on purpose. Passing
    # "timeout" as the container command exits 125 with no output at all: it is
    # /usr/sbin/timeout, which is not on the PATH podman starts the process with.
    timeout $(( secs + 20 )) sudo -n podman run --rm --network=none \
        -v "$WE_SRC:/welcome:ro,z" -v "$WE_WORK:/work:z" \
        -e QT_QPA_PLATFORM=offscreen -e QTWEBENGINE_CHROMIUM_FLAGS=--no-sandbox \
        "${envargs[@]}" "$WE_IMAGE" \
        python3 "/work/$base" "$@" 2>"$WE_WORK/last.err"
  fi
}

# Print whatever the probe said on stderr. Call this on any failure -- a probe
# that dies quietly is the failure mode this whole file exists to end.
we_err() {
  echo "  the probe's own error output:"
  if [ -s "$WE_WORK/last.err" ]; then sed -n '1,40p' "$WE_WORK/last.err" | sed 's/^/    /'
  else echo "    (nothing on stderr)"; fi
}

we_cleanup() { [ -n "${WE_WORK:-}" ] && rm -rf "$WE_WORK"; }
