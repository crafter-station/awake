#!/bin/bash
# lid-test.sh - prove the Mac stayed awake while the lid was closed.
#
#   ./scripts/lid-test.sh start    # begin heartbeat logging (every 5s)
#   (close the lid for a few minutes, then reopen)
#   ./scripts/lid-test.sh report   # stop logging and print the verdict
set -euo pipefail

DIR="$HOME/Library/Application Support/awake"
LOG="$DIR/lid-test.log"
PIDFILE="$DIR/lid-test.pid"
INTERVAL=5

lid_state() {
  if ioreg -r -k AppleClamshellState -d 1 2>/dev/null | grep -q '"AppleClamshellState" = Yes'; then
    echo "closed"
  else
    echo "open"
  fi
}

sleep_disabled() {
  if pmset -g 2>/dev/null | grep -Eq 'SleepDisabled[[:space:]]+1'; then
    echo 1
  else
    echo 0
  fi
}

stop_logger() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
  fi
}

case "${1:-}" in
  start)
    mkdir -p "$DIR"
    stop_logger
    rm -f "$LOG"

    if [ "$(sleep_disabled)" != "1" ]; then
      echo "warning: awake is OFF - the Mac WILL sleep when you close the lid."
      echo "run \`awake on 10m\` first if you want the stay-awake test."
    fi

    (
      while true; do
        echo "$(date +%s) $(date '+%H:%M:%S') lid=$(lid_state) sleepdisabled=$(sleep_disabled)"
        sleep "$INTERVAL"
      done >> "$LOG"
    ) &
    echo $! > "$PIDFILE"
    disown

    echo "heartbeat running (every ${INTERVAL}s) -> $LOG"
    echo ""
    echo "now: close the lid, wait 2-3 minutes, reopen, then run:"
    echo "  $0 report"
    ;;

  report)
    stop_logger
    if [ ! -s "$LOG" ]; then
      echo "no log found - run \`$0 start\` first"
      exit 1
    fi

    total=$(wc -l < "$LOG" | tr -d ' ')
    closed=$(grep -c 'lid=closed' "$LOG" || true)
    first=$(head -1 "$LOG" | awk '{print $2}')
    last=$(tail -1 "$LOG" | awk '{print $2}')

    echo "heartbeats: $total (from $first to $last), $closed with the lid closed"
    echo ""

    echo "gaps longer than $((INTERVAL * 3))s (a gap = the Mac was asleep):"
    gaps=$(awk -v limit=$((INTERVAL * 3)) '
      NR > 1 && $1 - prev > limit {
        printf "  slept %ds: %s -> %s (lid was %s)\n", $1 - prev, prevts, $2, prevlid
        found = 1
      }
      { prev = $1; prevts = $2; prevlid = $3 }
      END { if (!found) print "  none" }
    ' "$LOG")
    echo "$gaps"
    echo ""

    if [ "$closed" -eq 0 ]; then
      echo "verdict: INCONCLUSIVE - the lid was never closed during the test"
    elif echo "$gaps" | grep -q "none"; then
      echo "verdict: PASS - the Mac kept running the whole time, including $((closed * INTERVAL))s with the lid closed"
    elif echo "$gaps" | grep -q "lid was lid=closed"; then
      echo "verdict: the Mac slept while the lid was closed (see gaps above)"
      echo "  - if the gap starts at your auto-off time, that is awake's timer working as designed"
    else
      echo "verdict: PASS with a caveat - a gap occurred but not while the lid was closed"
    fi

    echo ""
    echo "cross-check, sleep/wake events from the macOS power log:"
    pmset -g log 2>/dev/null | grep -E "Entering Sleep|Wake from" | tail -4 | sed 's/^/  /' || true
    ;;

  stop)
    stop_logger
    echo "heartbeat stopped"
    ;;

  *)
    echo "usage: $0 {start|report|stop}"
    exit 1
    ;;
esac
