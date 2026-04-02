# web-interact plugin

Claude Code plugin for [web-interact](https://github.com/johnkozaris/web-interact) — browser automation CLI for AI agents.

## Install

In Claude Code, run:
```
/plugin marketplace add johnkozaris/web-interact-plugin
/plugin install web-interact@web-interact-plugin
```

## Prerequisites

The `web-interact` CLI must be installed separately. Install via one of:

```bash
# npm (recommended — works on macOS, Linux, Windows)
npm install -g web-interact

# Shell installer (macOS/Linux)
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.sh | sh

# PowerShell installer (Windows)
powershell -ExecutionPolicy ByPass -c "irm https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.ps1 | iex"

# Cargo (if you have Rust)
cargo install web-interact

# Build from source
git clone https://github.com/johnkozaris/web-interact.git
cd web-interact && ./setup.sh
```

The CLI auto-installs its runtime (Patchright + Chrome) on first run — no separate step needed after install.

> **Note:** If the CLI is not installed, Claude will detect this and prompt you with installation instructions before proceeding.

## What this plugin provides

### `web-interact` skill
Browser automation CLI for navigating websites, filling forms, clicking buttons, extracting data, taking screenshots, and automating any web workflow — undetected. Uses real Chrome via Patchright.

**Trigger phrases**: "go to", "open", "click", "fill out", "screenshot", "scrape", "automate", "test the website", "log into", "navigate to", or any browser interaction.

### `click-to-fix` skill
Click any element in the browser to trace it back to its source code file and line number. Opens a visual inspector overlay, lets you click an element, then extracts framework dev-mode source metadata to jump straight to the code.

**How it works:**
1. Opens your app in the browser with a purple inspector overlay
2. Hover over elements to see their component name and source file
3. Click the element you want to fix
4. Claude opens the source file and asks what you'd like to change

**Supports:** React (`_debugSource`), Vue (`__file`), Svelte (`__svelte_meta`), Angular (`ng.getComponent`). Falls back to intelligent codebase search (data-testid, CSS classes, text content, ARIA labels) when framework metadata is unavailable.

**Trigger phrases**: "click to fix", "inspect element", "find component", "trace element", "locate source", "where is this component", "fix this element".

### Reference docs
Command reference, workflow patterns, advanced interactions, scripting API, troubleshooting, inspector script internals, and source resolver strategies.

## Author

John Kozaris (ioanniskozaris@gmail.com)

## License

MIT
