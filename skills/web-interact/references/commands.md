# Command Reference

Complete command reference for web-interact. Every command with all flags and realistic examples.

## Navigation

```bash
web-interact open <url>                               # Navigate to URL
web-interact open "https://app.example.com/login"     # Quoted URL with path
web-interact open "file:///Users/me/test.html"        # Local file
web-interact open "https://staging.example.com" --browser staging  # Named browser instance
```

## Element Discovery

```bash
web-interact discover                                 # All interactive elements with [N] indices
web-interact discover --viewport-only                 # Only elements visible in viewport
web-interact discover --page checkout                 # Specific named page

# Output format:
# Page has 15 interactive elements: 5 inputs, 3 buttons, 2 links, ...
# Viewport: 1280x720
#
# [1] input "Email address" placeholder="you@example.com"
# [2] input[password] "Password"
# [3] button "Sign in"
# [4] a "Forgot password?" href="/reset"
# [5] a "Create account" href="/signup"
```

## Semantic Find (by meaning, not index)

```bash
web-interact find role button                         # All visible buttons
web-interact find role link                           # All visible links
web-interact find role textbox                        # All text inputs
web-interact find text "Sign in"                      # Elements containing text
web-interact find text "Add to cart"                  # Partial text match
web-interact find label "Email address"               # Inputs by associated label
web-interact find placeholder "Search products..."    # Inputs by placeholder text
```

## Actions (silent on success, error text on failure)

### Click
```bash
web-interact click 3                                  # Click by discover index (CDP mouse event)
web-interact click ".submit-btn"                      # Click by CSS selector (DOM click)
web-interact dblclick 5                               # Double-click by index
web-interact dblclick "tr.row:first-child"            # Double-click by selector
```

### Text Input
```bash
web-interact type 2 "hello"                           # Type into element [2] (appends to existing)
web-interact type 2 "hello" --clear                   # Clear first, then type
web-interact fill 1 "john@example.com"                # fill = clear + type (use for form fields)
web-interact fill 4 "+1-555-0123"                     # Phone number
web-interact fill 6 "123 Main St, Apt 4B"             # Address with special chars
```

### Dropdowns and Checkboxes
```bash
web-interact select 5 "United States"                 # Select by visible text
web-interact select 5 "US"                            # Select by value
web-interact check 9                                  # Check checkbox or radio
web-interact uncheck 9                                # Uncheck checkbox
```

### Other Element Actions
```bash
web-interact hover 3                                  # Hover (triggers tooltips, menus)
web-interact focus "input.search"                     # Focus element by selector
web-interact scrollintoview 15                        # Scroll element into viewport
web-interact scrollintoview ".footer"                 # Scroll by selector
web-interact upload 7 ./resume.pdf                    # Upload file to file input
web-interact upload 7 ./photo1.jpg ./photo2.jpg       # Upload multiple files
web-interact drag 100 200 400 200                     # Drag from (100,200) to (400,200)
```

## Keyboard and Mouse

```bash
# Keyboard shortcuts and keys
web-interact press Enter                              # Press key
web-interact press Tab                                # Tab to next field
web-interact press Shift+Tab                          # Reverse tab
web-interact press Control+a                          # Select all
web-interact press Control+c                          # Copy
web-interact press Control+v                          # Paste
web-interact press Escape                             # Close modal/menu
web-interact press ArrowDown                          # Navigate dropdown
web-interact press Meta+Shift+Enter                   # Complex key combo

# Keyboard (no element target — types to active element)
web-interact keyboard type "Revenue 2024" --delay 50  # Type with delay between keys
web-interact keyboard insert "pasted text"            # Insert without key events
web-interact keyboard press Control+z                 # Undo
web-interact keyboard down Shift                      # Hold Shift
web-interact keyboard up Shift                        # Release Shift

# Mouse (viewport coordinates)
web-interact mouse move 500 300                       # Move cursor
web-interact mouse click 500 300                      # Left click at coords
web-interact mouse click 500 300 --button right       # Right click
web-interact mouse down                               # Button down
web-interact mouse up                                 # Button up
web-interact mouse wheel 0 -300                       # Scroll wheel (dx, dy)
```

## Scrolling

```bash
web-interact scroll down 500                          # Scroll page down 500px
web-interact scroll up 300                            # Scroll page up
web-interact scroll left 200                          # Scroll left
web-interact scroll right 200                         # Scroll right
web-interact scroll down 300 --selector ".sidebar"    # Scroll within element
```

## Reading Page State (prints raw value to stdout)

```bash
web-interact get url                                  # https://example.com/dashboard
web-interact get title                                # Dashboard - MyApp
web-interact get text "h1"                            # Main heading text
web-interact get text ".error-message"                # Error message (empty if none)
web-interact get text "#price"                        # Product price text
web-interact get html ".results"                      # Raw innerHTML
web-interact get value "input[name=email]"            # Current input value
web-interact get attr "a.logo" href                   # Attribute value
web-interact get attr "img.hero" src                  # Image source
web-interact get visible ".modal-overlay"             # true or false
web-interact get enabled "button.submit"              # true or false
web-interact get checked "input[name=agree]"          # true or false
web-interact get count ".search-result"               # Number: 42
web-interact get count "tr.data-row"                  # Row count
web-interact get styles "h1" font-size                # 32px
web-interact get styles ".btn-primary" background-color  # rgb(59, 130, 246)
web-interact get styles ".card"                       # All key styles (JSON)
web-interact get box ".hero"                          # {"x":0,"y":100,"width":1280,"height":400}
```

## JavaScript

```bash
web-interact eval "document.title"                    # Evaluate expression
web-interact eval "window.location.pathname"          # Current path
web-interact eval "document.querySelectorAll('li').length"  # Count elements
web-interact eval "Array.from(document.querySelectorAll('h2')).map(e => e.textContent.trim())"
web-interact eval "JSON.parse(document.querySelector('#__NEXT_DATA__').textContent)"
web-interact eval "window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart"
```

## Screenshots

```bash
web-interact screenshot                               # Default screenshot → prints file path
web-interact screenshot output.png                    # Custom output path
web-interact screenshot --full                        # Full scrollable page
web-interact screenshot --annotate                    # Numbered element overlays matching discover
web-interact screenshot --annotate --full             # Full page + annotations
```

## Waiting

```bash
web-interact wait ".results"                          # Wait for CSS selector
web-interact wait ".results" --hidden                 # Wait for element to disappear
web-interact wait --text "Payment confirmed"          # Wait for text on page
web-interact wait --text "Error"                      # Wait for error message
web-interact wait --url "**/order/confirmation"       # Wait for URL pattern
web-interact wait --url "**/dashboard"                # Wait for redirect
web-interact wait --load networkidle                  # Wait for network quiet
web-interact wait --load domcontentloaded             # Wait for DOM ready
web-interact wait 2000                                # Wait 2 seconds (hard pause)
web-interact wait                                     # Wait for networkidle (default)
```

## Accessibility

```bash
web-interact snapshot                                 # Full accessibility tree
# Output: structured tree with roles, names, levels
# - heading "Example Domain" [level=1]
# - paragraph: This domain is for...
# - link "Learn more" [cursor=pointer]
```

## Tabs

```bash
web-interact tab list                                 # JSON array of {id, url, title, name}
web-interact tab new "https://docs.example.com"       # Open URL in new tab
web-interact tab new                                  # Open blank tab
web-interact tab switch myTab                         # Bring tab to front
web-interact tab close myTab                          # Close tab
```

## Cookies

```bash
web-interact cookies get                              # All cookies (JSON array)
web-interact cookies set session_id abc123            # Set cookie on current URL
web-interact cookies set token xyz --domain .example.com  # Set with domain
web-interact cookies set prefs dark --path /settings  # Set with path
web-interact cookies clear                            # Clear all cookies
```

## Storage

```bash
web-interact storage local                            # All localStorage (JSON object)
web-interact storage local authToken                  # Get specific key value
web-interact storage local-set theme dark             # Set key/value
web-interact storage session                          # All sessionStorage
web-interact storage session user_id                  # Get specific key
web-interact storage session-set cart_count 3         # Set key/value
```

## Clipboard

```bash
web-interact clipboard read                           # Read clipboard text
web-interact clipboard write "copied text"            # Write to clipboard
```

## Network

```bash
web-interact network requests                         # Recent requests (JSON, last 50)
web-interact network requests --filter "api"          # Filter by URL substring
web-interact network requests --type fetch            # Filter by resource type
web-interact network block "*.analytics.com*"         # Block matching URLs (abort)
web-interact network route "*/api/users" --body '[{"id":1,"name":"Mock User"}]'
web-interact network route "*/api/config" --body '{"feature_flag":true}' --status 200
web-interact network route "*.ads.*" --abort          # Abort matching requests
web-interact network route "*/slow-endpoint" --body '{}' --status 503  # Simulate errors
web-interact network unroute "*/api/users"            # Remove specific route
web-interact network unroute                          # Remove all routes
```

## Settings

```bash
web-interact set viewport 1920 1080                   # Desktop viewport
web-interact set viewport 375 812                     # iPhone viewport
web-interact set viewport 768 1024                    # Tablet viewport
web-interact set media dark                           # Prefer dark color scheme
web-interact set media light                          # Prefer light
web-interact set geo 51.5074 -0.1278                  # Set geolocation (London)
web-interact set geo 40.7128 -74.0060                 # Set geolocation (NYC)
web-interact set offline on                           # Simulate offline
web-interact set offline off                          # Back online
web-interact set headers '{"Authorization":"Bearer tok_abc","Accept-Language":"fr-FR"}'
```

## PDF

```bash
web-interact pdf ./output.pdf                         # Save page as PDF
web-interact pdf ./report.pdf --page results          # Specific page
```

## Browser Management

```bash
web-interact status                                   # Daemon PID, uptime, browser count
web-interact browsers                                 # Table of browser instances
web-interact close                                    # Close current page
web-interact close --all                              # Close entire browser instance
web-interact stop                                     # Stop daemon and all browsers
web-interact install                                  # Install Patchright runtime + Chrome
```

## Global Flags

Every command accepts these flags:

```
--headless              Run without visible window
--browser NAME          Named browser instance (default: "default")
--connect [URL]         Connect to running Chrome (omit URL to auto-discover)
--vision                Plain screenshot after each command (path on stderr)
--vision --annotate     Screenshot with numbered element overlays after each command
--timeout SECONDS       Script timeout (default: 20)
--ignore-https-errors   Accept self-signed/expired certs
--page NAME             Named page within browser (default: "default")
```
