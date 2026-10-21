#!/usr/bin/env bash
set -euo pipefail

files=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$PR/files" --paginate --jq '.[] | select(.status == "added") | .filename' |
  grep -E '^social/[^/]+/[^/]+\.txt$' || true)
[ -n "$files" ] || exit 0

echo "## Social posts"
failed=0
while read -r file; do
  echo
  echo "**$file**"
  at=$(sed -n '1s/^at: *//p' "$file")
  text=$(cat "$file")
  if [ -n "$at" ]; then
    text=$(tail -n +2 "$file" | sed '/./,$!d')
    if due=$(python3 -c 'import sys; from datetime import datetime, timezone
due = datetime.fromisoformat(sys.argv[1]).astimezone(timezone.utc)
print(due.strftime("%A, %d %B %Y at %H:%M UTC"))
sys.exit(due < datetime.now(timezone.utc))' "$at"); then
      echo "- Scheduled for $due"
    else
      echo "- :x: \`at: $at\` is invalid or in the past"
      failed=1
    fi
  else
    echo "- Published on merge"
  fi
  comment=$(sed '1,/^---$/d' <<<"$text")
  text=$(sed '/^---$/,$d' <<<"$text")
  if [[ $file == social/twitter/* ]]; then
    for part in "$text" "$comment"; do
      [ -n "$part" ] || continue
      # ponytail: counts each code point of an emoji sequence, so it can overcount. Use twitter-text if that bites.
      length=$(python3 -c '
import re, sys
text = re.sub(r"https?://\S+", "x" * 23, sys.stdin.read().strip())
light = lambda o: o <= 4351 or 8192 <= o <= 8205 or 8208 <= o <= 8223 or 8242 <= o <= 8247
print(sum(1 if light(ord(char)) else 2 for char in text))' <<<"$part")
      if [ "$length" -gt 280 ]; then
        echo "- :x: $length/280 characters"
        failed=1
      else
        echo "- $length/280 characters"
      fi
    done
  fi
  echo
  echo '````text'
  echo "$text"
  echo '````'
  if [ -n "$comment" ]; then
    echo
    echo 'First comment:'
    echo
    echo '````text'
    echo "$comment" | sed '/./,$!d'
    echo '````'
  fi
  for image in "${file%.txt}".*; do
    [[ $image == *.txt ]] || echo "![$image](https://raw.githubusercontent.com/$GITHUB_REPOSITORY/$HEAD_SHA/$image)"
  done
done <<<"$files"
exit $failed
