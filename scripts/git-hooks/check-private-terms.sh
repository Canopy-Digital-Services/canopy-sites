#!/bin/sh
# Refuses text that identifies a client (CLAUDE.md, "Client information").
# The terms are private and never in this repo: one per line in the file
# $CANOPY_PRIVATE_TERMS names, else ~/.config/canopy/private-terms.txt (its
# master copy is the Nextcloud page "Client Sites"). A term matches anywhere in
# the text, even inside a longer word or an identifier, ignoring case; prefix
# it with "case:" to match case. Lines starting with # are comments.
# Usage: check-private-terms.sh <file with the text to check> <what it is>
text="$1"
what="$2"
terms="${CANOPY_PRIVATE_TERMS:-$HOME/.config/canopy/private-terms.txt}"
if [ ! -f "$terms" ]; then
  echo "warning: no client term list at $terms, so $what wasn't checked for client names (CLAUDE.md, \"Client information\")" >&2
  exit 0
fi
found=0
while IFS= read -r term || [ -n "$term" ]; do
  case "$term" in ''|'#'*) continue ;; esac
  flags="-n -F -i"
  case "$term" in case:*) term="${term#case:}"; flags="-n -F" ;; esac
  # shellcheck disable=SC2086
  hits=$(grep $flags -- "$term" "$text")
  if [ -n "$hits" ]; then
    found=1
    echo "$hits" | while IFS= read -r hit; do echo "  [$term] $hit" >&2; done
  fi
done < "$terms"
if [ "$found" = 1 ]; then
  echo "Client information in $what (above). This repo is public: rewrite it per CLAUDE.md, \"Client information\", and put anything client-specific in Nextcloud (Canopy Sites, Client Sites). Don't bypass this check." >&2
  exit 1
fi
exit 0
