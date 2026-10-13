#!/usr/bin/env bash
set -euo pipefail

files=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$PR/files" --paginate --jq '.[] | select(.status == "added") | .filename' |
  grep -E '^social/[^/]+/[^/]+\.txt$' || true)
[ -n "$files" ] || exit 0

echo "## Social posts published on merge"
failed=0
while read -r file; do
  echo
  echo "**$file**"
  if [[ $file == social/twitter/* ]]; then
    # ponytail: counts each code point of an emoji sequence, so it can overcount. Use twitter-text if that bites.
    length=$(python3 -c '
import re, sys
text = re.sub(r"https?://\S+", "x" * 23, sys.stdin.read().rstrip())
light = lambda o: o <= 4351 or 8192 <= o <= 8205 or 8208 <= o <= 8223 or 8242 <= o <= 8247
print(sum(1 if light(ord(char)) else 2 for char in text))' <"$file")
    if [ "$length" -gt 280 ]; then
      echo "- :x: $length/280 characters"
      failed=1
    else
      echo "- $length/280 characters"
    fi
  fi
  echo
  echo '````text'
  cat "$file"
  echo '````'
  for image in "${file%.txt}".*; do
    [[ $image == *.txt ]] || echo "![$image](https://raw.githubusercontent.com/$GITHUB_REPOSITORY/$HEAD_SHA/$image)"
  done
done <<<"$files"
exit $failed
