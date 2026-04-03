<div align="center">

<img src="assets/github-banner.png" alt="web-interact — Coding Agents Surf The Web" width="100%" />

<br />

**Claude Code plugin for [web-interact](https://github.com/johnkozaris/web-interact)**

[![Plugin](https://img.shields.io/badge/Claude_Code-plugin-7c3aed)](https://github.com/johnkozaris/web-interact-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

Give Claude Code the ability to open pages, discover elements, click buttons, fill forms, take screenshots, and extract data — all through the `web-interact` CLI. Claude knows when to use it automatically based on what you ask.

---

## Install the plugin

```
/plugin marketplace add johnkozaris/web-interact-plugin
```

## Install the CLI

The plugin needs the `web-interact` CLI installed separately:

```bash
# npm (recommended)
npm install -g web-interact

# Shell installer (macOS/Linux)
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.sh | sh

# PowerShell (Windows)
powershell -ExecutionPolicy ByPass -c "irm https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.ps1 | iex"
```

Runtime (Playwright + Chrome) auto-installs on first run. If the CLI is missing, Claude will detect it and prompt you.

---

## What you get

### `/web-interact` skill
Claude auto-invokes this when you ask to interact with a website. Covers 40+ commands: navigate, discover elements, click, fill, screenshot, eval, network mocking, storage, and more.

**Trigger phrases:** *"go to"*, *"open"*, *"click"*, *"fill out"*, *"screenshot"*, *"scrape"*, *"test the website"*, *"log into"*, *"navigate to"*

### `/mode` command
Switch the browser engine:

| Mode | Engine | What it does |
|------|--------|-------------|
| `default` | Playwright | Standard automation |
| `assistant` | Patchright | Removes automation flags, auto-humanized delays |

### `/browser-mode` command
Switch how the browser connects:

| Mode | What it does |
|------|-------------|
| `auto` | CLI decides (default) |
| `real` | Connect to your running Chrome/Edge |
| `sandbox` | Managed browser with persistent profile |

### Reference docs
Detailed documentation loaded on demand:

| File | Contents |
|------|----------|
| `commands.md` | Full command reference with all flags |
| `patterns.md` | Login, forms, search, e-commerce, mocking |
| `advanced-interactions.md` | SPAs, dropdowns, date pickers, shadow DOM, canvas |
| `scripting.md` | Script mode API with loops and conditionals |
| `troubleshooting.md` | Common problems and fixes |

---

## Authors

[**John Kozaris**](https://github.com/johnkozaris)

[**Edoardo Re**](https://github.com/edoardorex)

## License

MIT
