# Advanced Interactions

Complex interaction patterns for challenging UIs: SPAs, dynamic content, iframes,
shadow DOM, drag-and-drop, rich text editors, date pickers, and more.

## Single-page applications (React, Vue, Angular)

SPAs re-render the DOM without full page navigation. The URL may change via
pushState but no new page loads. After clicking a link in an SPA:

```bash
web-interact --headless click 5              # SPA route change
web-interact --headless wait 500             # Brief wait for render
web-interact --headless discover             # MUST re-discover — DOM has changed
# Indices from previous discover are now stale
```

For SPAs with loading spinners:
```bash
web-interact --headless click 3              # Trigger data fetch
web-interact --headless wait ".spinner" --hidden    # Wait for spinner to go away
web-interact --headless discover             # Now discover the loaded content
```

For SPAs with skeleton/placeholder content:
```bash
web-interact --headless click 3
web-interact --headless wait --text "actual content keyword"  # Wait for real content
web-interact --headless discover
```

## Infinite scroll / lazy loading

```bash
web-interact --headless open "https://feed.example.com"
web-interact --headless get count ".post"              # Count initial items
# -> 10
web-interact --headless scroll down 2000               # Scroll to trigger lazy load
web-interact --headless wait 1000                      # Wait for new content
web-interact --headless get count ".post"              # Count again
# -> 20
web-interact --headless scroll down 2000               # Load more
web-interact --headless wait 1000
web-interact --headless get count ".post"
# -> 30

# Extract all loaded items
web-interact --headless eval "Array.from(document.querySelectorAll('.post')).map(p => ({title: p.querySelector('h3')?.textContent?.trim(), author: p.querySelector('.author')?.textContent?.trim()}))"
```

## Dropdown menus that appear on hover

Some menus only appear when hovering over a trigger element:
```bash
web-interact --headless discover
# [5] button "Account"  — dropdown trigger
web-interact --headless hover 5              # Hover to open dropdown menu
web-interact --headless wait ".dropdown-menu"  # Wait for menu to render
web-interact --headless discover             # Re-discover with menu open
# Now the dropdown items appear:
# [20] a "Profile" [21] a "Settings" [22] a "Sign out"
web-interact --headless click 21             # Click Settings
```

## Dropdown menus that appear on click

```bash
web-interact --headless discover
# [8] button "Sort by" — dropdown trigger
web-interact --headless click 8              # Click to open dropdown
web-interact --headless wait 300             # Wait for animation
web-interact --headless discover             # Re-discover with dropdown open
# [15] div "Price: Low to High" [16] div "Price: High to Low" [17] div "Newest"
web-interact --headless click 15             # Select option
```

## Autocomplete / typeahead inputs

Use `type` (not `fill`) because autocomplete needs to see each keystroke:
```bash
web-interact --headless discover
# [3] input "Search cities"
web-interact --headless type 3 "San Fran"    # Type partial text
web-interact --headless wait ".autocomplete-results"  # Wait for suggestions
web-interact --headless discover             # Discover the suggestion list
# [20] div "San Francisco, CA" [21] div "San Fernando, CA"
web-interact --headless click 20             # Select suggestion
```

For inputs that filter as you type (live search):
```bash
web-interact --headless type 3 "react hooks"
web-interact --headless wait 500             # Debounce delay
web-interact --headless get count ".result"  # Check results updated
web-interact --headless get text ".result:first-child"
```

## Date pickers

Most date pickers are custom widgets, not native input date:

```bash
# Strategy 1: Click the date input to open the picker, then navigate
web-interact --headless discover
# [6] input "Check-in date"
web-interact --headless click 6              # Opens date picker
web-interact --headless wait ".datepicker"
web-interact --headless discover             # Discover picker controls
# [25] button "Next month" [26] button "Previous month"
# [30] td "15" [31] td "16" [32] td "17"
web-interact --headless click 25             # Go to next month
web-interact --headless wait 300
web-interact --headless discover
web-interact --headless click 30             # Select the 15th

# Strategy 2: Type the date directly if the input accepts it
web-interact --headless fill 6 "2024-12-15"
web-interact --headless press Tab            # Move focus to close picker

# Strategy 3: Set via JavaScript for stubborn pickers
web-interact --headless eval "const el = document.querySelector('input[name=checkin]'); el.value = '2024-12-15'; el.dispatchEvent(new Event('change', {bubbles:true}))"
```

## Range sliders

```bash
web-interact --headless discover
# [8] input[range] "Price range" min=0 max=1000 value=500

# Strategy 1: Set value via JavaScript (most reliable)
web-interact --headless eval "const s = document.querySelector('input[type=range]'); s.value = 750; s.dispatchEvent(new Event('input', {bubbles:true})); s.dispatchEvent(new Event('change', {bubbles:true}))"

# Strategy 2: Click at a position on the slider track
web-interact --headless get box "input[type=range]"
# -> {"x":100,"y":300,"width":400,"height":20}
# Click at 75% of the width (100 + 400*0.75 = 400)
web-interact --headless mouse click 400 310

# Strategy 3: Use keyboard to adjust
web-interact --headless click 8
web-interact --headless press ArrowRight     # Increment
web-interact --headless press ArrowRight
web-interact --headless press ArrowRight
```

## Rich text editors (contenteditable)

These editors use contenteditable divs, not standard inputs:

```bash
# Discover finds the editor toolbar and the editable area
web-interact --headless discover
# [10] div[contenteditable] "Type your message..."

# Type into contenteditable area
web-interact --headless click 10             # Focus the editor
web-interact --headless keyboard type "Hello, this is a test message."

# Apply formatting via toolbar buttons
web-interact --headless press Control+a      # Select all text
web-interact --headless discover             # Find toolbar buttons
# [1] button "Bold" [2] button "Italic" [3] button "Underline"
web-interact --headless click 1              # Make text bold

# Or use keyboard shortcuts
web-interact --headless keyboard type "More text here"
web-interact --headless press Control+b      # Toggle bold
web-interact --headless keyboard type "bold text"
web-interact --headless press Control+b      # Toggle bold off
web-interact --headless keyboard type " normal text"
```

## Tables: click cells, sort columns, extract data

```bash
# Click cell at row 3, column 2 via selector
web-interact --headless click "table tbody tr:nth-child(3) td:nth-child(2)"

# Click column header to sort
web-interact --headless click "th:nth-child(3)"      # Click "Price" header
web-interact --headless wait 500                      # Wait for sort
web-interact --headless get text "tbody tr:first-child td:nth-child(3)"  # First value

# Extract entire table as structured data
web-interact --headless eval "Array.from(document.querySelectorAll('table tbody tr')).map(row => Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim()))"
```

## Pagination

```bash
web-interact --headless open "https://listings.example.com/search?q=apartments"
web-interact --headless get count ".listing-card"
# -> 20

# Navigate through pages
web-interact --headless discover
# [30] a "Next" — pagination next button
web-interact --headless click 30
web-interact --headless wait --load networkidle
web-interact --headless get count ".listing-card"

# Or go to a specific page
web-interact --headless click "a[data-page='5']"
web-interact --headless wait --load networkidle

# Extract data from current page
web-interact --headless eval "Array.from(document.querySelectorAll('.listing-card')).map(c => ({title: c.querySelector('h3')?.textContent, price: c.querySelector('.price')?.textContent, location: c.querySelector('.location')?.textContent}))"
```

## Modal dialogs and overlays

```bash
# Trigger a modal
web-interact --headless click 3              # "Delete account" button
web-interact --headless wait ".modal"        # Wait for modal to appear
web-interact --headless discover             # Discover modal contents
# [25] button "Cancel" [26] button "Confirm delete"
web-interact --headless click 25             # Cancel

# Dismiss by clicking overlay backdrop
web-interact --headless click ".modal-backdrop"
web-interact --headless wait ".modal" --hidden

# Close with Escape key
web-interact --headless press Escape
web-interact --headless wait ".modal" --hidden
```

## Toast notifications / snackbars

```bash
web-interact --headless click 5              # Trigger action
web-interact --headless wait ".toast"        # Wait for toast to appear
web-interact --headless get text ".toast"    # Read the message
# -> "Changes saved successfully"

# Wait for toast to auto-dismiss
web-interact --headless wait ".toast" --hidden
```

## Tabs within a page (not browser tabs)

```bash
web-interact --headless discover
# [5] button "Details" [6] button "Reviews" [7] button "Shipping"
web-interact --headless click 6              # Switch to Reviews tab
web-interact --headless wait 300             # Wait for tab content
web-interact --headless get text ".tab-content.active"
web-interact --headless get count ".review-item"
```

## Accordions / collapsible sections

```bash
web-interact --headless discover
# [3] button "Shipping info" [4] button "Return policy" [5] button "FAQ"
web-interact --headless click 4              # Expand "Return policy"
web-interact --headless wait 300             # Wait for expand animation
web-interact --headless get text ".accordion-body:nth-child(2)"
```

## Drag and drop: sortable lists

```bash
# Get bounding boxes of items to drag
web-interact --headless get box ".sortable-item:nth-child(1)"
# -> {"x":50,"y":100,"width":300,"height":40}
web-interact --headless get box ".sortable-item:nth-child(3)"
# -> {"x":50,"y":180,"width":300,"height":40}
# Drag item 1 to position 3
web-interact --headless drag 200 120 200 200

# Verify new order
web-interact --headless eval "Array.from(document.querySelectorAll('.sortable-item')).map(i => i.textContent.trim())"
```

## Drag and drop: file drop zones

```bash
# File drop zones cannot be triggered via drag command
# Use the upload command instead
web-interact --headless discover
# [8] div "Drop files here or click to upload"
web-interact --headless upload 8 ./image.png ./document.pdf
web-interact --headless wait --text "2 files uploaded"
```

## Shadow DOM elements

```bash
# Shadow DOM elements are not directly accessible via CSS selectors.
# Use eval to pierce shadow roots:
web-interact --headless eval "document.querySelector('my-component').shadowRoot.querySelector('button').textContent"

# Click inside shadow DOM:
web-interact --headless eval "document.querySelector('my-component').shadowRoot.querySelector('button.submit').click()"

# discover() uses CDP which can see through shadow DOM — elements inside
# shadow roots appear in the discover output with appropriate selectors.
```

## Cookie consent banners

Handle these first before interacting with the page:

```bash
web-interact --headless open "https://any-european-site.com"
web-interact --headless wait 1000            # Wait for banner to render
web-interact --headless discover
# Look for accept/reject buttons — usually the first interactive elements
# [1] button "Accept all cookies" [2] button "Reject all"
web-interact --headless click 1              # Accept to dismiss
web-interact --headless wait 500             # Wait for banner to animate away

# Alternatively, set the cookie directly to skip the banner
web-interact --headless cookies set cookie_consent accepted --domain .example.com
web-interact --headless open "https://example.com"   # Reload — banner won't appear
```

## CAPTCHA handling

CAPTCHAs cannot be solved programmatically. Strategies:

```bash
# Strategy 1: Use --connect to attach to a browser where the user solved it
web-interact --connect get url

# Strategy 2: After manual solve, save and reuse cookies
web-interact --connect cookies get           # Save after solving CAPTCHA

# Strategy 3: web-interact uses Patchright (undetected Chrome) which avoids
# most CAPTCHAs by not triggering bot detection.
# If you still get CAPTCHAs, try headed mode (more human-like):
web-interact open "https://captcha-heavy-site.com"    # No --headless
```

## Alerts, confirms, and prompts (JavaScript dialogs)

Patchright auto-dismisses dialogs by default. To control them:

```bash
# Pre-set dialog responses before triggering
web-interact --headless eval "window.confirm = () => true"
web-interact --headless eval "window.alert = () => {}"
web-interact --headless eval "window.prompt = () => 'user input'"
web-interact --headless click 3              # Now the dialog returns the preset value
```

## Geolocation-dependent content

```bash
web-interact --headless set geo 35.6762 139.6503      # Tokyo
web-interact --headless open "https://maps.example.com"
web-interact --headless wait --load networkidle
web-interact --headless screenshot tokyo.png

web-interact --headless set geo 48.8566 2.3522        # Paris
web-interact --headless open "https://maps.example.com"
web-interact --headless screenshot paris.png
```

## HTTP Basic Auth

```bash
web-interact --headless set headers '{"Authorization":"Basic dXNlcjpwYXNz"}'
web-interact --headless open "https://protected.example.com"
web-interact --headless get title
```

## Inject auth tokens before loading app

```bash
web-interact --headless open "https://app.example.com"   # Load blank page on domain
web-interact --headless storage local-set authToken "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc"
web-interact --headless storage local-set refreshToken "rt_abc123def456"
web-interact --headless open "https://app.example.com/dashboard"  # Reload with auth
web-interact --headless get title
# -> Dashboard (authenticated)
```

## Multiple browser instances for parallel work

```bash
# Each --browser name is an independent Chrome with its own cookies/state
web-interact --headless --browser user-a open "https://app.example.com/login"
web-interact --headless --browser user-b open "https://app.example.com/login"

web-interact --headless --browser user-a discover
web-interact --headless --browser user-a fill 1 "alice@example.com"
web-interact --headless --browser user-a fill 2 "password-a"
web-interact --headless --browser user-a click 3

web-interact --headless --browser user-b discover
web-interact --headless --browser user-b fill 1 "bob@example.com"
web-interact --headless --browser user-b fill 2 "password-b"
web-interact --headless --browser user-b click 3
```

## Multi-select (Ctrl+click)

```bash
# For custom multi-select widgets:
web-interact --headless discover
# [10] div "Option A" [11] div "Option B" [12] div "Option C"
web-interact --headless click 10             # Select first
web-interact --headless keyboard down Control
web-interact --headless click 12             # Ctrl+click third
web-interact --headless keyboard up Control

# For native select multiple, set via eval:
web-interact --headless eval "const sel = document.querySelector('select[multiple]'); ['opt1','opt3'].forEach(v => { const o = sel.querySelector('option[value=\"'+v+'\"]'); if(o) o.selected = true; }); sel.dispatchEvent(new Event('change',{bubbles:true}))"
```

## Right-click context menus

```bash
web-interact --headless mouse click 500 300 --button right
web-interact --headless wait ".context-menu"
web-interact --headless discover             # Discover menu items
web-interact --headless click 15             # Click menu item
```

## Performance measurement

```bash
web-interact --headless open "https://example.com"
web-interact --headless eval "JSON.stringify({domContentLoaded: Math.round(performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart), fullLoad: Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart), firstPaint: Math.round(performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0)})"

# Check large resources
web-interact --headless eval "performance.getEntriesByType('resource').filter(r => r.transferSize > 100000).map(r => ({name: r.name.split('/').pop(), size: Math.round(r.transferSize/1024) + 'KB', duration: Math.round(r.duration) + 'ms'}))"
```

## Accessibility audit

```bash
web-interact --headless open "https://myapp.example.com"
web-interact --headless snapshot             # Full accessibility tree

# Programmatic checks:
web-interact --headless eval "Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label')).map(i => i.src)"
# -> images without alt text

web-interact --headless eval "Array.from(document.querySelectorAll('button')).filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length"
# -> count of buttons without accessible names

web-interact --headless eval "Array.from(document.querySelectorAll('a')).filter(a => !a.textContent.trim() && !a.getAttribute('aria-label')).length"
# -> links without accessible names
```

## Next.js / __NEXT_DATA__ extraction

```bash
web-interact --headless open "https://nextjs-app.example.com/product/123"
web-interact --headless eval "JSON.parse(document.querySelector('#__NEXT_DATA__')?.textContent || '{}').props?.pageProps"
# Returns the server-side props for the current page
```

## Scraping behind login across multiple pages

```bash
# Login
web-interact --headless open "https://dashboard.example.com/login"
web-interact --headless discover
web-interact --headless fill 1 "user@company.com"
web-interact --headless fill 2 "password"
web-interact --headless click 3
web-interact --headless wait --url "**/dashboard"

# Scrape page 1
web-interact --headless open "https://dashboard.example.com/reports?page=1"
web-interact --headless wait ".report-row"
web-interact --headless eval "Array.from(document.querySelectorAll('.report-row')).map(r => ({id: r.dataset.id, name: r.querySelector('.name')?.textContent, date: r.querySelector('.date')?.textContent, status: r.querySelector('.status')?.textContent}))"

# Scrape page 2 (session/cookies persist)
web-interact --headless open "https://dashboard.example.com/reports?page=2"
web-interact --headless wait ".report-row"
web-interact --headless eval "Array.from(document.querySelectorAll('.report-row')).map(r => ({id: r.dataset.id, name: r.querySelector('.name')?.textContent, date: r.querySelector('.date')?.textContent, status: r.querySelector('.status')?.textContent}))"
```
