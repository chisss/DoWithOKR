#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DoWithOKR Install Script
# Registers OKR skills into a target project for Claude Code.
# Usage: ./install.sh [target_project_path]
# ============================================================

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

COMMANDS_DIR="$TARGET_DIR/.claude/commands"
SKILLS_DIR="$PLUGIN_DIR/skills"
ROUTING_FILE="$PLUGIN_DIR/references/claude-routing-rules.md"
CLAUDE_MD="$TARGET_DIR/CLAUDE.md"
ROUTING_MARKER="## DoWithOKR Skill Routing"

echo "DoWithOKR Installer"
echo "  Plugin source : $PLUGIN_DIR"
echo "  Target project: $TARGET_DIR"
echo ""

# ----------------------------------------------------------
# 1. Ensure .claude/commands/ exists
# ----------------------------------------------------------
if [ ! -d "$COMMANDS_DIR" ]; then
  echo "Creating $COMMANDS_DIR ..."
  mkdir -p "$COMMANDS_DIR"
fi

# ----------------------------------------------------------
# 2. Copy skill files into .claude/commands/
# ----------------------------------------------------------
copied=0
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name="$(basename "$skill_dir")"
  src="$skill_dir/SKILL.md"
  dest="$COMMANDS_DIR/${skill_name}.md"

  if [ ! -f "$src" ]; then
    echo "  [WARN] Skipping $skill_name: SKILL.md not found"
    continue
  fi

  cp "$src" "$dest"
  echo "  Installed: .claude/commands/${skill_name}.md"
  copied=$((copied + 1))
done

echo ""
echo "$copied skill(s) installed into .claude/commands/"
echo ""

# ----------------------------------------------------------
# 3. Add routing rules to CLAUDE.md
# ----------------------------------------------------------
if [ ! -f "$ROUTING_FILE" ]; then
  echo "[ERROR] Routing rules template not found: $ROUTING_FILE"
  exit 1
fi

if [ -f "$CLAUDE_MD" ]; then
  if grep -qF "$ROUTING_MARKER" "$CLAUDE_MD"; then
    echo "CLAUDE.md already contains DoWithOKR routing rules. Skipping."
  else
    echo "" >> "$CLAUDE_MD"
    cat "$ROUTING_FILE" >> "$CLAUDE_MD"
    echo "Routing rules appended to CLAUDE.md"
  fi
else
  cat "$ROUTING_FILE" > "$CLAUDE_MD"
  echo "Created CLAUDE.md with DoWithOKR routing rules"
fi

echo ""

# ----------------------------------------------------------
# 4. Summary
# ----------------------------------------------------------
echo "Installation complete! Available commands:"
echo ""
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name="$(basename "$skill_dir")"
  echo "  /$skill_name"
done
echo ""
echo "Add these triggers to your prompts or let Claude Code route automatically."
