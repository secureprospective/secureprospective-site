#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
sha256sum -c playbooks/printer-reconnect.json.sha256
printf 'Playbook trust manifest passed.\n'
