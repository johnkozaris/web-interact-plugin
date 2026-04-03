---
name: web-interact
description: >
  Browser automation CLI for navigating websites, filling forms, clicking buttons,
  extracting data, taking screenshots, and automating any web workflow.
  Use when users ask to interact with a website, test a web app, fill a form, scrape data,
  take screenshots, log into a service, automate a browser task, or inspect a web page.
  Trigger phrases: "go to", "open", "click", "fill out", "screenshot", "scrape",
  "automate", "test the website", "log into", "check if", "extract from", "navigate to",
  or any browser interaction. Also use when debugging frontend issues, verifying deployments,
  or checking visual state of web applications.
---

# web-interact

Browser automation CLI. Each shell command maps to one browser action.
Browser automation CLI. Uses Playwright by default (switch to Patchright with `web-interact mode assistant`).
Designed for automating your own web applications — please use responsibly.

## Core loop

The workflow is always: `open` → `discover` → act by index → re-discover after changes.

```bash
web-interact --headless open "https://example.com"
web-interact --headless discover        # → [1] input "Email" [2] input[password] ...
web-interact --headless fill 1 "user@example.com"
web-interact --headless fill 2 "password"
web-interact --headless click 3         # submit — triggers navigation
web-interact --headless discover        # ALWAYS re-discover after navigation or form submission
```

Re-discover after: navigation, form submission, AJAX updates, tab switches, or any action
that changes the page. Indices auto-refresh when the URL changes, but explicitly re-discover
after same-page DOM changes (modals, accordions, dynamic content).

## Output contract

- **Actions** (click, fill, press, scroll, etc.): no output on success (exit 0). Error text on stderr (exit 1).
- **Getters** (get url, get title, eval): raw value on stdout.
- **Data** (tab list, cookies get, storage local): JSON on stdout.
- **Screenshots**: file path on stdout.
- **Vision** (`--vision`): plain screenshot path on stderr as `vision:/path/file.png`.
- **Vision + annotate** (`--vision --annotate`): annotated screenshot with element overlays.

## Key distinctions

- `fill` clears existing value then types. Use for form fields.
- `type` appends to existing value. Use for search boxes with autocomplete, or adding to existing text.
- `click` by index uses CDP mouse events (works on any element including React/Vue/Canvas).
- `click` by CSS selector uses JS DOM click (simpler, works for standard elements).
- `keyboard type "text"` types without targeting an element (for canvas apps, active element input).
- `mouse click 100 200` clicks at viewport coordinates (for canvas/WebGL apps where elements aren't in DOM).

## Setup check (IMPORTANT — do this before any web-interact command)

Before using any `web-interact` command, **always** verify it is installed:
```bash
web-interact --version
```

If this fails with "command not found", the CLI is not installed.
**Stop and tell the user they need to install web-interact first.** Suggest the appropriate method:

```bash
# npm (recommended — works on macOS, Linux, Windows)
npm install -g web-interact

# Shell installer (macOS/Linux)
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.sh | sh

# PowerShell installer (Windows)
powershell -ExecutionPolicy ByPass -c "irm https://github.com/johnkozaris/web-interact/releases/latest/download/web-interact-installer.ps1 | iex"

# Cargo (if you have Rust)
cargo install web-interact

# Build from source
git clone https://github.com/johnkozaris/web-interact.git
cd web-interact && ./setup.sh
```

Do NOT attempt to use web-interact commands until the user has installed it.
After install, the CLI auto-installs its runtime (Playwright + Chrome) on first run — no separate step needed.

## Quick start

```bash
# Navigate and discover interactive elements
web-interact --headless open "https://github.com/login"
web-interact --headless discover

# Output:
# [1] input[text] "Username or email address"
# [2] input[password] "Password"
# [3] button "Sign in"
# [4] a "Forgot password?" href="/password_reset"

# Fill the login form
web-interact --headless fill 1 "user@example.com"
web-interact --headless fill 2 "mypassword123"
web-interact --headless click 3

# Check where we landed
web-interact --headless get url
# → https://github.com/dashboard

# Take an annotated screenshot to see the visual state
web-interact --headless screenshot --annotate
# → /path/to/screenshot.png  (numbered element overlays)
```

## Core workflow: discover then act

```bash
# 1. Navigate
web-interact --headless open "https://shop.example.com/checkout"

# 2. Discover all interactive elements
web-interact --headless discover
# [1] input "First name"
# [2] input "Last name"
# [3] input[email] "Email"
# [4] input[tel] "Phone"
# [5] select "Country" (195 options: US, UK, DE, ...)
# [6] input "Address line 1"
# [7] input "City"
# [8] input "ZIP / Postal code"
# [9] input[checkbox] "Save for next time"
# [10] button "Continue to payment"

# 3. Fill fields by index
web-interact --headless fill 1 "John"
web-interact --headless fill 2 "Smith"
web-interact --headless fill 3 "john@example.com"
web-interact --headless fill 4 "+1-555-0123"
web-interact --headless select 5 "US"
web-interact --headless fill 6 "123 Main St"
web-interact --headless fill 7 "San Francisco"
web-interact --headless fill 8 "94102"
web-interact --headless check 9
web-interact --headless click 10

# 4. Verify — re-discover to check for validation errors or success
web-interact --headless discover
# If still on same page with new error elements → form validation failed
# If URL changed → navigation succeeded, re-discover for new page elements
web-interact --headless get url
```

## Error recovery patterns

### After form submission: check for validation errors
```bash
web-interact --headless click 10                  # submit button
web-interact --headless wait 1000                 # brief wait for validation
web-interact --headless discover                  # re-discover
# If discover shows new elements like [25] div "Email is required" → validation failed
# If URL changed → success, continue on new page
web-interact --headless get text ".error"          # or check for error messages directly
```

### After click that might navigate
```bash
web-interact --headless click 3                    # might trigger navigation
# click auto-waits for domcontentloaded if URL changes
web-interact --headless get url                    # verify where we are
web-interact --headless discover                   # get fresh element indices
```

### Page not loading / discover returns 0 elements
```bash
web-interact --headless wait --load networkidle    # wait for all requests to finish
web-interact --headless wait 2000                  # hard pause for JS-heavy SPAs
web-interact --headless discover                   # try again
```

### Checking for modals or overlays blocking interaction
```bash
web-interact --headless get visible ".modal-overlay"   # check if modal is open
web-interact --headless discover                       # find dismiss button in modal
web-interact --headless click 1                        # dismiss it
```

## Command reference

### Navigation
```bash
web-interact open <url>                          # Navigate to URL
web-interact open "https://app.example.com/dashboard" --browser myapp
```

### Element discovery
```bash
web-interact discover                            # All interactive elements with indices
web-interact discover --viewport-only            # Only visible elements
web-interact snapshot                            # Full accessibility tree
web-interact find role button                    # All visible buttons
web-interact find text "Sign in"                 # Elements containing text
web-interact find label "Email address"          # Inputs by label
web-interact find placeholder "Search..."        # Inputs by placeholder text
```

### Actions (silent on success)
```bash
web-interact click 3                             # Click by discover index
web-interact click ".submit-btn"                 # Click by CSS selector
web-interact dblclick 5                          # Double-click
web-interact type 2 "hello world"                # Type (appends to existing)
web-interact fill 1 "john@example.com"           # Fill (clears first)
web-interact select 5 "United States"            # Select dropdown option
web-interact check 9                             # Check checkbox/radio
web-interact uncheck 9                           # Uncheck checkbox
web-interact hover 3                             # Hover over element
web-interact focus "input.search"                # Focus element
web-interact scrollintoview 15                   # Scroll element into viewport
web-interact upload 7 ./resume.pdf ./cover.pdf   # Upload files to file input
web-interact press Enter                         # Press key
web-interact press Control+a                     # Key combo
web-interact press Shift+Tab                     # Reverse tab
web-interact scroll down 500                     # Scroll page
web-interact scroll up 300 --selector ".panel"   # Scroll within element
web-interact drag 100 200 400 200                # Drag from (100,200) to (400,200)
```

### Reading page state (prints raw value)
```bash
web-interact get url                             # Current URL
web-interact get title                           # Page title
web-interact get text "h1"                       # Text content of element
web-interact get text ".error-message"           # Error message text
web-interact get html ".results"                 # innerHTML
web-interact get value "input[name=email]"       # Input value
web-interact get attr "a.logo" href              # Element attribute
web-interact get visible ".modal-overlay"        # true/false
web-interact get enabled "button.submit"         # true/false
web-interact get checked "input[name=agree]"     # true/false
web-interact get count ".search-result"          # Number of matches
web-interact get styles "h1" font-size           # Computed CSS: "32px"
web-interact get styles ".btn" background-color  # Computed CSS: "rgb(59, 130, 246)"
web-interact get box ".hero"                     # Bounding box JSON
web-interact eval "document.querySelectorAll('.item').length"        # JS expression
web-interact eval "Array.from(document.querySelectorAll('h2')).map(e => e.textContent)"
```

### Screenshots
```bash
web-interact screenshot                          # Screenshot → prints file path
web-interact screenshot output.png               # Custom path
web-interact screenshot --full                   # Full scrollable page
web-interact screenshot --annotate               # Numbered element overlays
web-interact --vision click 3                    # Any command + plain screenshot after
web-interact --vision --annotate click 3         # Any command + numbered screenshot after
```

### Waiting
```bash
web-interact wait ".results"                     # Wait for CSS selector to appear
web-interact wait ".spinner" --hidden            # Wait for element to disappear
web-interact wait --text "Payment confirmed"     # Wait for text on page
web-interact wait --url "**/order/confirmation"  # Wait for URL pattern
web-interact wait --load networkidle             # Wait for network to quiet
web-interact wait 2000                           # Wait N milliseconds
```

### Storage and cookies
```bash
web-interact storage local                       # All localStorage (JSON)
web-interact storage local authToken             # Get specific key
web-interact storage local-set theme dark        # Set key
web-interact storage session                     # All sessionStorage
web-interact cookies get                         # All cookies (JSON)
web-interact cookies set session_id abc123       # Set cookie
web-interact cookies set token xyz --domain .example.com
web-interact cookies clear                       # Clear all cookies
web-interact clipboard read                      # Read clipboard
web-interact clipboard write "copied text"       # Write clipboard
```

### Network
```bash
web-interact network requests                    # Recent requests (JSON)
web-interact network requests --filter "api"     # Filter by URL
web-interact network block "*.analytics.com*"    # Block tracking
web-interact network route "*/api/users" --body '{"users":[]}'     # Mock API
web-interact network route "*/api/slow" --body '{"ok":true}' --status 200
web-interact network route "*.ads.*" --abort     # Abort ad requests
web-interact network unroute "*/api/users"       # Remove specific route
web-interact network unroute                     # Remove all routes
```

### Tabs
```bash
web-interact tab list                            # All tabs (JSON with id, url, title)
web-interact tab new "https://docs.example.com"  # Open new tab
web-interact tab switch docs                     # Switch to named tab
web-interact tab close docs                      # Close tab
```

### Settings
```bash
web-interact set viewport 1920 1080              # Set viewport size
web-interact set viewport 375 812                # Mobile viewport
web-interact set media dark                      # Dark color scheme
web-interact set media light                     # Light color scheme
web-interact set geo 51.5074 -0.1278             # London geolocation
web-interact set offline on                      # Simulate offline
web-interact set offline off                     # Back online
web-interact set headers '{"Authorization":"Bearer tok_123","Accept-Language":"fr"}'
```

### Low-level mouse and keyboard
```bash
web-interact mouse move 500 300                  # Move mouse
web-interact mouse click 500 300                 # Click at coordinates
web-interact mouse click 500 300 --button right  # Right-click
web-interact mouse down                          # Mouse button down
web-interact mouse up                            # Mouse button up
web-interact mouse wheel -- -300                  # Scroll wheel (DY first, negative = up)
web-interact keyboard type "Hello World" --delay 50   # Type with delay
web-interact keyboard insert "pasted text"       # Insert without key events
web-interact keyboard press Control+c            # Key combo
web-interact keyboard down Shift                 # Hold Shift
web-interact keyboard up Shift                   # Release Shift
```

### Browser management
```bash
web-interact status                              # Daemon status
web-interact browsers                            # List browser instances
web-interact close                               # Close current page
web-interact close --all                         # Close browser instance
web-interact stop                                # Stop daemon
web-interact install                             # Install browser runtime
web-interact mode                                # Show current engine mode
web-interact mode default                        # Switch to Playwright (standard)
web-interact mode assistant                      # Switch to Patchright (removes automation flags)
```

## Global flags

| Flag | Description |
|------|------------|
| `--headless` | Run without visible window |
| `--browser NAME` | Named browser instance (default: "default") |
| `--connect [URL]` | Connect to running Chrome/Edge (auto-discovers if no URL) |
| `--own-browser` | Use user's running browser (shorthand for `--connect auto`) |
| `--humanize` | Natural delays between actions (auto-enabled in assistant mode) |
| `--vision` | Plain screenshot after each command |
| `--vision --annotate` | Screenshot with numbered element overlays |
| `--timeout SECONDS` | Script timeout (default: 20s) |
| `--ignore-https-errors` | Ignore certificate errors |
| `--page NAME` | Named page within browser (default: "default") |

## Output contract

- **Actions** (click, fill, press, scroll, etc.): no output on success (exit 0). Error text on stderr (exit 1).
- **Getters** (get url, get title, eval): raw value on stdout.
- **Data** (tab list, cookies get, storage local, network requests): JSON on stdout.
- **Screenshots**: file path on stdout.
- **Vision** (`--vision`): screenshot path on stderr as `vision:/path/to/file.png`.
- Add `--annotate` for numbered element overlays on the screenshot.
- **Errors**: plain text on stderr. No JSON wrapping. Exit code 1.

## Real-world patterns

### Login flow with error handling
```bash
web-interact --headless open "https://app.example.com/login"
web-interact --headless discover
# Fill credentials
web-interact --headless fill 1 "user@example.com"
web-interact --headless fill 2 "password123"
web-interact --headless click 3
# Wait for either success or error
web-interact --headless wait --url "**/dashboard" || web-interact --headless get text ".error"
```

### Form with dropdowns, checkboxes, and file upload
```bash
web-interact --headless open "https://apply.example.com/form"
web-interact --headless discover
web-interact --headless fill 2 "Jane Doe"
web-interact --headless fill 4 "jane@example.com"
web-interact --headless select 6 "Engineering"
web-interact --headless select 8 "Senior"
web-interact --headless check 10    # "I agree to terms"
web-interact --headless upload 12 ./resume.pdf
web-interact --headless click 14    # Submit
web-interact --headless wait --text "Application submitted"
web-interact --headless get url
```

### Multi-tab comparison
```bash
web-interact --headless open "https://pricing.example.com/plan-a" --page plan-a
web-interact --headless open "https://pricing.example.com/plan-b" --page plan-b
web-interact --headless get text ".price" --page plan-a
web-interact --headless get text ".price" --page plan-b
```

### Canvas/WebGL apps (Google Sheets, Figma)
```bash
# discover() only finds toolbar elements, not canvas content
web-interact --headless open "https://docs.google.com/spreadsheets/d/SHEET_ID"
web-interact --headless discover
# Click the Name Box (usually element [1] or [2]) to navigate to a cell
web-interact --headless click 1
web-interact --headless keyboard type "A1"
web-interact --headless press Enter
# Type cell content
web-interact --headless keyboard type "Revenue"
web-interact --headless press Tab
web-interact --headless keyboard type "2024"
web-interact --headless press Tab
web-interact --headless keyboard type "150000"
web-interact --headless press Enter
# Screenshot to verify
web-interact --headless screenshot
```

### Mock API responses for testing
```bash
web-interact --headless network route "*/api/users" --body '[{"id":1,"name":"Test User"}]'
web-interact --headless network route "*/api/config" --body '{"feature_flags":{"new_ui":true}}'
web-interact --headless open "https://app.example.com"
# App now sees mocked API responses
web-interact --headless discover
```

### Extract structured data
```bash
web-interact --headless open "https://news.example.com"
web-interact --headless eval "Array.from(document.querySelectorAll('article')).map(a => ({title: a.querySelector('h2')?.textContent?.trim(), link: a.querySelector('a')?.href, date: a.querySelector('time')?.dateTime})).filter(a => a.title)"
```

### Visual testing with --vision
```bash
# Plain screenshots after every action (agent uses vision to interpret)
web-interact --headless --vision open "https://myapp.example.com"
# stderr: vision:/path/to/vision.png
web-interact --headless --vision click 3
# stderr: vision:/path/to/vision.png (updated after click)

# Add --annotate to overlay numbered element labels
web-interact --headless --vision --annotate open "https://myapp.example.com"
# stderr: vision:/path/to/vision.png (with [1], [2], etc. on elements)
```

### Connect to user's running Chrome/Edge
```bash
# Use --own-browser to auto-discover and connect to user's browser
web-interact --own-browser discover
web-interact --own-browser screenshot --annotate

# Or connect with explicit URL
web-interact --connect ws://127.0.0.1:9222 discover
```

## Deep-dive references

For detailed documentation, read these reference files:

| File | Contents |
|------|----------|
| `references/commands.md` | Complete command reference with all flags and examples |
| `references/patterns.md` | Workflow patterns: login, forms, search, e-commerce, mocking, testing |
| `references/advanced-interactions.md` | Complex UIs: SPAs, dropdowns, autocomplete, date pickers, rich text editors, tables, pagination, modals, iframes, shadow DOM, drag-drop, CAPTCHA, auth tokens |
| `references/scripting.md` | Script mode API: browser.*, page.*, full examples with loops and conditionals |
| `references/troubleshooting.md` | Common problems and fixes: timeouts, stale elements, click failures, CAPTCHA, network routes |

## Tips

- NEVER use --headless for login pages from major providers (Google, Microsoft, Amazon, GitHub, Facebook). They enforce passkeys, device trust, CAPTCHAs that headless cannot handle. Use headed mode, --own-browser, or --connect instead.
- For login flows and bot-sensitive sites, use `web-interact mode assistant` to switch to Patchright with auto-humanized interactions. Or add `--humanize` to any command for natural delays.
- ALWAYS re-discover after navigation, form submission, or any action that changes the DOM.
- Indices auto-refresh when the page URL changes, but explicitly re-discover after same-page changes (modals, accordions, AJAX updates).
- `fill` clears then types — use for form fields. `type` appends — use for search boxes with autocomplete.
- Use `--headless` for unattended automation. Omit it to watch the browser.
- Use `--vision` for a plain screenshot after each action. Add `--annotate` to overlay element numbers.
- Use `screenshot --annotate` to correlate element numbers with their visual positions.
- Actions that trigger page navigation automatically wait for the page to load.
- For canvas apps (Sheets, Figma), use `keyboard type` and `mouse click x y` instead of element indices.
- Use `eval` for complex queries that individual commands can't express.
- Use `network route` to mock APIs for testing — set up routes BEFORE opening the page.
- Use separate `--browser` names for independent browser sessions.
- Use separate `--page` names for multiple tabs in the same browser.
- If a command hangs, check for modals/dialogs blocking the page with `get visible ".modal"`.
