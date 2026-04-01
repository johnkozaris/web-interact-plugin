# Script Mode API

For multi-step workflows that need conditional logic, loops, or coordinated actions,
use script mode instead of individual CLI commands.

```bash
web-interact run script.js                    # Run a script file
web-interact <<'EOF'                          # Inline script via stdin
const page = await browser.getPage("main");
await page.goto("https://example.com");
EOF
```

Scripts run inside a QuickJS WASM sandbox with async/await support.
Output via `console.log()` goes to stdout. Errors go to stderr.

## browser.* API (zero Playwright timeouts -- all use CDP)

### Element discovery
```javascript
const result = await browser.discover("main");
// result.count -- number of elements
// result.serialized -- human-readable text ("[1] button Submit\n[2] input Email")
// result.elements[] -- array of {index, backendNodeId, selector, role, name, tag}
```

### Actions by index (from discover)
```javascript
await browser.click("main", 3);              // CDP mouse click on element [3]
await browser.type("main", 2, "hello");      // CDP keyboard type into element [2]
await browser.type("main", 2, "hello", { clearFirst: true });  // Clear first
await browser.select("main", 5, "US");       // Select dropdown option
await browser.check("main", 9, true);        // Check checkbox (true/false)
```

### Coordinate-based actions (for canvas/WebGL)
```javascript
await browser.clickAt("main", 500, 300);                     // Click at coords
await browser.clickAt("main", 500, 300, { button: "right" });  // Right-click
await browser.clickAt("main", 500, 300, { doubleClick: true });
await browser.drag("main", 100, 200, 400, 200);              // Drag between coords
await browser.drag("main", 100, 200, 400, 200, { steps: 10 }); // Smooth drag
```

### Low-level element interaction
```javascript
await browser.clickElement("main", "button.submit");  // JS DOM click by selector
await browser.fillElement("main", "input.email", "user@example.com");  // JS fill
```

### Page and network utilities
```javascript
await browser.waitForSettled("main", { quietMs: 300, timeout: 5000 });
const elements = await browser.getInteractiveElements("main", {});
```

### Page management
```javascript
const page = await browser.getPage("main");       // Get or create named page
const page2 = await browser.newPage();             // Create unnamed page
const tabs = await browser.listPages();            // List all pages
await browser.closePage("main");                   // Close a page
```

## page.* API (Playwright Page methods)

### Navigation
```javascript
await page.goto("https://example.com");
await page.goBack();
await page.goForward();
await page.reload();
```

### Querying
```javascript
const title = await page.title();
const url = page.url();
const text = await page.textContent("h1");
const html = await page.innerHTML(".content");
const value = await page.inputValue("input.email");
const attr = await page.getAttribute("a.logo", "href");
```

### Locators (recommended for stable selectors)
```javascript
const btn = page.locator("button.submit");
await btn.click();
await btn.isVisible();
await btn.isEnabled();
const count = await page.locator(".item").count();
const box = await page.locator(".hero").boundingBox();

// Semantic locators
const email = page.getByLabel("Email address");
await email.fill("user@example.com");
const submit = page.getByRole("button", { name: "Submit" });
await submit.click();
```

### Keyboard and mouse
```javascript
await page.keyboard.type("Hello World", { delay: 50 });
await page.keyboard.press("Enter");
await page.keyboard.press("Control+a");
await page.keyboard.down("Shift");
await page.keyboard.up("Shift");

await page.mouse.move(500, 300);
await page.mouse.click(500, 300);
await page.mouse.click(500, 300, { button: "right" });
await page.mouse.dblclick(500, 300);
await page.mouse.wheel(0, -300);
```

### Waiting
```javascript
await page.waitForSelector(".results");
await page.waitForSelector(".spinner", { state: "hidden" });
await page.waitForURL("**/dashboard");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2000);
await page.waitForFunction(() => document.querySelectorAll('.item').length > 10);
```

### JavaScript execution in the page
```javascript
// Plain JS only -- no TypeScript syntax
const result = await page.evaluate(() => {
  return document.title;
});

// Pass arguments
const text = await page.evaluate((sel) => {
  return document.querySelector(sel)?.textContent;
}, ".price");

// Run on all matching elements
const items = await page.$$eval(".product", (elements) => {
  return elements.map(el => ({
    name: el.querySelector("h3")?.textContent,
    price: el.querySelector(".price")?.textContent,
  }));
});
```

### Screenshots
```javascript
const buf = await page.screenshot();
const path = await saveScreenshot(buf, "output.png");
console.log(path);

// Full page
const buf2 = await page.screenshot({ fullPage: true });

// Specific region
const buf3 = await page.screenshot({ clip: { x: 0, y: 0, width: 800, height: 600 } });
```

### Accessibility
```javascript
const snapshot = await page.locator("body").ariaSnapshot();
console.log(snapshot);
// Returns accessibility tree as a string
// Options: { ref?: boolean, timeout?: number }
```

### Cookies and storage
```javascript
const cookies = await page.context().cookies();
await page.context().addCookies([{ name: "token", value: "abc", url: page.url() }]);
await page.context().clearCookies();

// localStorage via page context
const authToken = await page.evaluate(() => localStorage.getItem("authToken"));
await page.evaluate(() => localStorage.setItem("theme", "dark"));
```

### Network interception
```javascript
await page.route("**/api/users", (route) => {
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "Mock User" }]),
  });
});

await page.route("**/*.png", (route) => route.abort());
await page.unroute("**/api/users");
```

### File operations (sandbox)
```javascript
// Save files from the sandbox
const data = JSON.stringify({ key: "value" });
await writeFile("output.json", data);

// Read files into the sandbox
const content = await readFile("input.txt");
```

## Example: complete login + scrape workflow

```javascript
const page = await browser.getPage("app");
await page.goto("https://dashboard.example.com/login");

// Login
const els = await browser.discover("app");
console.log(els.serialized);
await browser.type("app", 1, "user@company.com");
await browser.type("app", 2, "s3cureP@ss!");
await browser.click("app", 3);
await page.waitForURL("**/dashboard");

// Navigate to reports
await page.goto("https://dashboard.example.com/reports");
await page.waitForSelector(".report-row");

// Extract data from multiple pages
const allReports = [];
for (let pageNum = 1; pageNum <= 5; pageNum++) {
  await page.goto(`https://dashboard.example.com/reports?page=${pageNum}`);
  await page.waitForSelector(".report-row");
  const reports = await page.$$eval(".report-row", (rows) =>
    rows.map((r) => ({
      id: r.dataset.id,
      name: r.querySelector(".name")?.textContent?.trim(),
      date: r.querySelector(".date")?.textContent?.trim(),
      status: r.querySelector(".status")?.textContent?.trim(),
    }))
  );
  allReports.push(...reports);
}

console.log(JSON.stringify(allReports, null, 2));
```

## Example: fill a complex form with conditional logic

```javascript
const page = await browser.getPage("form");
await page.goto("https://apply.example.com/application");

const els = await browser.discover("form");
console.log(els.serialized);

// Fill basic fields
await browser.type("form", 2, "Jane Smith");
await browser.type("form", 4, "jane@example.com");
await browser.select("form", 6, "Engineering");

// Check if "Experience level" dropdown exists (conditional field)
const hasExperience = els.elements.some(e => e.name?.includes("Experience"));
if (hasExperience) {
  const expEl = els.elements.find(e => e.name?.includes("Experience"));
  await browser.select("form", expEl.index, "Senior");
}

// Upload resume
const uploadEl = els.elements.find(e => e.tag === "input" && e.role === "");
if (uploadEl) {
  await page.setInputFiles(uploadEl.selector, "./resume.pdf");
}

// Submit
const submitEl = els.elements.find(e => e.name?.includes("Submit"));
await browser.click("form", submitEl.index);
await page.waitForURL("**/confirmation");
console.log(JSON.stringify({ url: page.url(), title: await page.title() }));
```

## Example: monitor a page for changes

```javascript
const page = await browser.getPage("monitor");
await page.goto("https://status.example.com");

let previousText = "";
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(10000);  // Check every 10 seconds
  await page.reload();
  await page.waitForLoadState("networkidle");
  const currentText = await page.textContent(".status-badge");
  if (currentText !== previousText) {
    console.log(`Status changed: ${previousText} -> ${currentText}`);
    previousText = currentText;
    if (currentText.includes("Resolved")) {
      console.log("Issue resolved!");
      break;
    }
  }
}
```

## Example: compare prices across multiple sites

```javascript
const sites = [
  { name: "Site A", url: "https://site-a.example.com/product/123", selector: ".price" },
  { name: "Site B", url: "https://site-b.example.com/item/123", selector: "#product-price" },
  { name: "Site C", url: "https://site-c.example.com/p/123", selector: "[data-price]" },
];

const page = await browser.getPage("compare");
const results = [];

for (const site of sites) {
  await page.goto(site.url);
  await page.waitForLoadState("networkidle");
  const price = await page.textContent(site.selector);
  results.push({ name: site.name, price: price?.trim() });
}

console.log(JSON.stringify(results, null, 2));
// [{"name":"Site A","price":"$29.99"},{"name":"Site B","price":"$34.50"},{"name":"Site C","price":"$27.00"}]
```

## Example: screenshot multiple viewports

```javascript
const page = await browser.getPage("responsive");
await page.goto("https://myapp.example.com");

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(500);  // Wait for responsive layout to settle
  const buf = await page.screenshot({ fullPage: true });
  const path = await saveScreenshot(buf, `${vp.name}.png`);
  console.log(`${vp.name}: ${path}`);
}
```
