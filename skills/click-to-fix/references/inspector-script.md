# Inspector Script — Annotated Reference

The inspector script is injected into the browser page via `web-interact click-to-fix`.
It creates a visual overlay, highlights elements on hover, and captures the clicked
element's source metadata.

This document explains each part of the script for debugging and extension.

## Architecture

```
┌────────────────────────────────────────────┐
│  Browser Page                              │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Banner: "INSPECT MODE — Click..."   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Overlay (z-index: max, crosshair)   │  │
│  │                                      │  │
│  │  mousemove → elementFromPoint →      │  │
│  │    highlight box + label             │  │
│  │                                      │  │
│  │  click → getSourceInfo(target) →     │  │
│  │    store in window.__clickToFixResult │  │
│  │    remove overlay + cleanup          │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────┐                      │
│  │  Highlight box   │ (follows hovered el) │
│  └──────────────────┘                      │
│  ┌────────┐                                │
│  │ Label  │ "Button ← Checkout.tsx:42"     │
│  └────────┘                                │
└────────────────────────────────────────────┘
```

## Visual overlay elements

The script creates 4 DOM elements:

| Element | z-index | Purpose |
|---------|---------|---------|
| `overlay` | 2147483646 | Full-screen click interceptor with `cursor: crosshair` |
| `highlight` | 2147483645 | Purple border + tinted background box that follows the hovered element |
| `label` | 2147483647 | Floating pill showing component name + source file |
| `banner` | 2147483647 | Top bar saying "INSPECT MODE" |

The overlay uses `pointer-events` toggling on mousemove:
1. Briefly disable pointer-events on overlay
2. Call `document.elementFromPoint(x, y)` to get the real element underneath
3. Re-enable pointer-events on overlay

This lets us detect hover targets while still intercepting clicks.

## Source extraction: `getSourceInfo(element)`

This function walks up the DOM and framework component trees to find source metadata.
It returns a structured object with all discoverable info about the element.

### Return shape

```typescript
interface ClickToFixResult {
  tag: string;              // "button", "div", "input", etc.
  id: string | null;        // Element id attribute
  classes: string[];         // CSS class list
  text: string;             // Text content (truncated to 120 chars)
  attributes: Record<string, string>;  // data-*, aria-label, role, name, placeholder, type, href
  source: {                 // Framework source metadata (null if unavailable)
    file: string;           // Absolute or relative file path
    line: number | null;    // Line number (1-based)
    column: number | null;  // Column number
  } | null;
  component: string | null; // Component/function name
  outerSnippet: string;     // First 300 chars of outerHTML
}
```

### React extraction

React attaches internal fiber nodes to DOM elements using keys like
`__reactFiber$xxxx` or `__reactInternalInstance$xxxx` (the suffix is a random hash).

```javascript
// Find the fiber
let fiber = null;
for (const key of Object.keys(element)) {
  if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
    fiber = element[key];
    break;
  }
}
```

Once we have the fiber, walk UP the fiber tree via `.return` looking for `_debugSource`:

```javascript
let current = fiber;
while (current) {
  if (current._debugSource) {
    // Found it! _debugSource has: { fileName, lineNumber, columnNumber }
    result.source = {
      file: current._debugSource.fileName,
      line: current._debugSource.lineNumber,
      column: current._debugSource.columnNumber
    };
    // Get component name from fiber.type
    if (current.type) {
      result.component = typeof current.type === 'string'
        ? current.type  // HTML element
        : (current.type.displayName || current.type.name || null);
    }
    break;
  }
  current = current.return; // Walk up to parent fiber
}
```

**Important**: `_debugSource` is only available when:
- The app is built in development mode
- The React JSX transform includes source info (default in dev with Babel/SWC/esbuild)
- React 16.12+ (fiber architecture)

For React 19+, `_debugSource` may be replaced by a different mechanism. The script
also walks up looking for function components to extract the component name as fallback.

### Vue extraction

Vue 3 attaches `__vueParentComponent` to root elements of each component instance.

```javascript
let el = element;
while (el) {
  if (el.__vueParentComponent) {
    const comp = el.__vueParentComponent;
    result.component = comp.type?.name || comp.type?.__name || null;
    if (comp.type?.__file) {
      result.source = { file: comp.type.__file, line: null, column: null };
    }
    break;
  }
  el = el.parentElement;
}
```

**Notes**:
- `__file` is injected by `vue-loader` or `@vitejs/plugin-vue` in dev mode
- Vue 2 uses `__vue__` instead of `__vueParentComponent`
- Line numbers are NOT available from Vue's runtime metadata (only the file path)
- To get line-level precision in Vue, use the fallback search for template content

### Svelte extraction

Svelte injects `__svelte_meta` on component root elements in dev mode.

```javascript
let el = element;
while (el) {
  if (el.__svelte_meta) {
    const meta = el.__svelte_meta;
    result.source = {
      file: meta.loc?.file || null,
      line: meta.loc?.line || null,
      column: meta.loc?.column || null
    };
    // Derive component name from filename
    const fn = meta.loc?.file;
    result.component = fn ? fn.split('/').pop().replace('.svelte', '') : null;
    break;
  }
  el = el.parentElement;
}
```

**Notes**:
- Available in Svelte 3 and 4 dev mode
- Svelte 5 (runes) may use a different mechanism — check `$inspect` or compiler output
- Provides file AND line number — most complete metadata of any framework

### Angular extraction

Angular exposes debug utilities globally when in dev mode (`ng.probe` for Ivy, `ng.getComponent`).

```javascript
try {
  if (typeof ng !== 'undefined' && ng.getComponent) {
    const comp = ng.getComponent(element);
    if (comp) {
      result.component = comp.constructor?.name || null;
    }
  }
} catch (e) { /* not Angular or prod mode */ }
```

**Notes**:
- Angular does NOT expose source file paths at runtime, even in dev mode
- Only the component class name is available
- Use the component name with the fallback codebase search to find the `.ts` file
- `ng.getComponent` requires Angular Ivy renderer (Angular 9+)

## Framework detection priority

The script checks frameworks in this order:
1. **React** — most common, has the richest metadata (`_debugSource` with file + line)
2. **Vue** — second most common, has file path but not line number
3. **Svelte** — has full source location (file + line + column)
4. **Angular** — only has component class name, no file path

If none match, the fallback metadata (tag, classes, text, attributes, outerHTML) is used
for codebase search. See `source-resolver.md`.

## Global state

| Variable | Purpose |
|----------|---------|
| `window.__clickToFixActive` | Boolean flag — prevents double-injection |
| `window.__clickToFixResult` | The result object — null until user clicks, then populated |

## Cleanup

To remove the inspector without a click (e.g., user wants to cancel):

```javascript
['__ctf-overlay', '__ctf-highlight', '__ctf-label'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.remove();
});
window.__clickToFixActive = false;
window.__clickToFixResult = undefined;
```
