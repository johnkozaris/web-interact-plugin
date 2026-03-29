# web-interact plugin

Claude Code plugin for [web-interact](https://github.com/johnkozaris/web-interact) — browser automation CLI for AI agents.

## Install

In Claude Code, run:
```
/plugin marketplace add johnkozaris/web-interact-plugin
/plugin install web-interact@web-interact-plugin
```

## Prerequisites

The `web-interact` CLI must be installed:

```bash
npm install -g web-interact
```

Or build from source:
```bash
git clone https://github.com/johnkozaris/web-interact.git
cd web-interact && ./setup.sh
```

The CLI auto-installs its runtime on first run.

## What this plugin provides

- **Skill**: `web-interact` — tells Claude when and how to use the browser automation CLI
- **Reference docs**: command reference, workflow patterns, advanced interactions, scripting API, troubleshooting

## Author

John Kozaris (ioanniskozaris@gmail.com)

## License

MIT
