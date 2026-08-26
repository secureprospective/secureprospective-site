#!/bin/bash
if [[ "${1-}" == "install" && "${2-}" == "to-filesystem" ]]; then
    target="${@: -1}"
    echo "Advisor bootc diagnostic target: $target"
    echo "Advisor bootc TMPDIR: ${TMPDIR-}"
    findmnt -R "$target" 2>/dev/null | sed 's/^/Advisor bootc mount: /' || true
    ls -ld "$target" "$target/var" "$target/var/tmp" 2>&1 | sed 's/^/Advisor bootc path: /' || true
    df -h "$target" "$target/var" 2>&1 | sed 's/^/Advisor bootc df: /' || true
    if [[ -d "$target" ]]; then
        # The bootc image importer writes its large temporary archive to
        # /var/tmp, which is a RAM-backed installer filesystem. Use the
        # target's large /boot filesystem for this POC install process only.
        if mount --bind "$target/boot" /var/tmp; then
            echo "Advisor bootc scratch: bound $target/boot to /var/tmp"
            scratch_bound=1
            trap 'mountpoint -q /var/tmp && umount /var/tmp || true' EXIT
        else
            echo "Advisor bootc scratch: failed to bind $target/boot to /var/tmp" >&2
        fi
        find "$target" -mindepth 1 -maxdepth 3 -xdev -type d -printf 'Advisor bootc tree: %p\n' 2>/dev/null | sort
        if [[ -d "$target/boot" ]]; then
            find "$target/boot" -mindepth 1 -maxdepth 5 -type d -printf 'Advisor bootc boot tree: %p\n' 2>/dev/null | sort
        fi
    fi
fi
if [[ "${scratch_bound-}" == 1 ]]; then
    set -o pipefail
    bootc_cmd=(/usr/bin/bootc-real "$1" "$2" --skip-finalize "${@:3}")
    echo "Advisor bootc diagnostic: using supported --skip-finalize; Anaconda owns final target cleanup"
    TMPDIR=/var/tmp "${bootc_cmd[@]}" 2>&1 | while IFS= read -r line; do
        printf '%s\n' "$line"
        if [[ "$line" == *"Deploying container image...done"* ]]; then
            mountpoint -q /var/tmp && umount /var/tmp || true
            scratch_bound=0
            echo "Advisor bootc scratch: unbound /var/tmp after image import"
        fi
    done
    exit "${PIPESTATUS[0]}"
fi
exec /usr/bin/bootc-real "$@"
