#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DoWithOKR Uninstall Script
# Removes OKR skills and routing rules from a target project.
# Usage: ./uninstall.sh [target_project_path]
# ============================================================

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

COMMANDS_DIR="$TARGET_DIR/.claude/commands"
CLAUDE_MD="$TARGET_DIR/CLAUDE.md"
ROUTING_MARKER="## DoWithOKR Skill Routing"

echo "DoWithOKR Uninstaller"
echo "  Target project: $TARGET_DIR"
echo ""

# ----------------------------------------------------------
# 1. Remove skill command files
# ----------------------------------------------------------
removed=0
if [ -d "$COMMANDS_DIR" ]; then
  for f in "$COMMANDS_DIR"/okr-*.md; do
    [ -f "$f" ] || continue
    rm "$f"
    echo "  Removed: $(basename "$f")"
    removed=$((removed + 1))
  done
fi

if [ "$removed" -eq 0 ]; then
  echo "  No okr-*.md files found in .claude/commands/"
else
  echo ""
  echo "$removed skill file(s) removed."
fi
echo ""

# ----------------------------------------------------------
# 2. Remove routing rules from CLAUDE.md
# ----------------------------------------------------------
if [ -f "$CLAUDE_MD" ]; then
  if grep -qF "$ROUTING_MARKER" "$CLAUDE_MD"; then
    # Remove the DoWithOKR section: from the marker to the next "## " heading or EOF.
    # Uses a temp file for portable sed compatibility (macOS + Linux).
    tmp_file="$(mktemp)"
    awk -v marker="$ROUTING_MARKER" '
      BEGIN { skip = 0 }
      {
        if (index($0, marker) == 1) {
          skip = 1
          next
        }
        if (skip && /^## /) {
          skip = 0
        }
        if (!skip) {
          print
        }
      }
    ' "$CLAUDE_MD" > "$tmp_file"

    # Trim trailing blank lines left behind (portable across macOS and Linux)
    while [ -s "$tmp_file" ] && tail -1 "$tmp_file" | grep -q '^[[:space:]]*$'; do
      sed -i.bak '$ d' "$tmp_file"
      rm -f "$tmp_file.bak"
    done
    mv "$tmp_file" "$CLAUDE_MD"

    echo "Removed DoWithOKR routing rules from CLAUDE.md"
  else
    echo "No DoWithOKR routing rules found in CLAUDE.md. Skipping."
  fi
else
  echo "No CLAUDE.md found. Skipping."
fi

echo ""
echo "Uninstall complete."
