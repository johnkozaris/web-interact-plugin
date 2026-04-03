# Source Resolver — Fallback Codebase Search

When framework dev-mode metadata is not available (production build, vanilla JS,
or unsupported framework), use the element's DOM metadata to search the codebase
and locate the source file.

## Strategy cascade

Apply these strategies in order. Stop as soon as you get a high-confidence match.
If no single strategy is conclusive, cross-reference results from multiple strategies.

### 1. data-testid and data-* attributes (highest specificity)

Test IDs are project-specific and almost always unique. They are the most reliable
fallback signal.

```bash
# Element has: data-testid="checkout-submit"
grep -r 'data-testid="checkout-submit"' src/
# or with quotes variation
grep -r "data-testid=['\"]checkout-submit['\"]" src/
# or JSX spread
grep -r "checkout-submit" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte"
```

Also check for other custom data attributes:
```bash
# data-cy, data-test, data-automation, data-component
grep -r 'data-cy="submit-order"' src/
```

**Confidence: Very High** — data-testid values are intentionally unique identifiers.

### 2. Element ID

IDs should be unique per page. Search for the id in JSX/template attributes.

```bash
# Element has: id="submit-btn"
grep -r 'id="submit-btn"' src/
grep -r "id=['\"]submit-btn['\"]" src/
```

**Confidence: High** — IDs are typically unique, but check for dynamic ID generation.

### 3. Project-specific CSS class names

Skip generic utility classes (Tailwind, Bootstrap, etc.) and look for
project-specific class names.

**Generic classes to IGNORE** (not useful for source location):
- Tailwind: `flex`, `p-4`, `text-lg`, `bg-blue-500`, `w-full`, `mt-2`, etc.
- Bootstrap: `btn`, `btn-primary`, `container`, `row`, `col-*`, `form-control`, etc.
- Common utilities: `active`, `disabled`, `hidden`, `visible`, `open`, `closed`

**Project-specific classes to SEARCH FOR**:
- BEM-style: `checkout-form__submit`, `order-summary__total`, `nav-menu__item--active`
- Component-scoped: `LoginButton_wrapper_a3f2d`, `Header_logo_module`
- Domain-specific: `cart-item-count`, `product-rating-stars`, `user-avatar-badge`

```bash
# Element has: class="btn btn-primary checkout-submit-btn"
# Skip btn and btn-primary (generic), search for checkout-submit-btn
grep -r "checkout-submit-btn" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte" --include="*.css" --include="*.scss"
```

**CSS Modules**: If the class looks hashed (e.g., `_submit_a3f2d_1`), search for the
unhashed base name in `.module.css` or `.module.scss` files:
```bash
# Hashed class: _submit_a3f2d_1 → base name: submit
grep -r "\.submit" src/ --include="*.module.css" --include="*.module.scss"
# Then check which component imports that CSS module
grep -r "styles.submit\|classes.submit" src/ --include="*.tsx" --include="*.jsx"
```

**Confidence: Medium-High** — depends on naming specificity.

### 4. ARIA labels and accessible names

ARIA labels are usually hand-written strings that appear in the source.

```bash
# Element has: aria-label="Submit your order"
grep -r "Submit your order" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte"
# Also check for aria-label attribute specifically
grep -r 'aria-label="Submit your order"' src/
```

**Confidence: Medium-High** — but watch for i18n (the string might be a translation key).

### 5. Text content (button labels, headings)

Search for the visible text of the element. Most useful for buttons, links, headings.

```bash
# Element text: "Submit Order"
grep -r "Submit Order" src/ --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte"
```

**Watch out for**:
- **i18n**: If the project uses i18n, the text might be `t('checkout.submit')` not `"Submit Order"`.
  Check for translation files too: `grep -r "Submit Order" src/ public/ locales/`
- **Dynamic text**: The text might be a variable. Search for partial matches.
- **Very common text**: "Submit", "OK", "Cancel" will match many files. Combine with other signals.

**Confidence: Medium** — good for unique text, poor for generic labels.

### 6. HTML structure / outerHTML snippet

Use fragments of the element's HTML structure to find the template.

```bash
# outerSnippet: <button class="btn-primary" data-testid="checkout-submit">Submit Order</button>
# Search for the structural pattern
grep -r '<button.*checkout-submit' src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
```

**Confidence: Low-Medium** — JSX/templates may differ from rendered HTML.

### 7. Component name (without file path)

If a component name was found but no file path (e.g., Angular), search for the
component definition:

```bash
# Component name: "SubmitButton"
# Search for definition patterns across frameworks

# React function component
grep -r "function SubmitButton\|const SubmitButton\|export.*SubmitButton" src/ --include="*.tsx" --include="*.jsx"

# React class component
grep -r "class SubmitButton" src/ --include="*.tsx" --include="*.jsx"

# Vue component
find src/ -name "SubmitButton.vue"

# Svelte component
find src/ -name "SubmitButton.svelte"

# Angular component
grep -r "class SubmitButton" src/ --include="*.ts"
grep -r "selector:.*submit-button\|selector:.*submitButton" src/ --include="*.ts"

# Also check for file names matching the component
find src/ -iname "*SubmitButton*" -o -iname "*submit-button*" -o -iname "*submit_button*"
```

**Confidence: High** — component names are usually unique and map directly to files.

## Cross-referencing results

When multiple strategies return results, rank files by how many strategies point to them:

| File | testid | class | text | aria | Score |
|------|--------|-------|------|------|-------|
| `src/components/Checkout/SubmitButton.tsx` | yes | yes | yes | yes | 4 |
| `src/pages/Checkout.tsx` | no | yes | yes | no | 2 |
| `src/components/Button.tsx` | no | no | yes | no | 1 |

Pick the file with the highest score. If there's a tie, prefer:
1. Files in a `components/` directory (more specific than pages)
2. Files whose name matches the element's role (e.g., `SubmitButton` for a submit button)
3. Files that are deeper in the directory tree (more specific)

## Narrowing within a file

Once you've found the file, narrow down to the exact line:

1. Search for the text content, class name, or data attribute within the file
2. Look for the JSX return statement or template section
3. If the file exports multiple components, find the one that matches the element

## When all strategies fail

If no confident match is found:
1. Tell the user which signals were available from the clicked element
2. Show the top 2-3 candidate files with the matching evidence
3. Ask the user to confirm which file is correct
4. If none match, suggest the user run in dev mode for framework metadata,
   or add a `data-testid` attribute to the element for future identification

## Example: full fallback walkthrough

**Clicked element:**
```json
{
  "tag": "button",
  "id": null,
  "classes": ["flex", "items-center", "gap-2", "rounded-lg", "bg-indigo-600", "px-4", "py-2", "cart-add-btn"],
  "text": "Add to Cart",
  "attributes": { "data-testid": "add-to-cart", "aria-label": "Add item to shopping cart" },
  "source": null,
  "component": null
}
```

**Search sequence:**
1. `grep -r 'data-testid="add-to-cart"' src/` → `src/components/Product/AddToCartButton.tsx:28`
2. **Match found on first strategy. Stop.**
3. Read `src/components/Product/AddToCartButton.tsx` around line 28.
4. Present to user: "This button is in `AddToCartButton.tsx` at line 28."
