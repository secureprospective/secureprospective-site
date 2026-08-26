#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
python3 -m pytest -q tests/test_runtime.py 2>/dev/null || python3 -m unittest discover -s tests -p 'test_*.py'
printf 'Host runtime tests passed.\n'
