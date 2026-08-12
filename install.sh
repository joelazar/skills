#!/usr/bin/env bash
# Symlink this repo to ~/.agents/skills (the path agents read skills from).
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target="${HOME}/.agents/skills"

mkdir -p "$(dirname "$target")"

if [[ -L "$target" ]]; then
	current="$(readlink "$target")"
	if [[ "$current" == "$repo_dir" ]]; then
		echo "already installed: $target -> $repo_dir"
		exit 0
	fi
	rm "$target"
elif [[ -e "$target" ]]; then
	backup="${target}.bak.$(date +%Y%m%d%H%M%S)"
	echo "moving existing $target to $backup"
	mv "$target" "$backup"
fi

ln -s "$repo_dir" "$target"
echo "installed: $target -> $repo_dir"
