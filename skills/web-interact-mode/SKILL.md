---
name: web-interact-mode
description: >
  Show or switch the web-interact browser engine between default (Playwright)
  and assistant (Patchright). Use when the user asks to change browser mode,
  enable stealth/assistant mode, or check which engine is active.
disable-model-invocation: true
---

# web-interact-mode

Switch the browser engine used by web-interact.

## Usage

```bash
# Show current mode
web-interact mode

# Switch to default (Playwright — standard automation)
web-interact mode default

# Switch to assistant (Patchright — removes automation flags)
web-interact mode assistant
```

## Modes

| Mode | Engine | Automation banner | Humanize | Best for |
|------|--------|-------------------|----------|----------|
| `default` | Playwright | Visible | Off (use `--humanize` to enable) | Your own apps, testing, development |
| `assistant` | Patchright | Hidden | Auto-enabled | Sites with bot detection, login flows |

**Assistant mode auto-enables `--humanize`**: natural random delays between clicks (80-400ms),
keystrokes (30-90ms per char), and form actions. This makes interactions look human-like.
You can also use `--humanize` with default mode on any command.

## What happens on switch

1. Running daemon and browsers are stopped
2. `~/.web-interact/` is cleaned (full reset)
3. Mode is saved to `~/.web-interact/mode`
4. Next command auto-reinstalls the correct engine

The switch takes a few seconds. No manual setup needed after.
