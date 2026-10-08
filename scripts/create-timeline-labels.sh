#!/usr/bin/env bash
# Creates the GitHub labels the /timeline page reads. Needs the GitHub CLI (`gh auth login`).
# Safe to re-run: existing labels are updated. Usage: scripts/create-timeline-labels.sh [owner/repo ...]
set -euo pipefail

repos=("$@")
if [ ${#repos[@]} -eq 0 ]; then
  repos=(chili-chip/chili-platform-frontend chili-chip/chili-platform)
fi

labels=(
  "timeline|0e8a16|Show on the public timeline"
  "in-progress|fbca04|Timeline status: in progress"
  "area:hardware|5319e7|Timeline area: hardware"
  "area:store|5319e7|Timeline area: store"
  "area:marketplace|5319e7|Timeline area: marketplace"
  "area:creator|5319e7|Timeline area: creator"
  "area:community|5319e7|Timeline area: community"
  "area:account|5319e7|Timeline area: account"
  "area:platform|5319e7|Timeline area: platform"
)

for repo in "${repos[@]}"; do
  for entry in "${labels[@]}"; do
    IFS='|' read -r name color description <<<"$entry"
    gh label create "$name" --repo "$repo" --color "$color" --description "$description" --force
  done
done
