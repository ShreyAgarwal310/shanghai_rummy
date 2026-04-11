#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
TMP_B=$(mktemp)
TMP_F=$(mktemp)

# ── BACKEND ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  BACKEND  (Python · unittest)"
echo "════════════════════════════════════════════════════════════"

cd "$BACKEND"
python3 -m coverage run --source=app -m unittest discover -s tests -p "test_*.py" -v 2>&1
python3 -m coverage report -m \
  --include="app/cards/card.py,app/cards/deck.py,app/cards/discard_pile.py,app/hands.py,app/melds/meld.py,app/melds/run_meld.py,app/melds/set_meld.py,app/rules/contract.py,app/rules/rules_engine.py" \
  > "$TMP_B" 2>&1
cat "$TMP_B"

# ── FRONTEND ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  FRONTEND  (TypeScript · Vitest)"
echo "════════════════════════════════════════════════════════════"

cd "$FRONTEND"
npm run test:coverage 2>&1 | tee /dev/stderr | \
  awk '/% Coverage report from/,0' | tail -n +2 > "$TMP_F" 2>/dev/null || true
npm run test:coverage 2>&1 | grep -E "✓|✗|Test Files|Tests  [0-9]"

# ── SIDE-BY-SIDE COVERAGE ────────────────────────────────────────────────────
echo ""
python3 - "$TMP_B" "$TMP_F" << 'PYEOF'
import sys

with open(sys.argv[1]) as fh:
    b_lines = [l.rstrip() for l in fh if l.strip()]

with open(sys.argv[2]) as fh:
    f_lines = [l.rstrip() for l in fh if l.strip()]

b_width = max((len(l) for l in b_lines), default=0)
f_width = max((len(l) for l in f_lines), default=0)

header_b = '  BACKEND COVERAGE  '
header_f = '  FRONTEND COVERAGE  '

b_width = max(b_width, len(header_b))
f_width = max(f_width, len(header_f))

height = max(len(b_lines), len(f_lines))
b_lines += [''] * (height - len(b_lines))
f_lines += [''] * (height - len(f_lines))

sep = '    '

print()
print(header_b.center(b_width) + sep + header_f.center(f_width))
print('─' * b_width + sep + '─' * f_width)
for bl, fl in zip(b_lines, f_lines):
    print(bl.ljust(b_width) + sep + fl)
print()
PYEOF

rm -f "$TMP_B" "$TMP_F"
