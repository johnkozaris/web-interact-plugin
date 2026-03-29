# Workflow Patterns

Real-world patterns for common browser automation tasks.

## Important: login pages from major providers

NEVER use --headless for Google, Microsoft, Amazon, GitHub, Facebook login pages.
They enforce passkeys, device trust checks, and CAPTCHAs that headless cannot handle.
Use headed mode (no --headless) so the user can approve biometric/security prompts.

```bash
# WRONG — will get stuck on passkey/FIDO prompt:
web-interact --headless open "https://accounts.google.com"

# RIGHT — user sees the browser and can approve auth:
web-interact open "https://accounts.google.com"

# ALSO RIGHT — connect to user's existing logged-in Chrome:
web-interact --connect discover
```

## Login with redirect verification

```bash
web-interact --headless open "https://app.example.com/login"
web-interact --headless discover
# [1] input "Email" [2] input[password] "Password" [3] button "Sign in"
web-interact --headless fill 1 "user@company.com"
web-interact --headless fill 2 "s3cureP@ssw0rd!"
web-interact --headless click 3
web-interact --headless wait --url "**/dashboard"
web-interact --headless get url
# If login failed, URL stays on /login. Check for error:
web-interact --headless get text ".error-message"
```

## Login with 2FA code from page.evaluate

```bash
web-interact --headless open "https://secure.example.com/login"
web-interact --headless discover
web-interact --headless fill 1 "admin@corp.com"
web-interact --headless fill 2 "password"
web-interact --headless click 3
web-interact --headless wait ".otp-input"
# Compute TOTP in page context if you have the secret
web-interact --headless eval "(() => { const secret = 'JBSWY3DPEHPK3PXP'; /* TOTP logic */ return '123456'; })()"
# Or read it from an auth app / email and type it
web-interact --headless discover
web-interact --headless fill 1 "123456"
web-interact --headless click 2
```

## Multi-step form across pages

```bash
# Page 1: Personal info
web-interact --headless open "https://apply.example.com/step1"
web-interact --headless discover
web-interact --headless fill 2 "Jane Doe"
web-interact --headless fill 4 "jane@example.com"
web-interact --headless fill 6 "+44 7911 123456"
web-interact --headless click 8              # "Next" button
web-interact --headless wait --url "**/step2"

# Page 2: Address (indices auto-refresh after navigation)
web-interact --headless discover
web-interact --headless fill 1 "10 Downing Street"
web-interact --headless fill 3 "London"
web-interact --headless fill 5 "SW1A 2AA"
web-interact --headless select 7 "United Kingdom"
web-interact --headless click 9              # "Next"
web-interact --headless wait --url "**/step3"

# Page 3: Review and submit
web-interact --headless discover
web-interact --headless check 1              # "I agree to terms"
web-interact --headless click 3              # "Submit application"
web-interact --headless wait --text "Application received"
web-interact --headless get text ".confirmation-number"
```

## Search and extract results

```bash
web-interact --headless open "https://search.example.com"
web-interact --headless discover
web-interact --headless fill 1 "browser automation tools"
web-interact --headless press Enter
web-interact --headless wait ".search-results"
web-interact --headless get count ".result-item"
web-interact --headless eval "Array.from(document.querySelectorAll('.result-item')).map(r => ({title: r.querySelector('h3')?.textContent?.trim(), url: r.querySelector('a')?.href, snippet: r.querySelector('.snippet')?.textContent?.trim()}))"
```

## E-commerce: add to cart

```bash
web-interact --headless open "https://shop.example.com/products"
web-interact --headless discover
web-interact --headless click 5              # Product link
web-interact --headless wait --load networkidle
web-interact --headless discover
web-interact --headless select 3 "Large"     # Size dropdown
web-interact --headless select 5 "Blue"      # Color dropdown
web-interact --headless fill 7 "2"           # Quantity
web-interact --headless click 9              # "Add to Cart"
web-interact --headless wait --text "Added to cart"
web-interact --headless get text ".cart-count"
```

## File upload with verification

```bash
web-interact --headless open "https://upload.example.com"
web-interact --headless discover
web-interact --headless upload 3 ./document.pdf
web-interact --headless wait --text "document.pdf"
web-interact --headless get text ".upload-status"
web-interact --headless click 5              # "Submit"
```

## Multi-tab comparison

```bash
web-interact --headless open "https://pricing.example.com/basic" --page basic
web-interact --headless open "https://pricing.example.com/pro" --page pro
web-interact --headless open "https://pricing.example.com/enterprise" --page enterprise
web-interact --headless get text ".price" --page basic
web-interact --headless get text ".price" --page pro
web-interact --headless get text ".price" --page enterprise
web-interact --headless get text ".features-list" --page pro
```

## Canvas app (Google Sheets)

```bash
web-interact --headless open "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"
web-interact --headless wait --load networkidle
web-interact --headless discover
# discover only finds toolbar — canvas content is not in DOM
# Navigate to cell via Name Box
web-interact --headless click 1              # Name Box input
web-interact --headless keyboard type "A1"
web-interact --headless press Enter
web-interact --headless keyboard type "Revenue"
web-interact --headless press Tab            # Move to B1
web-interact --headless keyboard type "Q1"
web-interact --headless press Tab
web-interact --headless keyboard type "Q2"
web-interact --headless press Tab
web-interact --headless keyboard type "Q3"
web-interact --headless press Enter          # Move to A2
web-interact --headless keyboard type "Product A"
web-interact --headless press Tab
web-interact --headless keyboard type "50000"
web-interact --headless press Tab
web-interact --headless keyboard type "65000"
web-interact --headless screenshot           # Verify visual state
```

## Mock API for frontend testing

```bash
# Set up mocked endpoints before loading the page
web-interact --headless network route "*/api/users" --body '[{"id":1,"name":"Test User","email":"test@example.com"}]'
web-interact --headless network route "*/api/config" --body '{"maintenance_mode":false,"feature_flags":{"new_dashboard":true}}'
web-interact --headless network route "*/api/notifications" --body '[]'
web-interact --headless network block "*.analytics.com*"
web-interact --headless network block "*.tracking.*"

# Now load the app — it sees mocked data
web-interact --headless open "https://app.example.com"
web-interact --headless discover
web-interact --headless get text ".user-name"
# → "Test User"
```

## Visual regression check with --vision

```bash
# Plain screenshots after every action — agent interprets visually
web-interact --headless --vision open "https://myapp.example.com"
# stderr: vision:/path/to/vision.png

web-interact --headless --vision click 3
# stderr: vision:/path/to/vision.png  (updated after click)

# Add --annotate for numbered element overlays
web-interact --headless --vision --annotate open "https://myapp.example.com"
# stderr: vision:/path/to/vision.png  (with [1], [2], etc. on elements)
```

## Connect to user's running Chrome

```bash
# Auto-discover Chrome with remote debugging
web-interact --connect tab list
web-interact --connect discover
web-interact --connect screenshot --annotate
web-interact --connect get url

# Connect to specific debugging port
web-interact --connect ws://127.0.0.1:9222 tab list
```

## Error recovery: form validation failed

```bash
web-interact --headless click 10             # Submit
web-interact --headless wait 1000            # Brief wait for client-side validation
web-interact --headless get text ".error"     # Check for error message
# If error found, fix the field and resubmit:
web-interact --headless discover             # Re-discover to find error highlight
web-interact --headless fill 3 "valid@email.com"  # Fix the invalid field
web-interact --headless click 10             # Resubmit
```

## Error recovery: page didn't load

```bash
web-interact --headless open "https://slow-app.example.com" --timeout 30
web-interact --headless wait --load networkidle
web-interact --headless discover
# If 0 elements: SPA hasn't rendered yet
web-interact --headless wait 3000
web-interact --headless discover             # Try again
```

## Error recovery: modal blocking interaction

```bash
web-interact --headless get visible ".cookie-banner"
# true — cookie banner is blocking
web-interact --headless discover
# Find the "Accept" or "Dismiss" button in the banner
web-interact --headless click 1              # Accept cookies
web-interact --headless wait ".cookie-banner" --hidden   # Wait for banner to disappear
web-interact --headless discover             # Now discover the actual page elements
```

## Offline / network failure testing

```bash
web-interact --headless open "https://pwa.example.com"
web-interact --headless wait --load networkidle
web-interact --headless set offline on
web-interact --headless click 3              # Trigger an action that needs network
web-interact --headless get text ".offline-message"
web-interact --headless set offline off
web-interact --headless click 3              # Retry
web-interact --headless wait --text "Success"
```

## Dark mode testing

```bash
web-interact --headless set media dark
web-interact --headless open "https://myapp.example.com"
web-interact --headless screenshot dark-mode.png
web-interact --headless get styles "body" background-color
# → rgb(17, 24, 39)

web-interact --headless set media light
web-interact --headless open "https://myapp.example.com"
web-interact --headless screenshot light-mode.png
web-interact --headless get styles "body" background-color
# → rgb(255, 255, 255)
```

## Mobile viewport testing

```bash
web-interact --headless set viewport 375 812         # iPhone 13
web-interact --headless open "https://responsive.example.com"
web-interact --headless screenshot mobile.png
web-interact --headless get visible ".desktop-nav"   # Should be false on mobile
web-interact --headless get visible ".mobile-menu"   # Should be true

web-interact --headless set viewport 1920 1080       # Back to desktop
web-interact --headless open "https://responsive.example.com"
web-interact --headless screenshot desktop.png
```
