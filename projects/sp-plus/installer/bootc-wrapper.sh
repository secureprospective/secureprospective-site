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
    # Progress for the installer bar. Anaconda's patched DeployBootcTask reads
    # SPPLUS_PROGRESS lines from this stream. Emitting our OWN token means the
    # progress bar never depends on bootc's human-readable output staying
    # stable. The figure is bytes actually landed on the target, which is the
    # honest signal, measured at most once a second because bootc is chatty and
    # this would otherwise fork df for every line it prints.
    # DN-28. Two defects lived here and both made the bar look like a hung
    # machine, which is the worst possible thing to show a non-technical
    # advisor mid-install.
    #
    #  1. The denominator was hardcoded to 5 GB. The real payload is ~11 GB, so
    #     the fraction saturated and the bar jumped 0 -> 99.
    #  2. Sampling ran INSIDE `while read`, so it only happened when bootc
    #     printed something. bootc is nearly silent through the long deploy, so
    #     a multi-minute install emitted about seven samples: 0, 0, 99, 100.
    #
    # The denominator is now measured, and sampling runs on its own clock so the
    # bar keeps moving no matter how quiet bootc is.
    progress_bytes_start=$(df --output=used -B1 "$target" 2>/dev/null | tail -1 | tr -d ' ')
    progress_bytes_start=${progress_bytes_start:-0}
    progress_image_bytes="${SPPLUS_PAYLOAD_BYTES:-}"
    if [[ -z "$progress_image_bytes" ]]; then
        for progress_store in /run/install/repo/container \
                              /run/install/sources/*/container \
                              /var/lib/containers/storage; do
            [[ -d "$progress_store" ]] || continue
            progress_image_bytes=$(du -sb "$progress_store" 2>/dev/null | cut -f1)
            [[ -n "$progress_image_bytes" ]] && (( progress_image_bytes > 0 )) && break
            progress_image_bytes=""
        done
    fi
    # Only if the payload could not be measured at all. Never silently right.
    if [[ -z "$progress_image_bytes" ]] || (( progress_image_bytes <= 0 )); then
        progress_image_bytes=11000000000
        echo "Advisor bootc progress: payload size unmeasurable, using fallback" >&2
    fi
    echo "Advisor bootc progress: denominator ${progress_image_bytes} bytes"
    printf 'SPPLUS_PROGRESS 0\n'

    # Clock-driven sampler. Independent of whether bootc says anything.
    (
        progress_pct=0
        while :; do
            sleep 2
            progress_bytes_now=$(df --output=used -B1 "$target" 2>/dev/null | tail -1 | tr -d ' ')
            progress_bytes_now=${progress_bytes_now:-$progress_bytes_start}
            measured_pct=$(( (progress_bytes_now - progress_bytes_start) * 100 / progress_image_bytes ))
            # Never go backwards, and never claim done before bootc says so.
            (( measured_pct < progress_pct )) && measured_pct=$progress_pct
            (( measured_pct > 99 )) && measured_pct=99
            progress_pct=$measured_pct
            printf 'SPPLUS_PROGRESS %d\n' "$progress_pct"
        done
    ) &
    progress_sampler_pid=$!

    TMPDIR=/var/tmp "${bootc_cmd[@]}" 2>&1 | while IFS= read -r line; do
        printf '%s\n' "$line"
        if [[ "$line" == *"Deploying container image...done"* ]]; then
            kill "$progress_sampler_pid" 2>/dev/null || true
            printf 'SPPLUS_PROGRESS 100\n'
            mountpoint -q /var/tmp && umount /var/tmp || true
            scratch_bound=0
            echo "Advisor bootc scratch: unbound /var/tmp after image import"
        fi
    done
    progress_rc="${PIPESTATUS[0]}"
    kill "$progress_sampler_pid" 2>/dev/null || true
    wait "$progress_sampler_pid" 2>/dev/null || true
    exit "$progress_rc"
fi
exec /usr/bin/bootc-real "$@"
