# Troubleshooting

Common problems and how to fix them.

## Command hangs / times out

**Symptom**: Command doesn't return within the timeout period.

**Cause 1: Modal or dialog blocking the page**
```bash
# Check for modals
web-interact --headless get visible ".modal"
web-interact --headless get visible ".overlay"
web-interact --headless get visible "[role=dialog]"
# If true, discover and dismiss it:
web-interact --headless discover
web-interact --headless click 1              # Usually "Accept" or "Close"
```

**Cause 2: Cookie consent banner blocking**
```bash
web-interact --headless discover
# If first elements are cookie buttons, click accept:
web-interact --headless click 1
web-interact --headless wait 500
```

**Cause 3: Page hasn't finished loading (JS-heavy SPA)**
```bash
web-interact --headless wait --load networkidle
web-interact --headless wait 3000            # Hard wait for client-side rendering
web-interact --headless discover
```

**Cause 4: JavaScript alert/confirm/prompt dialog**
```bash
# Pre-dismiss dialogs
web-interact --headless eval "window.alert = () => {}; window.confirm = () => true; window.prompt = () => ''"
```

**Cause 5: Timeout too short for slow operations**
```bash
web-interact --headless --timeout 60 open "https://slow-site.example.com"
```

## "Element [N] not found" error

**Cause 1: Page changed since last discover**
```bash
# Always re-discover after any page change
web-interact --headless discover
# Use the new indices
```

**Cause 2: Element is off-screen or in a different scroll position**
```bash
web-interact --headless scrollintoview 15    # Scroll element into view first
web-interact --headless click 15
```

**Cause 3: Element is inside a lazy-loaded section**
```bash
web-interact --headless scroll down 1000     # Scroll to trigger lazy load
web-interact --headless wait 1000
web-interact --headless discover             # Re-discover with new elements
```

## "No discover result" error

```bash
# Run discover first
web-interact --headless discover
# Then use indexed commands
web-interact --headless click 3
```

## Discover returns 0 elements

**Cause 1: Page is blank or loading**
```bash
web-interact --headless get url              # Verify we're on the right page
web-interact --headless wait --load networkidle
web-interact --headless wait 2000            # Wait for JS rendering
web-interact --headless discover
```

**Cause 2: Content is inside an iframe**
```bash
web-interact --headless eval "document.querySelectorAll('iframe').length"
# If > 0, the content is in an iframe. discover only sees the main frame.
```

**Cause 3: Page is entirely canvas-based (Google Sheets, Figma)**
```bash
# Canvas apps have very few DOM elements. Use keyboard + mouse instead:
web-interact --headless keyboard type "text"
web-interact --headless mouse click 500 300
web-interact --headless screenshot            # Verify visually
```

## Click doesn't seem to do anything

**Cause 1: Wrong element — labels vs inputs**
```bash
# discover output shows labels interleaved with inputs:
# [1] label
# [2] input "Email"
# Click [2] not [1]
```

**Cause 2: Element needs scrolling first**
```bash
web-interact --headless scrollintoview 10
web-interact --headless click 10
```

**Cause 3: Element is covered by another element (z-index)**
```bash
# Check if element is actually clickable
web-interact --headless get visible ".overlay"
# If overlay exists, dismiss it first
```

**Cause 4: SPA handles click with JS, needs CDP mouse event**
```bash
# click by index uses CDP (reliable for React/Vue/Angular)
web-interact --headless click 3              # Good: CDP mouse event
# click by selector uses DOM click (may not trigger React handlers)
web-interact --headless click ".my-button"   # May not work on React
```

## Fill/type doesn't update the field

**Cause 1: React controlled input needs proper events**
```bash
# fill uses CDP events which work with React
web-interact --headless fill 2 "text"        # This should work
# If it doesn't, try via keyboard:
web-interact --headless click 2              # Focus the input
web-interact --headless press Control+a      # Select all
web-interact --headless keyboard type "text" # Type via keyboard events
```

**Cause 2: Autocomplete input needs type, not fill**
```bash
# fill clears first, which may dismiss the autocomplete
# type appends keystroke by keystroke, triggering autocomplete
web-interact --headless type 3 "San Fran"
web-interact --headless wait ".suggestions"
```

## Browser won't launch

**Cause 1: SingletonLock stale file**
```bash
rm -f ~/.web-interact/browsers/default/browser-profile/SingletonLock
web-interact --headless open "https://example.com"
```

**Cause 2: Chrome not installed**
```bash
web-interact install                         # Install browser runtime + Chrome
```

**Cause 3: Another Chrome instance using the profile**
```bash
web-interact stop                            # Stop daemon and all browsers
web-interact --headless open "https://example.com"
```

## "Daemon connection closed unexpectedly"

```bash
# Restart the daemon
web-interact stop
web-interact --headless open "https://example.com"
```

If persistent, the daemon binary may be stale. Rebuild:
```bash
pnpm run bundle
cargo build --release
# Binary is at target/release/web-interact
```

## Screenshot is blank or wrong page

```bash
# Verify you're on the right page first
web-interact --headless get url
web-interact --headless get title

# Wait for content to render before screenshot
web-interact --headless wait --load networkidle
web-interact --headless screenshot

# Scroll to what you want to see first
web-interact --headless scroll down 500
web-interact --headless screenshot
```

## Login pages from major providers (Google, Microsoft, GitHub, etc.)

Major providers enforce passkeys, device trust, and CAPTCHAs that headless cannot handle.

```bash
# NEVER use --headless for these logins. Use headed mode:
web-interact open "https://accounts.google.com"
web-interact open "https://login.microsoftonline.com"
web-interact open "https://github.com/login"

# Or connect to an already-logged-in Chrome session:
web-interact --connect discover
```

After the user completes authentication in the visible browser, web-interact
can take over and continue automating the authenticated session.

## CAPTCHA or bot detection

```bash
# If you get blocked by CAPTCHA or bot detection:

# 1. Switch to assistant mode (Patchright + humanized delays)
web-interact mode assistant
web-interact open "https://site.com"

# 2. Try headed mode (no --headless)
web-interact open "https://site.com"

# 3. Connect to user's existing browser (already logged in)
web-interact --own-browser discover
# or: web-interact browser-mode real

# 4. Add --humanize for natural delays on any command
web-interact --humanize open "https://site.com"
```

## Network route not working

```bash
# Routes must be set BEFORE the page loads the resource
web-interact --headless network route "*/api/data" --body '{"mock":true}'
web-interact --headless open "https://app.example.com"   # Route active for this load

# Routes don't persist across page reloads by default
# Re-set routes after page.reload() or navigation
```

## eval returns undefined

```bash
# The expression must return a value
web-interact --headless eval "document.title"              # Good: returns string
web-interact --headless eval "console.log('hello')"        # Bad: returns undefined

# For complex logic, wrap in an IIFE
web-interact --headless eval "(() => { const x = 1 + 1; return x; })()"
```

## Cookies not persisting between commands

Cookies persist within a browser session. Each `--browser` name has its own session.
Cookies are lost when:
- The browser is closed (`web-interact close --all` or `web-interact stop`)
- A different `--browser` name is used

```bash
# Verify cookies are there
web-interact --headless cookies get
# If empty after login, the login may have failed silently
web-interact --headless get url              # Check if still on login page
```

## Storage commands fail with "SecurityError"

```bash
# localStorage/sessionStorage requires an actual page to be loaded on a domain
# You can't access storage on about:blank or before navigation
web-interact --headless open "https://example.com"   # Load a page first
web-interact --headless storage local                 # Now it works
```

## --connect mode: Chrome not found

```bash
# Chrome must be running with remote debugging enabled
# On macOS:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 &
sleep 2
web-interact --connect discover

# Chrome 136+ needs --user-data-dir for debugging to work on default profile:
killall "Google Chrome" 2>/dev/null; sleep 2
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-debug-profile" &
sleep 4
web-interact --connect get url
```

## Vision mode screenshot path

```bash
# --vision prints the screenshot path to stderr, not stdout
# In shell scripts, capture stderr separately:
web-interact --headless --vision click 3 2>vision_output.txt
VISION_PATH=$(grep "^vision:" vision_output.txt | cut -d: -f2-)
```
