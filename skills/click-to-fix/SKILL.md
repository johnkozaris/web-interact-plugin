---
name: click-to-fix
description: >
  Click any element in the browser to trace it back to its source code component.
  Opens the browser in inspect mode, lets the user click an element, extracts the
  component name and file location from React/Vue/Svelte/Angular dev metadata,
  then opens the source file for the user to review and fix.
  Trigger phrases: "click to fix", "inspect element", "find component", "trace element",
  "locate source", "where is this component", "fix this element", "click-to-fix",
  "which file is this", "find the code for this button", "click to source".
  Use when users want to visually identify a UI element in their running app and
  jump straight to its source code to make a change or fix a bug.
---

# click-to-fix

Visually click any element in the browser to trace it back to its source code file and line number.
Uses framework dev-mode metadata (React `_debugSource`, Vue `__file`, Svelte `__svelte_meta`, Angular `ng`) with
intelligent codebase-search fallback.

## Prerequisites

- The target app MUST be running in **development mode** (not a production build) for
  framework source metadata to be available. If the app is a production build, only the
  fallback codebase-search strategy will work.
- `web-interact` CLI must be installed. Verify with `web-interact --version`.
- The app must be accessible in a browser (localhost, staging URL, etc.).

## Workflow

### Step 1 — Open the app in the browser

If a browser session is already open to the target page, skip this step.
Otherwise open the page. Use headed mode (no `--headless`) so the user can interact.

```bash
# If the user has a local dev server running:
web-interact open "http://localhost:3000"

# Or connect to an already-open Chrome:
web-interact --connect open "http://localhost:3000"
```

### Step 2 — Inject the inspector overlay

Inject the inspector script into the page. This adds a visual overlay that highlights
elements on hover and captures click targets.

```bash
web-interact eval "(function(){if(window.__clickToFixActive)return 'already active';var overlay=document.createElement('div');overlay.id='__ctf-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;cursor:crosshair;';document.body.appendChild(overlay);var highlight=document.createElement('div');highlight.id='__ctf-highlight';highlight.style.cssText='position:fixed;border:2px solid #6366f1;background:rgba(99,102,241,0.08);pointer-events:none;z-index:2147483645;display:none;border-radius:3px;transition:all 0.05s ease;';document.body.appendChild(highlight);var label=document.createElement('div');label.id='__ctf-label';label.style.cssText='position:fixed;background:#6366f1;color:#fff;font:bold 11px/1.4 ui-monospace,monospace;padding:2px 8px;border-radius:4px;z-index:2147483647;pointer-events:none;display:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);';document.body.appendChild(label);var banner=document.createElement('div');banner.style.cssText='position:fixed;top:0;left:0;right:0;background:#6366f1;color:#fff;font:bold 14px/1 system-ui,sans-serif;padding:10px 16px;z-index:2147483647;text-align:center;pointer-events:none;';banner.textContent='INSPECT MODE — Click any element to trace its source code';document.body.appendChild(banner);function getSourceInfo(el){var result={tag:el.tagName.toLowerCase(),id:el.id||null,classes:Array.from(el.classList),text:(el.textContent||'').trim().substring(0,120),attributes:{},source:null,component:null,outerSnippet:el.outerHTML.substring(0,300)};for(var i=0;i<el.attributes.length;i++){var a=el.attributes[i];if(a.name.startsWith('data-')||a.name==='aria-label'||a.name==='role'||a.name==='name'||a.name==='placeholder'||a.name==='type'||a.name==='href')result.attributes[a.name]=a.value}var fiber=null;for(var key of Object.keys(el)){if(key.startsWith('__reactFiber$')||key.startsWith('__reactInternalInstance$')){fiber=el[key];break}}if(fiber){var current=fiber;while(current){if(current._debugSource){result.source={file:current._debugSource.fileName,line:current._debugSource.lineNumber,column:current._debugSource.columnNumber};if(current.type){result.component=typeof current.type==='string'?current.type:(current.type.displayName||current.type.name||null)}break}if(current.return)current=current.return;else break}if(!result.component&&fiber){var c=fiber;while(c){if(c.type&&typeof c.type==='function'){result.component=c.type.displayName||c.type.name||null;if(result.component)break}if(c.return)c=c.return;else break}}}if(!result.source){var ve=el;while(ve){if(ve.__vueParentComponent){var comp=ve.__vueParentComponent;result.component=comp.type&&(comp.type.name||comp.type.__name)||null;if(comp.type&&comp.type.__file)result.source={file:comp.type.__file,line:null,column:null};break}ve=ve.parentElement}}if(!result.source){var se=el;while(se){if(se.__svelte_meta){var meta=se.__svelte_meta;result.source={file:meta.loc&&meta.loc.file||null,line:meta.loc&&meta.loc.line||null,column:meta.loc&&meta.loc.column||null};var fn=meta.loc&&meta.loc.file;result.component=fn?fn.split('/').pop().replace('.svelte',''):null;break}se=se.parentElement}}if(!result.source){try{if(typeof ng!=='undefined'&&ng.getComponent){var ac=ng.getComponent(el);if(ac)result.component=ac.constructor&&ac.constructor.name||null}}catch(e){}}return result}overlay.addEventListener('mousemove',function(e){overlay.style.pointerEvents='none';var target=document.elementFromPoint(e.clientX,e.clientY);overlay.style.pointerEvents='';if(!target||target===overlay||target===highlight||target===label||target===banner)return;var rect=target.getBoundingClientRect();highlight.style.display='block';highlight.style.top=rect.top+'px';highlight.style.left=rect.left+'px';highlight.style.width=rect.width+'px';highlight.style.height=rect.height+'px';var info=getSourceInfo(target);var txt=info.component||info.tag;if(info.source&&info.source.file){var short=info.source.file.split('/').slice(-2).join('/');txt+=' \u2190 '+short;if(info.source.line)txt+=':'+info.source.line}label.style.display='block';label.style.top=Math.max(0,rect.top-24)+'px';label.style.left=rect.left+'px';label.textContent=txt});overlay.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();overlay.style.pointerEvents='none';var target=document.elementFromPoint(e.clientX,e.clientY);overlay.style.pointerEvents='';if(!target||target===overlay||target===highlight||target===label||target===banner)target=document.body;var info=getSourceInfo(target);window.__clickToFixResult=info;overlay.remove();highlight.remove();label.remove();banner.remove();window.__clickToFixActive=false});window.__clickToFixActive=true;return 'Inspector activated — click any element'})()"
```

After injecting, tell the user:

> **Inspect mode is active.** A purple overlay is now visible in the browser.
> Hover over elements to see their component name and source file.
> **Click the element you want to fix.**

### Step 3 — Wait for the user to click, then retrieve the result

Poll for the click result. The user needs time to find and click the element.

```bash
# Wait a few seconds for the user to click, then check
web-interact eval "JSON.stringify(window.__clickToFixResult || null)"
```

If the result is `null`, the user hasn't clicked yet. Wait a moment and poll again.
Ask the user if they've clicked. Do NOT poll in a tight loop — wait 3-5 seconds between checks,
or better yet, ask the user to confirm they've clicked before polling.

### Step 4 — Parse the result and locate the source

The result is a JSON object with this shape:

```json
{
  "tag": "button",
  "id": "submit-btn",
  "classes": ["btn", "btn-primary"],
  "text": "Submit Order",
  "attributes": { "data-testid": "checkout-submit", "aria-label": "Submit your order" },
  "source": { "file": "/Users/me/app/src/components/Checkout/SubmitButton.tsx", "line": 42, "column": 8 },
  "component": "SubmitButton",
  "outerSnippet": "<button class=\"btn btn-primary\" data-testid=\"checkout-submit\">Submit Order</button>"
}
```

#### Case A — Framework source metadata found (`source.file` is not null)

This is the best case. The framework dev tools gave us the exact file and line.

1. The `source.file` path may be absolute or relative. Resolve it against the project root.
   - React paths often look like: `/absolute/path/src/components/Foo.tsx` or `./src/components/Foo.tsx`
   - Vue paths often look like: `src/components/Foo.vue`
   - Strip any webpack/vite loader prefixes (e.g., `./node_modules/...` is a library, not user code — walk up the fiber/component tree to find the user's wrapper component)
2. Read the source file at the reported line number (read a window of ~30 lines around it for context).
3. Tell the user what you found and ask what they want to change.

#### Case B — No framework metadata, but component name found

The component name was found but not the file path. Search the codebase:

```bash
# Search for the component definition
grep -r "function ComponentName\|class ComponentName\|const ComponentName\|export.*ComponentName" src/
# Or for Vue/Svelte single-file components
find src/ -name "ComponentName.vue" -o -name "ComponentName.svelte"
```

Use Glob and Grep tools in the codebase to locate the file, then read it.

#### Case C — No framework metadata at all (fallback codebase search)

Use the element's metadata to search the codebase. Apply these strategies in order
(stop as soon as you get a confident match):

1. **data-testid / data-* attributes** — Most specific. Grep for the exact attribute value.
   ```
   grep -r "data-testid=\"checkout-submit\"" src/
   ```

2. **Unique CSS class names** — Skip generic classes (btn, container, flex, etc.).
   Grep for project-specific class names (e.g., `checkout-submit-btn`, `order-summary-total`).
   ```
   grep -r "checkout-submit-btn" src/
   ```

3. **ARIA labels / text content** — Search for the button text or aria-label.
   ```
   grep -r "Submit Order" src/
   ```

4. **Element ID** — If the element has an id, grep for it.

5. **Outer HTML snippet** — Use fragments of the HTML to grep.

6. **Combined heuristic** — If multiple strategies return results, cross-reference to find
   the file that appears in the most results. That's likely the right component.

See `references/source-resolver.md` for detailed fallback search strategies and examples.

### Step 5 — Present context and ask what to fix

Once you've located the source file:

1. Read the file (focused around the relevant line if known).
2. Present the component context to the user clearly:
   - Component name
   - File path and line number
   - The relevant code snippet
3. Ask: **"What would you like to change or fix in this component?"**
4. After the user responds, make the requested changes.

If multiple candidate files are found, present the top 2-3 with brief context and let the
user pick the right one.

## Cleanup

If the user wants to exit inspect mode without clicking, or if something goes wrong:

```bash
web-interact eval "(function(){var ids=['__ctf-overlay','__ctf-highlight','__ctf-label'];ids.forEach(function(id){var el=document.getElementById(id);if(el)el.remove()});window.__clickToFixActive=false;window.__clickToFixResult=undefined;return 'Inspector removed'})()"
```

## Important notes

- This feature works best with **development builds**. React, Vue, and Svelte strip source metadata
  in production builds. If `source` is null, inform the user and fall back to codebase search.
- Do NOT use `--headless` — the user must see and interact with the browser.
- If the app uses **source maps** but not framework dev metadata, source maps are NOT directly
  accessible from the page. The fallback search strategy is the right approach.
- For **monorepos** with multiple packages, the source path may reference a package subdirectory.
  Resolve paths relative to the workspace root.
- Always re-inject the inspector if the page navigates (SPA route changes are fine, full reloads are not).

## Deep-dive references

| File | Contents |
|------|----------|
| `references/inspector-script.md` | Annotated inspector JavaScript — how each framework's source metadata is extracted |
| `references/source-resolver.md` | Fallback codebase search strategies with detailed examples and ranking heuristics |
