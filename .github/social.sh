#!/usr/bin/env bash
set -euo pipefail

buffer() {
  jq -n --arg query "$1" --argjson variables "${2:-null}" '{query: $query, variables: $variables}' |
    curl -sS --fail-with-body https://api.buffer.com \
      -H "Authorization: Bearer $BUFFER_API_KEY" -H "Content-Type: application/json" -d @-
}

# Only added files, so editing an already published post never publishes it again.
files=$(git diff --name-only --diff-filter=A "$BEFORE" HEAD -- 'social/*/*.txt')
[ -n "$files" ] || exit 0

org=$(buffer '{account{organizations{id}}}' | jq -er '.data.account.organizations[0].id')
channels=$(buffer "{channels(input:{organizationId:\"$org\"}){id service}}" | jq -ec '.data.channels')

failed=0
while read -r file; do
  service=$(basename "$(dirname "$file")")
  ids=$(jq -r --arg service "$service" '.[] | select(.service == $service) | .id' <<<"$channels")
  if [ -z "$ids" ]; then
    echo "::error file=$file::No Buffer channel for '$service'. Connected: $(jq -c 'map(.service)' <<<"$channels")"
    failed=1
    continue
  fi
  assets=$(for image in "${file%.txt}".*; do
    [[ $image == *.txt ]] ||
      jq -n --arg url "https://raw.githubusercontent.com/$GITHUB_REPOSITORY/$GITHUB_SHA/$image" '{image: {url: $url}}'
  done | jq -sc .)
  at=$(sed -n '1s/^at: *//p' "$file")
  due=""
  text=$(cat "$file")
  if [ -n "$at" ]; then
    text=$(tail -n +2 "$file")
    due=$(python3 -c 'import sys; from datetime import datetime, timezone
print(datetime.fromisoformat(sys.argv[1]).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"))' "$at") || {
      echo "::error file=$file::Invalid schedule '$at'"
      failed=1
      continue
    }
  fi
  for id in $ids; do
    input=$(jq -n --arg text "$text" --arg due "$due" --arg id "$id" --argjson assets "$assets" '{input: ({
      text: ($text | sub("^\\s+"; "") | sub("\\s+$"; "")), assets: $assets, channelId: $id, schedulingType: "automatic"
    } + if $due == "" then {mode: "shareNow"} else {mode: "customScheduled", dueAt: $due} end)}')
    response=$(buffer 'mutation($input: CreatePostInput!) { createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    } }' "$input")
    if jq -e '.data.createPost.post.id' <<<"$response" >/dev/null; then
      echo "Sent $file to $service (${due:-now})"
    else
      echo "::error file=$file::$response"
      failed=1
    fi
  done
done <<<"$files"
exit $failed
