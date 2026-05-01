#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DoWithOKR Uninstall Script
# Removes OKR skills and routing rules from a target project
# for both Claude Code and Codex CLI.
# Usage: ./uninstall.sh [target_project_path]
# ============================================================

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="${1:-.}"
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

ROUTING_MARKER="## DoWithOKR Skill Routing"

echo "DoWithOKR Uninstaller"
echo "  Target project: $TARGET_DIR"
echo ""

# ==========================================================
# Claude Code
# ==========================================================
echo "── Claude Code ──"

COMMANDS_DIR="$TARGET_DIR/.claude/commands"
CLAUDE_MD="$TARGET_DIR/CLAUDE.md"

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
  echo "  $removed skill file(s) removed."
fi

# Remove runtime scripts and web assets
CC_DOWITHOKR="$TARGET_DIR/.claude/dowithokr"
if [ -d "$CC_DOWITHOKR" ]; then
  rm -rf "$CC_DOWITHOKR"
  echo "  Removed: .claude/dowithokr/"
fi

if [ -f "$CLAUDE_MD" ]; then
  if grep -qF "$ROUTING_MARKER" "$CLAUDE_MD"; then
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

    while [ -s "$tmp_file" ] && tail -1 "$tmp_file" | grep -q '^[[:space:]]*$'; do
      sed -i.bak '$ d' "$tmp_file"
      rm -f "$tmp_file.bak"
    done
    mv "$tmp_file" "$CLAUDE_MD"
    echo "  Removed routing rules from CLAUDE.md"
  else
    echo "  No routing rules found in CLAUDE.md. Skipping."
  fi
else
  echo "  No CLAUDE.md found. Skipping."
fi

echo ""

# ==========================================================
# Codex CLI
# ==========================================================
echo "── Codex CLI ──"

CODEX_PLUGIN_DIR="$TARGET_DIR/.codex-plugin"
AGENTS_MD="$TARGET_DIR/AGENTS.md"

if [ ! -d "$CODEX_PLUGIN_DIR" ]; then
  echo "  No .codex-plugin/ directory found. Skipping."
else
  # 只在 plugin.json 属于 DoWithOKR 时才清理
  should_clean=false
  if [ -f "$CODEX_PLUGIN_DIR/plugin.json" ]; then
    existing_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$CODEX_PLUGIN_DIR/plugin.json" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    if [ "$existing_name" = "dowithokr" ]; then
      should_clean=true
    else
      echo "  .codex-plugin/plugin.json belongs to '$existing_name'. Skipping."
    fi
  fi

  if [ "$should_clean" = true ]; then
    # 删除 symlinks
    if [ -L "$CODEX_PLUGIN_DIR/skills" ]; then
      rm "$CODEX_PLUGIN_DIR/skills"
      echo "  Removed: .codex-plugin/skills symlink"
    fi
    if [ -L "$CODEX_PLUGIN_DIR/references" ]; then
      rm "$CODEX_PLUGIN_DIR/references"
      echo "  Removed: .codex-plugin/references symlink"
    fi
    if [ -L "$CODEX_PLUGIN_DIR/scripts" ]; then
      rm "$CODEX_PLUGIN_DIR/scripts"
      echo "  Removed: .codex-plugin/scripts symlink"
    fi
    if [ -L "$CODEX_PLUGIN_DIR/web" ]; then
      rm "$CODEX_PLUGIN_DIR/web"
      echo "  Removed: .codex-plugin/web symlink"
    fi

    # 删除 plugin.json
    rm "$CODEX_PLUGIN_DIR/plugin.json"
    echo "  Removed: .codex-plugin/plugin.json"

    # 目录为空则删除
    if [ -d "$CODEX_PLUGIN_DIR" ] && [ -z "$(ls -A "$CODEX_PLUGIN_DIR")" ]; then
      rmdir "$CODEX_PLUGIN_DIR"
      echo "  Removed: .codex-plugin/ (empty)"
    fi
  fi

  # 清理 AGENTS.md 中的路由规则
  if [ -f "$AGENTS_MD" ]; then
    if grep -qF "$ROUTING_MARKER" "$AGENTS_MD"; then
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
      ' "$AGENTS_MD" > "$tmp_file"

      while [ -s "$tmp_file" ] && tail -1 "$tmp_file" | grep -q '^[[:space:]]*$'; do
        sed -i.bak '$ d' "$tmp_file"
        rm -f "$tmp_file.bak"
      done
      mv "$tmp_file" "$AGENTS_MD"
      echo "  Removed routing rules from AGENTS.md"
    fi
  fi
fi

echo ""
echo "Uninstall complete."
