#!/usr/bin/env bash
# Regenerate LICENSES.md from the BUILT IMAGE.
#
# LICENSING.md commits SP+ to publishing an inventory produced "from the image
# itself rather than from a list someone maintained by hand". Until 2026-09-04
# that was true but unrepeatable: the file was generated ad hoc and there was no
# script, so when the 2026-09-04 trim removed 177 packages (virt-manager,
# libreoffice-base, firebird and the rest) the committed inventory silently
# became a list of software the ISO does not ship. For a licence document that
# is the one failure that matters -- it is the artifact a lawyer reads.
#
# Run it after any build that changes package content, and commit the result.
#
#   scripts/generate-licenses.sh [image-tag]
#
# The image is the evidence: nothing here reads the Containerfile or a package
# list, only `rpm -qa` inside the image that was actually built.
set -euo pipefail
IMAGE="${1:-localhost/sp-plus-kde:spike}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/LICENSES.md"
PODMAN="${SPPLUS_PODMAN:-sudo -n podman}"

# One container run for both facts, so the stamp and the package list can never
# come from different images.
raw=$($PODMAN run --rm --entrypoint /bin/sh "$IMAGE" -c \
  '. /usr/lib/os-release; echo "BUILD_ID=$BUILD_ID"; \
   rpm -qa --qf "%{NAME}|%{VERSION}-%{RELEASE}|%{LICENSE}\n"')

build_id=$(printf '%s\n' "$raw" | sed -n 's/^BUILD_ID=//p' | head -1)
[ -n "$build_id" ] || { echo "generate-licenses: no BUILD_ID in $IMAGE" >&2; exit 1; }

pkgs=$(printf '%s\n' "$raw" | grep -v '^BUILD_ID=' | grep '|')
count=$(printf '%s\n' "$pkgs" | wc -l)
# gpg-pubkey entries are repository signing keys that rpm models as packages.
# They carry the pseudo-license "pubkey" and are not software SP+ redistributes,
# so the headline number a reader should quote excludes them.
keys=$(printf '%s\n' "$pkgs" | grep -c '^gpg-pubkey|' || true)
software=$(( count - keys ))
[ "$count" -gt 500 ] \
  || { echo "generate-licenses: only $count packages; that is not a full image" >&2; exit 1; }

{
  echo "# SP+ package license inventory"
  echo
  echo "Generated from the built image \`$IMAGE\` (BUILD_ID $build_id)"
  echo "on $(date +%Y-%m-%d), by \`rpm -qa\` against the image itself -- not from a"
  echo "hand-maintained list. Regenerate it whenever the image changes, with"
  echo "\`scripts/generate-licenses.sh\`."
  echo
  echo "Flatpak applications (Joplin, Zoom, Thunderbird, and GNOME Boxes if the"
  echo "advisor adds it) are NOT in this table. They are preinstall or optional"
  echo "references fetched from Flathub on the advisor's machine, not binaries SP+"
  echo "redistributes, and they carry their own licenses from Flathub."
  echo
  echo "Total \`rpm -qa\` entries: $count, of which $keys are \`gpg-pubkey\`"
  echo "repository signing keys rather than redistributed software, leaving"
  echo "**$software software packages**."
  echo
  echo "## Summary"
  echo
  echo "| License | Packages |"
  echo "|---|---|"
  printf '%s\n' "$pkgs" | awk -F'|' '{print $3}' | sort | uniq -c | sort -rn \
    | sed 's/^ *\([0-9]*\) \(.*\)$/| \2 | \1 |/'
  echo
  echo "## Every package"
  echo
  echo "| Package | Version | License |"
  echo "|---|---|---|"
  printf '%s\n' "$pkgs" | sort -t'|' -k1,1 \
    | awk -F'|' '{print "| " $1 " | " $2 " | " $3 " |"}'
} > "$OUT"

echo "LICENSES_OK $OUT  packages=$count  BUILD_ID=$build_id"
