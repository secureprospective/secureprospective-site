#!/usr/bin/env python3
"""Make the installer's progress bar follow the real image deploy.

THE DEFECT, measured on the cycle38 ISO:

Anaconda's overall progress bar is driven by
`pyanaconda/modules/boss/installation.py`, where

    self._total_steps = queue.task_count            # denominator is TASK COUNT

    def _task_completed_cb(self, task):
        self.report_progress("", step_size=1)       # +1 per FINISHED task

    def _progress_report_cb(self, step, message):
        self.report_progress(message)               # sub-step RECEIVED, DISCARDED

Deploying the bootc image is ONE task that consumes nearly the whole install,
so the bar parks at roughly 8% for many minutes while the text underneath
keeps changing. Advisors read that as a hung installer.

Note the second defect, which is why the obvious fix does not work: patching
only DeployBootcTask to declare more steps changes nothing, because the boss
throws the sub-step away. BOTH files have to change.

THE FIX:
  * DeployBootcTask declares 100 steps and reports them. Without the declared
    steps its own reports are clamped to 1 (progress.py: max_step = self.steps).
  * The boss scales to task_count * 100 and forwards the sub-step on top of a
    per-task base, so a long task advances the bar continuously.

The percentage itself comes from our own bootc wrapper as SPPLUS_PROGRESS
lines, so we never have to parse bootc's human-readable output.

This runs at image build time against the installer container, which IS the
installer runtime -- the bootc wrapper we install in the same Containerfile
appears in the shipped ISO's squashfs as /usr/bin/bootc. So no updates.img,
no inst.updates=, and no dracut overlay are involved.

Every replacement must match EXACTLY ONCE or the build fails. A patch that
silently matches nothing is the precise failure mode this is meant to end.
"""
from pathlib import Path

ROOT = Path("/usr/lib64/python3.14/site-packages/pyanaconda")
PAYLOAD = ROOT / "modules/payloads/payload/rpm_ostree/installation.py"
BOSS = ROOT / "modules/boss/installation.py"


def replace_once(path, old, new):
    """Apply one replacement, refusing anything but a single exact match."""
    text = path.read_text()
    found = text.count(old)
    if found != 1:
        raise SystemExit(
            "patch-anaconda-progress: expected exactly 1 match in %s, found %d\n"
            "  anchor: %r" % (path, found, old[:120])
        )
    path.write_text(text.replace(old, new))


# --- The payload task: declare real steps and report them. --------------------
replace_once(
    PAYLOAD,
    'class DeployBootcTask(Task):\n    """Task to deploy Bootc based image."""',
    'class DeployBootcTask(Task):\n'
    '    """Task to deploy Bootc based image."""\n'
    '\n'
    '    @property\n'
    '    def steps(self):\n'
    '        # SP+: without this the task clamps its own step numbers to 1.\n'
    '        return 100',
)

replace_once(
    PAYLOAD,
    '        log.debug("bootc output: %s", line)\n'
    '        self.report_progress(_("Deploying image: {}").format(line))',
    '        log.debug("bootc output: %s", line)\n'
    '        # SP+: our bootc wrapper emits SPPLUS_PROGRESS <0-100>. Parsing our\n'
    '        # own token means we never depend on bootc\'s output format.\n'
    '        if line.startswith("SPPLUS_PROGRESS "):\n'
    '            try:\n'
    '                step = max(0, min(100, int(line.split()[1])))\n'
    '            except (IndexError, ValueError):\n'
    '                return\n'
    '            self.report_progress(_("Deploying image: {}%").format(step),\n'
    '                                 step_number=step)\n'
    '            return\n'
    '        self.report_progress(_("Deploying image: {}").format(line))',
)

# --- The boss: scale by 100 and forward the sub-step. -------------------------
replace_once(
    BOSS,
    '        self._total_steps = 0\n        self._install_manager = install_manager',
    '        self._total_steps = 0\n'
    '        # SP+: base position, advanced by 100 per completed task.\n'
    '        self._completed_steps = 0\n'
    '        self._install_manager = install_manager',
)

replace_once(
    BOSS,
    '    def _task_completed_cb(self, task):\n'
    '        """The installation task was completed."""\n'
    '        self.report_progress("", step_size=1)\n'
    '\n'
    '    def _progress_report_cb(self, step, message):\n'
    '        """Handle a progress report of a task."""\n'
    '        self.report_progress(message)',
    '    def _task_completed_cb(self, task):\n'
    '        """The installation task was completed."""\n'
    '        # SP+: each task is worth 100 now, not 1.\n'
    '        self._completed_steps += 100\n'
    '        self.report_progress("", step_number=self._completed_steps)\n'
    '\n'
    '    def _progress_report_cb(self, step, message):\n'
    '        """Handle a progress report of a task."""\n'
    '        # SP+: forward the sub-step instead of discarding it, so one long\n'
    '        # task moves the bar continuously. A task contributes at most 100,\n'
    '        # so it can never run past its own boundary, and report_progress\n'
    '        # is monotonic and clamps to self.steps.\n'
    '        step = max(0, min(100, step))\n'
    '        self.report_progress(\n'
    '            message,\n'
    '            step_number=self._completed_steps + step,\n'
    '        )',
)

replace_once(
    BOSS,
    '        self._total_steps = queue.task_count',
    '        self._total_steps = queue.task_count * 100',
)

print("patch-anaconda-progress: patched %s and %s" % (PAYLOAD.name, BOSS.name))
