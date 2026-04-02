const page = await browser.getPage("default");

// Reset any previous result
await page.evaluate(() => {
  window.__clickToFixResult = undefined;
});

// Inject the inspector overlay
await page.evaluate(() => {
  if (window.__clickToFixActive) return 'already active';

  const overlay = document.createElement('div');
  overlay.id = '__ctf-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;cursor:crosshair;';
  document.body.appendChild(overlay);

  const highlight = document.createElement('div');
  highlight.id = '__ctf-highlight';
  highlight.style.cssText = 'position:fixed;border:2px solid #6366f1;background:rgba(99,102,241,0.08);pointer-events:none;z-index:2147483645;display:none;border-radius:3px;transition:all 0.05s ease;';
  document.body.appendChild(highlight);

  const label = document.createElement('div');
  label.id = '__ctf-label';
  label.style.cssText = 'position:fixed;background:#6366f1;color:#fff;font:bold 11px/1.4 ui-monospace,monospace;padding:2px 8px;border-radius:4px;z-index:2147483647;pointer-events:none;display:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);';
  document.body.appendChild(label);

  const banner = document.createElement('div');
  banner.id = '__ctf-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#6366f1;color:#fff;font:bold 14px/1 system-ui,sans-serif;padding:10px 16px;z-index:2147483647;text-align:center;pointer-events:none;';
  banner.textContent = 'INSPECT MODE \u2014 Click any element to trace its source code';
  document.body.appendChild(banner);

  function getSourceInfo(el) {
    const result = {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList),
      text: (el.textContent || '').trim().substring(0, 120),
      attributes: {},
      source: null,
      component: null,
      outerSnippet: el.outerHTML.substring(0, 300)
    };

    // Collect useful attributes
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes[i];
      if (a.name.startsWith('data-') || a.name === 'aria-label' || a.name === 'role' ||
          a.name === 'name' || a.name === 'placeholder' || a.name === 'type' || a.name === 'href') {
        result.attributes[a.name] = a.value;
      }
    }

    // React: find fiber via __reactFiber$ or __reactInternalInstance$
    let fiber = null;
    const keys = Object.getOwnPropertyNames(el);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].startsWith('__reactFiber$') || keys[i].startsWith('__reactInternalInstance$')) {
        fiber = el[keys[i]];
        break;
      }
    }

    if (fiber) {
      let current = fiber;
      while (current) {
        if (current._debugSource) {
          result.source = {
            file: current._debugSource.fileName,
            line: current._debugSource.lineNumber,
            column: current._debugSource.columnNumber
          };
          if (current.type) {
            result.component = typeof current.type === 'string'
              ? current.type
              : (current.type.displayName || current.type.name || null);
          }
          break;
        }
        current = current.return || null;
      }
      if (!result.component) {
        let c = fiber;
        while (c) {
          if (c.type && typeof c.type === 'function') {
            result.component = c.type.displayName || c.type.name || null;
            if (result.component) break;
          }
          c = c.return || null;
        }
      }
    }

    // Vue
    if (!result.source) {
      let ve = el;
      while (ve) {
        if (ve.__vueParentComponent) {
          const comp = ve.__vueParentComponent;
          result.component = (comp.type && (comp.type.name || comp.type.__name)) || null;
          if (comp.type && comp.type.__file) {
            result.source = { file: comp.type.__file, line: null, column: null };
          }
          break;
        }
        ve = ve.parentElement;
      }
    }

    // Svelte
    if (!result.source) {
      let se = el;
      while (se) {
        if (se.__svelte_meta) {
          const meta = se.__svelte_meta;
          result.source = {
            file: (meta.loc && meta.loc.file) || null,
            line: (meta.loc && meta.loc.line) || null,
            column: (meta.loc && meta.loc.column) || null
          };
          const fn = meta.loc && meta.loc.file;
          result.component = fn ? fn.split('/').pop().replace('.svelte', '') : null;
          break;
        }
        se = se.parentElement;
      }
    }

    // Angular
    if (!result.source) {
      try {
        if (typeof ng !== 'undefined' && ng.getComponent) {
          const ac = ng.getComponent(el);
          if (ac) result.component = (ac.constructor && ac.constructor.name) || null;
        }
      } catch (e) { /* not angular */ }
    }

    return result;
  }

  overlay.addEventListener('mousemove', function(e) {
    overlay.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = '';
    if (!target || target.id === '__ctf-overlay' || target.id === '__ctf-highlight' ||
        target.id === '__ctf-label' || target.id === '__ctf-banner') return;

    const rect = target.getBoundingClientRect();
    highlight.style.display = 'block';
    highlight.style.top = rect.top + 'px';
    highlight.style.left = rect.left + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';

    const info = getSourceInfo(target);
    let txt = info.component || info.tag;
    if (info.source && info.source.file) {
      const short = info.source.file.split('/').slice(-2).join('/');
      txt += ' \u2190 ' + short;
      if (info.source.line) txt += ':' + info.source.line;
    }
    label.style.display = 'block';
    label.style.top = Math.max(0, rect.top - 24) + 'px';
    label.style.left = rect.left + 'px';
    label.textContent = txt;
  });

  overlay.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    overlay.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = '';
    const info = getSourceInfo(target || document.body);
    window.__clickToFixResult = info;
    overlay.remove();
    highlight.remove();
    label.remove();
    document.getElementById('__ctf-banner')?.remove();
    window.__clickToFixActive = false;
  });

  window.__clickToFixActive = true;
});

// Wait for the user to click (up to 2 minutes)
await page.waitForFunction(() => window.__clickToFixResult !== undefined, { timeout: 120000 });

// Retrieve and output the result
const result = await page.evaluate(() => JSON.stringify(window.__clickToFixResult));
console.log(result);
