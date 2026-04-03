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

The CLI auto-installs its runtime (Playwright + Chrome) on first run — no separate step needed after install.

> **Note:** If the CLI is not installed, Claude will detect this and prompt you with installation instructions before proceeding.

## What this plugin provides

- **Skill**: `web-interact` — tells Claude when and how to use the browser automation CLI
- **Skill**: `/mode` — switch engine between default (Playwright) and assistant (Patchright)
- **Skill**: `/browser-mode` — switch browser connection: auto, real (your browser), or sandbox
- **Reference docs**: command reference, workflow patterns, advanced interactions, scripting API, troubleshooting

## Author

John Kozaris (ioanniskozaris@gmail.com)

## License

MIT
