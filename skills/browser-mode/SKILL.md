---
name: browser-mode
description: >
  Show or switch how web-interact connects to the browser: auto (CLI decides),
  real (user's running Chrome/Edge), or sandbox (managed browser with persistent profile).
disable-model-invocation: true
---

# browser-mode

Choose how web-interact connects to the browser.

## Usage

```bash
# Show current browser mode
web-interact browser-mode

# Let the CLI decide (default)
web-interact browser-mode auto

# Connect to your running Chrome/Edge
web-interact browser-mode real

# Use a managed browser with persistent profile
web-interact browser-mode sandbox
```

## Modes

| Mode | What it does | Best for |
|------|-------------|----------|
| `auto` | CLI decides — launches managed browser with system Chrome/Edge | General use (default) |
| `real` | Connects to your already-running browser | Using existing logins, cookies, extensions |
| `sandbox` | Launches isolated managed browser, profile saved in `~/.web-interact/` | Clean automation, testing |

## Notes

- `real` mode requires Chrome/Edge to be running with remote debugging enabled, or discoverable via DevToolsActivePort.
- `sandbox` profile persists across sessions in `~/.web-interact/browsers/` — cookies and localStorage survive restarts.
- Setting is saved to `~/.web-interact/browser-mode` and persists until changed.
- Per-command override: `--own-browser` or `--connect [URL]` flags override the saved mode.
