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
  for id in $ids; do
    input=$(jq -n --rawfile text "$file" --arg id "$id" --argjson assets "$assets" '{input: {
      text: ($text | sub("\\s+$"; "")), assets: $assets, channelId: $id, schedulingType: "automatic", mode: "shareNow"
    }}')
    response=$(buffer 'mutation($input: CreatePostInput!) { createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    } }' "$input")
    if jq -e '.data.createPost.post.id' <<<"$response" >/dev/null; then
      echo "Published $file to $service"
    else
      echo "::error file=$file::$response"
      failed=1
    fi
  done
done <<<"$files"
exit $failed
