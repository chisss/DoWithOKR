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

AGENTS_MD="$TARGET_DIR/AGENTS.md"

# --- Clean repo-local marketplace plugin ---
AGENTS_PLUGINS_DIR="$TARGET_DIR/.agents/plugins"
MARKETPLACE_JSON="$AGENTS_PLUGINS_DIR/marketplace.json"
CODEX_LOCAL_PLUGIN="$AGENTS_PLUGINS_DIR/plugins/dowithokr"

if [ -d "$CODEX_LOCAL_PLUGIN" ]; then
  rm -rf "$CODEX_LOCAL_PLUGIN"
  echo "  Removed: .agents/plugins/plugins/dowithokr/"
fi

# Remove empty plugins/ dir
if [ -d "$AGENTS_PLUGINS_DIR/plugins" ] && [ -z "$(ls -A "$AGENTS_PLUGINS_DIR/plugins")" ]; then
  rmdir "$AGENTS_PLUGINS_DIR/plugins"
fi

if [ -f "$MARKETPLACE_JSON" ]; then
  if grep -q '"dowithokr"' "$MARKETPLACE_JSON"; then
    # Count plugins in marketplace
    plugin_count=$(python3 -c "
import json
with open('$MARKETPLACE_JSON') as f:
    data = json.load(f)
print(len(data.get('plugins', [])))
" 2>/dev/null || echo "0")

    if [ "$plugin_count" = "1" ]; then
      rm "$MARKETPLACE_JSON"
      echo "  Removed: .agents/plugins/marketplace.json (was only dowithokr)"
      # Remove empty dirs
      [ -d "$AGENTS_PLUGINS_DIR" ] && [ -z "$(ls -A "$AGENTS_PLUGINS_DIR")" ] && rmdir "$AGENTS_PLUGINS_DIR"
      [ -d "$TARGET_DIR/.agents" ] && [ -z "$(ls -A "$TARGET_DIR/.agents")" ] && rmdir "$TARGET_DIR/.agents"
    else
      tmp_file="$(mktemp)"
      python3 -c "
import json, sys
with open('$MARKETPLACE_JSON') as f:
    data = json.load(f)
data['plugins'] = [p for p in data.get('plugins', []) if p.get('name') != 'dowithokr']
json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
" > "$tmp_file" && mv "$tmp_file" "$MARKETPLACE_JSON"
      echo "  Removed dowithokr from marketplace.json (other plugins remain)"
    fi
  else
    echo "  marketplace.json does not contain dowithokr. Skipping."
  fi
fi

# --- Clean legacy .codex-plugin/ ---
CODEX_PLUGIN_DIR="$TARGET_DIR/.codex-plugin"

if [ -d "$CODEX_PLUGIN_DIR" ]; then
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
    for lnk in skills references scripts web; do
      [ -L "$CODEX_PLUGIN_DIR/$lnk" ] && rm "$CODEX_PLUGIN_DIR/$lnk" && echo "  Removed: .codex-plugin/$lnk symlink"
    done
    rm -f "$CODEX_PLUGIN_DIR/plugin.json"
    echo "  Removed: .codex-plugin/plugin.json"
    [ -d "$CODEX_PLUGIN_DIR" ] && [ -z "$(ls -A "$CODEX_PLUGIN_DIR")" ] && rmdir "$CODEX_PLUGIN_DIR" && echo "  Removed: .codex-plugin/ (empty)"
  fi
else
  echo "  No .codex-plugin/ directory found."
fi

# --- Clean AGENTS.md routing rules ---
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

    # If AGENTS.md is now empty, remove it
    if [ ! -s "$tmp_file" ]; then
      rm "$AGENTS_MD" "$tmp_file"
      echo "  Removed AGENTS.md (was only DoWithOKR content)"
    else
      mv "$tmp_file" "$AGENTS_MD"
      echo "  Removed routing rules from AGENTS.md"
    fi
  fi
fi

# --- Deregister from Codex config.toml ---
if command -v codex >/dev/null 2>&1; then
  CODEX_CONFIG="$HOME/.codex/config.toml"
  if [ -f "$CODEX_CONFIG" ]; then
    MARKETPLACE_NAME="project-local"
    if [ -f "$MARKETPLACE_JSON" ]; then
      MARKETPLACE_NAME=$(python3 -c "
import json
with open('$MARKETPLACE_JSON') as f:
    print(json.load(f).get('name', 'project-local'))
" 2>/dev/null || echo "project-local")
    fi

    PLUGIN_KEY="dowithokr@$MARKETPLACE_NAME"
    changed=false

    if grep -qF "[plugins.\"$PLUGIN_KEY\"]" "$CODEX_CONFIG"; then
      tmp_file="$(mktemp)"
      python3 -c "
import re, sys
with open('$CODEX_CONFIG') as f:
    content = f.read()
pattern = r'\n?\[plugins\.\"dowithokr@[^\"]*\"\]\s*\nenabled\s*=\s*\w+\s*\n?'
content = re.sub(pattern, '\n', content)
sys.stdout.write(content)
" > "$tmp_file" && mv "$tmp_file" "$CODEX_CONFIG"
      echo "  Removed plugin '$PLUGIN_KEY' from config.toml"
      changed=true
    fi

    if grep -qF "[marketplaces.$MARKETPLACE_NAME]" "$CODEX_CONFIG"; then
      codex plugin marketplace remove "$MARKETPLACE_NAME" 2>/dev/null && \
        echo "  Removed marketplace '$MARKETPLACE_NAME' from config.toml" || \
        echo "  [WARN] Failed to remove marketplace. Run: codex plugin marketplace remove $MARKETPLACE_NAME"
      changed=true
    fi

    if [ "$changed" = false ]; then
      echo "  No Codex config.toml entries to clean."
    fi
  fi
else
  echo "  [INFO] Codex CLI not found. Skipping config.toml cleanup."
fi

echo ""
echo "Uninstall complete."
