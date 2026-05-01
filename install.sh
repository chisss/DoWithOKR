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

# Runtime scripts for okr-run-web
CC_SCRIPTS_DIR="$TARGET_DIR/.claude/dowithokr/scripts"
CC_WEB_DIR="$TARGET_DIR/.claude/dowithokr/web/okr-run-web"
mkdir -p "$CC_SCRIPTS_DIR" "$CC_WEB_DIR"
for f in "$PLUGIN_DIR"/scripts/okr-run-web*.mjs; do
  [ -f "$f" ] || continue
  cp "$f" "$CC_SCRIPTS_DIR/"
  echo "  Installed: .claude/dowithokr/scripts/$(basename "$f")"
done
if [ -d "$PLUGIN_DIR/web/okr-run-web" ]; then
  cp "$PLUGIN_DIR"/web/okr-run-web/* "$CC_WEB_DIR/" 2>/dev/null || true
  echo "  Installed: .claude/dowithokr/web/okr-run-web/"
fi

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
# Codex CLI — repo-local marketplace + plugin registration
# ==========================================================
echo "── Codex CLI ──"

CODEX_PLUGIN_JSON="$PLUGIN_DIR/.codex-plugin/plugin.json"
AGENTS_MD="$TARGET_DIR/AGENTS.md"
AGENTS_MARKER="## DoWithOKR Skill Routing"

# Codex discovers plugins via .agents/plugins/marketplace.json
AGENTS_PLUGINS_DIR="$TARGET_DIR/.agents/plugins"
MARKETPLACE_JSON="$AGENTS_PLUGINS_DIR/marketplace.json"
CODEX_LOCAL_PLUGIN="$AGENTS_PLUGINS_DIR/plugins/dowithokr"

if [ ! -f "$CODEX_PLUGIN_JSON" ]; then
  echo "  [WARN] Source .codex-plugin/plugin.json not found. Skipping Codex install."
else
  # --- marketplace.json ---
  mkdir -p "$AGENTS_PLUGINS_DIR/plugins"

  if [ -f "$MARKETPLACE_JSON" ]; then
    if grep -q '"dowithokr"' "$MARKETPLACE_JSON"; then
      echo "  marketplace.json already contains dowithokr. Updating plugin files."
    else
      # Append dowithokr entry to existing marketplace plugins array
      tmp_file="$(mktemp)"
      python3 -c "
import json, sys
with open('$MARKETPLACE_JSON') as f:
    data = json.load(f)
entry = {
    'name': 'dowithokr',
    'source': {'source': 'local', 'path': './plugins/dowithokr'},
    'policy': {'installation': 'AVAILABLE'},
    'category': 'Productivity'
}
data.setdefault('plugins', []).append(entry)
json.dump(data, sys.stdout, indent=2, ensure_ascii=False)
" > "$tmp_file" && mv "$tmp_file" "$MARKETPLACE_JSON"
      echo "  Added dowithokr to existing marketplace.json"
    fi
  else
    cat > "$MARKETPLACE_JSON" << 'MKJSON'
{
  "name": "project-local",
  "interface": {
    "displayName": "Project Local Plugins"
  },
  "plugins": [
    {
      "name": "dowithokr",
      "source": {
        "source": "local",
        "path": "./plugins/dowithokr"
      },
      "policy": {
        "installation": "AVAILABLE"
      },
      "category": "Productivity"
    }
  ]
}
MKJSON
    echo "  Created: .agents/plugins/marketplace.json"
  fi

  # --- plugin directory with .codex-plugin/plugin.json ---
  mkdir -p "$CODEX_LOCAL_PLUGIN/.codex-plugin"
  cp "$CODEX_PLUGIN_JSON" "$CODEX_LOCAL_PLUGIN/.codex-plugin/plugin.json"
  echo "  Installed: .agents/plugins/plugins/dowithokr/.codex-plugin/plugin.json"

  # symlink helper: create or refresh a symlink
  link_resource() {
    local name="$1"
    local src="$2"
    local dest="$CODEX_LOCAL_PLUGIN/$name"
    if [ -L "$dest" ]; then rm "$dest"; fi
    if [ -d "$dest" ] && [ ! -L "$dest" ]; then
      echo "  [WARN] $name is a real directory. Skipping symlink."
      return
    fi
    ln -sf "$src" "$dest"
    echo "  Linked:    .agents/.../dowithokr/$name → $src"
  }

  link_resource "skills"     "$SKILLS_DIR"
  link_resource "references" "$REFS_DIR"
  link_resource "scripts"    "$PLUGIN_DIR/scripts"
  link_resource "web"        "$PLUGIN_DIR/web"

  # --- Legacy .codex-plugin/ (keep for backward compat) ---
  CODEX_PLUGIN_DIR="$TARGET_DIR/.codex-plugin"
  if [ -d "$CODEX_PLUGIN_DIR" ]; then
    if [ -f "$CODEX_PLUGIN_DIR/plugin.json" ]; then
      existing_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$CODEX_PLUGIN_DIR/plugin.json" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
      if [ "$existing_name" = "dowithokr" ]; then
        echo "  Cleaning legacy .codex-plugin/ (migrated to .agents/plugins/)"
        rm -f "$CODEX_PLUGIN_DIR/plugin.json"
        for lnk in skills references scripts web; do
          [ -L "$CODEX_PLUGIN_DIR/$lnk" ] && rm "$CODEX_PLUGIN_DIR/$lnk"
        done
        [ -d "$CODEX_PLUGIN_DIR" ] && [ -z "$(ls -A "$CODEX_PLUGIN_DIR")" ] && rmdir "$CODEX_PLUGIN_DIR"
      fi
    fi
  fi

  # --- AGENTS.md routing rules ---
  if [ -f "$ROUTING_FILE" ]; then
    if [ -f "$AGENTS_MD" ]; then
      if grep -qF "$AGENTS_MARKER" "$AGENTS_MD"; then
        echo "  AGENTS.md already contains routing rules. Skipping."
      else
        echo "" >> "$AGENTS_MD"
        cat "$ROUTING_FILE" >> "$AGENTS_MD"
        echo "  Routing rules appended to AGENTS.md"
      fi
    else
      cat "$ROUTING_FILE" > "$AGENTS_MD"
      echo "  Created AGENTS.md with routing rules"
    fi
  fi

  # --- Register marketplace and enable plugin in Codex ---
  if command -v codex >/dev/null 2>&1; then
    MARKETPLACE_NAME=$(python3 -c "
import json
with open('$MARKETPLACE_JSON') as f:
    print(json.load(f).get('name', 'project-local'))
" 2>/dev/null || echo "project-local")

    # Check if marketplace already registered
    if grep -qF "[marketplaces.$MARKETPLACE_NAME]" "$HOME/.codex/config.toml" 2>/dev/null; then
      echo "  Codex marketplace '$MARKETPLACE_NAME' already registered."
    else
      codex plugin marketplace add "$TARGET_DIR" 2>/dev/null && \
        echo "  Registered Codex marketplace: $MARKETPLACE_NAME → $TARGET_DIR" || \
        echo "  [WARN] Failed to register Codex marketplace. Run manually: codex plugin marketplace add $TARGET_DIR"
    fi

    # Enable plugin
    PLUGIN_KEY="dowithokr@$MARKETPLACE_NAME"
    if grep -qF "[plugins.\"$PLUGIN_KEY\"]" "$HOME/.codex/config.toml" 2>/dev/null; then
      echo "  Codex plugin '$PLUGIN_KEY' already enabled."
    else
      CODEX_CONFIG="$HOME/.codex/config.toml"
      if [ -f "$CODEX_CONFIG" ]; then
        printf '\n[plugins."%s"]\nenabled = true\n' "$PLUGIN_KEY" >> "$CODEX_CONFIG"
        echo "  Enabled Codex plugin: $PLUGIN_KEY"
      fi
    fi
  else
    echo "  [INFO] Codex CLI not found. Skipping marketplace registration."
    echo "         Install Codex, then run: codex plugin marketplace add $TARGET_DIR"
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
