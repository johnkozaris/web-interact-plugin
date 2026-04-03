---
name: click-to-fix
description: >
  Click any element in the browser to trace it back to its source code component.
  The user visually clicks an element in their browser, and the CLI returns metadata
  (component name, source file, line number) that you use to locate and open the code.
  Trigger phrases: "click to fix", "inspect element", "find component", "trace element",
  "locate source", "where is this component", "fix this element", "click-to-fix",
  "which file is this", "find the code for this button", "click to source".
---

# click-to-fix

Let the user click any element in their browser to trace it back to its source code.

**This is a user-interactive command.** You run it, then the USER physically clicks
an element in their browser. The command blocks until they click (up to 2 minutes).
Do NOT poll or retry — just run the command and wait for the result.

## Workflow

### Step 1 — Make sure a page is open

The user's app must be running in a browser. If not already open:

```bash
web-interact open "http://localhost:3000"
# Or connect to the user's running browser:
web-interact --own-browser discover
```

For best results, the app should be running in **development mode** (React/Vue/Svelte
dev builds include source metadata that gives exact file + line number).

### Step 2 — Run click-to-fix

```bash
web-interact click-to-fix
```

Tell the user:

> **Inspect mode is active.** A purple overlay is now visible in the browser.
> Hover over elements to see their component name and source file.
> **Click the element you want to fix.**

The command blocks until the user clicks. Do NOT interrupt it — wait for the JSON result.

### Step 3 — Parse the result

The command outputs JSON like:

```json
{
  "tag": "button",
  "id": "submit-btn",
  "classes": ["btn", "btn-primary"],
  "text": "Submit Order",
  "attributes": { "data-testid": "checkout-submit" },
  "source": { "file": "src/components/Checkout/SubmitButton.tsx", "line": 42, "column": 8 },
  "component": "SubmitButton",
  "outerSnippet": "<button class=\"btn btn-primary\">Submit Order</button>"
}
```

### Step 4 — Locate and open the source

**If `source.file` exists** (framework dev metadata found):
1. Read the file at the reported line number (±15 lines for context)
2. Show the user the component and ask what they'd like to change

**If `source` is null** (production build or unsupported framework):
1. Use `component` name to search: `grep -r "function ComponentName\|const ComponentName" src/`
2. Use `data-testid` or unique CSS classes to search: `grep -r "data-testid=\"value\"" src/`
3. Use text content: `grep -r "Submit Order" src/`
4. See `references/source-resolver.md` for detailed fallback strategies

### Step 5 — Ask what to fix

Present the source code to the user and ask:
**"What would you like to change or fix in this component?"**

## Important notes

- **User clicks, not you.** This command puts the browser in inspect mode and waits for the USER to click.
- **Dev mode gives best results.** React, Vue, Svelte strip source metadata in production builds.
- **Do NOT use --headless.** The user must see and interact with the browser.
- If the user wants to cancel, the command times out after 2 minutes.

## References

| File | Contents |
|------|----------|
| `references/inspector-script.md` | How the inspector overlay works and how each framework's metadata is extracted |
| `references/source-resolver.md` | Fallback codebase search strategies when framework metadata is unavailable |
