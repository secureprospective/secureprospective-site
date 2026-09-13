#!/usr/bin/env bash
# update-sampler.sh -- instrument a machine across a risky step (staging an
# update, applying one, a reboot) so that afterwards there is a curve to read
# instead of an argument to have.
#
# WHY THIS EXISTS. Two sessions argued for roughly two hours over whether
# staging wedged a Dell laptop by exhausting its memory. One run of this script
# settled it in eleven minutes: 167 fork-canary samples, zero failures, swap
# never touched, zero microseconds of memory PSI -- and PSI io pegged at 56.
# The machine was never out of memory. It was buried in I/O. Nothing short of
# sampling DURING the run could have told those two states apart, because both
# look identical from outside: an ssh session that authenticates and then hangs.
#
# THE FORK CANARY IS THE POINT. MemAvailable tells you what the kernel thinks
# it has. The canary tells you whether a process can actually start, which is
# the thing an operator is really asking when a machine stops answering.
#
# /var/tmp, NEVER /tmp. /tmp is tmpfs here: the log would be destroyed by the
# reboot you most wanted it across, and it would consume the very memory under
# measurement.
#
# Usage, on the SUBJECT machine:
#
#   sudo systemd-run --unit=spplus-sampler --collect \
#        /var/tmp/update-sampler.sh
#
#   # confirm it is GROWING before you touch anything:
#   wc -l /var/tmp/spplus-sampler-*.log; sleep 10
#   wc -l /var/tmp/spplus-sampler-*.log
#
#   # afterwards:
#   systemctl stop spplus-sampler
#
# Detached under systemd-run on purpose: a sampler that dies with the ssh
# session is useless precisely when the ssh session is the thing that stalls.
set -u

INTERVAL="${SPPLUS_SAMPLE_INTERVAL:-5}"
OUT="${SPPLUS_SAMPLE_LOG:-/var/tmp/spplus-sampler-$(date -u +%Y%m%dT%H%M%SZ).log}"

log() { printf '%s\n' "$*" >>"$OUT"; }

log "# spplus update sampler"
log "# started   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "# host      $(hostname)"
log "# interval  ${INTERVAL}s"
log "# kernel    $(uname -r)"
# The booted digest is the anchor for everything else in the file. Without it a
# log cannot be attributed to a particular update attempt after the fact.
booted=$(bootc status --json 2>/dev/null | grep -o '"image":"[^"]*"' | head -1)
log "# booted    ${booted:-unknown}"
log "#"

while :; do
    ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # --- memory -------------------------------------------------------------
    memavail=$(awk '/^MemAvailable:/{print $2}' /proc/meminfo)
    swapfree=$(awk '/^SwapFree:/{print $2}' /proc/meminfo)
    dirty=$(awk '/^Dirty:/{print $2}' /proc/meminfo)

    # --- load ---------------------------------------------------------------
    read -r l1 l5 l15 _ </proc/loadavg

    # --- pressure -----------------------------------------------------------
    # BOTH memory and io. Memory PSI alone was what let the wrong theory live:
    # it reads 0.00 during a total I/O stall, which looks like "nothing is
    # wrong" if io is the axis you are not sampling.
    psi_mem=$(tr '\n' ' ' </proc/pressure/memory 2>/dev/null)
    psi_io=$(tr '\n' ' ' </proc/pressure/io 2>/dev/null)
    psi_cpu=$(tr '\n' ' ' </proc/pressure/cpu 2>/dev/null)

    # --- disk ---------------------------------------------------------------
    # Whole devices only; partitions double-count the same queue.
    disks=$(awk '$3 ~ /^(sd[a-z]|nvme[0-9]+n[0-9]+|vd[a-z]|mmcblk[0-9]+)$/ \
                 {printf "%s:r=%s,w=%s,inflight=%s,iotime=%s ", $3,$6,$10,$12,$13}' \
                 /proc/diskstats)

    # --- top 5 by RSS -------------------------------------------------------
    top5=$(ps -eo rss=,comm= --sort=-rss 2>/dev/null | head -5 \
           | awk '{printf "%s=%sk ", $2, $1}')

    # --- the fork canary ----------------------------------------------------
    # Run a real program. If the machine cannot fork, this is where it shows,
    # and it shows as ENOMEM rather than as a number that needs interpreting.
    # SPPLUS_CANARY_BIN exists so the FAIL branch can be exercised deliberately:
    # a gate whose failure path has never run is not known to work. Point it at a
    # nonexistent path and confirm this line reports FAIL before trusting an OK.
    if canary_err=$("${SPPLUS_CANARY_BIN:-/bin/true}" 2>&1); then
        canary="OK"
    else
        canary="FAIL(${canary_err:-status $?})"
    fi

    log "$ts memavail=${memavail}k swapfree=${swapfree}k dirty=${dirty}k load=$l1/$l5/$l15 canary=$canary"
    log "    psi_mem: $psi_mem"
    log "    psi_io:  $psi_io"
    log "    psi_cpu: $psi_cpu"
    log "    disk:    $disks"
    log "    rss:     $top5"

    sleep "$INTERVAL"
done
