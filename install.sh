#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DoWithOKR Install Script
# Registers OKR skills into a target project for Claude Code
# and Codex CLI.
# Usage: ./install.sh [target_project_path]
# ============================================================

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

SKILLS_DIR="$PLUGIN_DIR/skills"
REFS_DIR="$PLUGIN_DIR/references"
ROUTING_FILE="$PLUGIN_DIR/references/claude-routing-rules.md"

echo "DoWithOKR Installer"
echo "  Plugin source : $PLUGIN_DIR"
echo "  Target project: $TARGET_DIR"
echo ""

# ==========================================================
# Claude Code
# ==========================================================
echo "── Claude Code ──"

COMMANDS_DIR="$TARGET_DIR/.claude/commands"
CLAUDE_MD="$TARGET_DIR/CLAUDE.md"
ROUTING_MARKER="## DoWithOKR Skill Routing"

if [ ! -d "$COMMANDS_DIR" ]; then
  mkdir -p "$COMMANDS_DIR"
fi

cc_copied=0
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
  cc_copied=$((cc_copied + 1))
done

echo "  $cc_copied skill(s) installed into .claude/commands/"

if [ -f "$ROUTING_FILE" ]; then
  if [ -f "$CLAUDE_MD" ]; then
    if grep -qF "$ROUTING_MARKER" "$CLAUDE_MD"; then
      echo "  CLAUDE.md already contains routing rules. Skipping."
    else
      echo "" >> "$CLAUDE_MD"
      cat "$ROUTING_FILE" >> "$CLAUDE_MD"
      echo "  Routing rules appended to CLAUDE.md"
    fi
  else
    cat "$ROUTING_FILE" > "$CLAUDE_MD"
    echo "  Created CLAUDE.md with routing rules"
  fi
fi

echo ""

# ==========================================================
# Codex CLI
# ==========================================================
echo "── Codex CLI ──"

CODEX_PLUGIN_DIR="$TARGET_DIR/.codex-plugin"
CODEX_PLUGIN_JSON="$PLUGIN_DIR/.codex-plugin/plugin.json"
AGENTS_MD="$TARGET_DIR/AGENTS.md"
AGENTS_MARKER="## DoWithOKR Skill Routing"

if [ ! -f "$CODEX_PLUGIN_JSON" ]; then
  echo "  [WARN] Source .codex-plugin/plugin.json not found. Skipping Codex install."
else
  if [ ! -d "$CODEX_PLUGIN_DIR" ]; then
    mkdir -p "$CODEX_PLUGIN_DIR"
  fi

  # plugin.json
  if [ -f "$CODEX_PLUGIN_DIR/plugin.json" ]; then
    existing_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$CODEX_PLUGIN_DIR/plugin.json" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    if [ "$existing_name" = "dowithokr" ]; then
      echo "  plugin.json already installed. Updating."
    else
      echo "  [WARN] .codex-plugin/plugin.json belongs to '$existing_name'. Skipping to avoid overwrite."
      echo ""
      echo "Done."
      exit 0
    fi
  fi
  cp "$CODEX_PLUGIN_JSON" "$CODEX_PLUGIN_DIR/plugin.json"
  echo "  Installed: .codex-plugin/plugin.json"

  # skills/ symlink
  if [ -L "$CODEX_PLUGIN_DIR/skills" ]; then
    rm "$CODEX_PLUGIN_DIR/skills"
  fi
  if [ -d "$CODEX_PLUGIN_DIR/skills" ] && [ ! -L "$CODEX_PLUGIN_DIR/skills" ]; then
    echo "  [WARN] .codex-plugin/skills/ is a real directory. Skipping symlink."
  else
    ln -sf "$SKILLS_DIR" "$CODEX_PLUGIN_DIR/skills"
    echo "  Linked:    .codex-plugin/skills → $SKILLS_DIR"
  fi

  # references/ symlink
  if [ -L "$CODEX_PLUGIN_DIR/references" ]; then
    rm "$CODEX_PLUGIN_DIR/references"
  fi
  if [ -d "$CODEX_PLUGIN_DIR/references" ] && [ ! -L "$CODEX_PLUGIN_DIR/references" ]; then
    echo "  [WARN] .codex-plugin/references/ is a real directory. Skipping symlink."
  else
    ln -sf "$REFS_DIR" "$CODEX_PLUGIN_DIR/references"
    echo "  Linked:    .codex-plugin/references → $REFS_DIR"
  fi

  # AGENTS.md routing rules
  if [ -f "$ROUTING_FILE" ]; then
    if [ -f "$AGENTS_MD" ]; then
      if grep -qF "$AGENTS_MARKER" "$AGENTS_MD"; then
        echo "  AGENTS.md already contains routing rules. Skipping."
      else
        echo "" >> "$AGENTS_MD"
        cat "$ROUTING_FILE" >> "$AGENTS_MD"
        echo "  Routing rules appended to AGENTS.md"
      fi
    fi
  fi
fi

echo ""

# ==========================================================
# Summary
# ==========================================================
echo "Installation complete!"
echo ""
echo "Available skills:"
for skill_dir in "$SKILLS_DIR"/*/; do
  skill_name="$(basename "$skill_dir")"
  echo "  /$skill_name"
done
echo ""
echo "Claude Code: use /okr-gm, /okr-run, etc. in conversation"
echo "Codex CLI:   codex exec --full-auto -C $TARGET_DIR \"使用 okr-gm ...\""
