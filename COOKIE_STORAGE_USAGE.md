## How & Where Cookies Are Used in Your Website

### 1. **Sidebar State Cookie** (Admin Only)
**Location:** `src/components/ui/sidebar.tsx`  
**Cookie Name:** `sidebar_state`  
**Purpose:** Remember if admin sidebar is expanded or collapsed  
**Expiration:** 7 days  

**How it works:**
```typescript
// Line 85 in sidebar.tsx
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
// Saves when user toggles sidebar (Cmd+B keyboard shortcut)
```

**Where it's used:** Every time admin opens /admin, the sidebar state persists.

---

### 2. **Theme Preference** (Local Storage - NOT a cookie)
**Location:** `src/utils/themeGenerator.js`  
**Storage Type:** localStorage (not cookie)  
**Purpose:** Remember user's light/dark theme choice  
**Expiration:** Never (only cleared if user clears browser storage)

**How it works:**
```javascript
// Line 67 in themeGenerator.js
localStorage.setItem('site-theme', JSON.stringify(theme));

// Line 75 - Load on page load
const saved = localStorage.getItem('site-theme');
```

**Where it's used:** Loads automatically in `App.jsx` via `loadSavedTheme()` before rendering.

---

### 3. **Stripe Checkout Session Data** (Session Storage)
**Location:** `src/pages/storefront/buy/PaymentSection.jsx`  
**Storage Type:** sessionStorage (NOT a cookie)  
**Purpose:** Temporarily store checkout data when redirecting to Stripe  
**Expiration:** Cleared when browser tab closes

**How it works:**
```javascript
// Lines 699-705 in PaymentSection.jsx
sessionStorage.setItem("stripe_session_id", data.session_id);
sessionStorage.setItem("product_id", item.id);
sessionStorage.setItem("customer_email", normalizedEmail);
if (user?.id) {
  sessionStorage.setItem("customer_user_id", user.id);
}
```

**Where it's used:** 
- Stored right before user is redirected to Stripe payment page
- Used to persist checkout context across redirect
- Presumably retrieved on return from Stripe (though ThankYou.jsx doesn't currently retrieve it)

---

### 4. **Currency Rates Cache** (Session Storage)
**Location:** `src/services/marketData.js`  
**Storage Type:** sessionStorage (NOT a cookie)  
**Purpose:** Cache USD conversion rates during user's session  
**Expiration:** 1 hour TTL or session end

**How it works:**
```javascript
// Lines 58-77 in marketData.js
const readRatesFromSession = () => {
  const raw = sessionStorage.getItem(RATES_CACHE_KEY);
  // Check if cache is still valid (not older than 1 hour)
  if (Date.now() - parsed.fetchedAt > RATES_TTL_MS) {
    return null; // Cache expired
  }
  return parsed.rates;
};

// Line 95
const sessionRates = readRatesFromSession();
if (sessionRates) {
  return sessionRates; // Use cached rates
}
```

**Where it's used:** Every time prices are shown in different currencies (checkout, offerings pages).

---

### 5. **Cookie Consent** (New)
**Location:** `src/components/common/CookieConsentBanner.jsx`  
**Cookie Name:** `site-cookie-consent`  
**Purpose:** Remember user has acknowledged cookie notice  
**Expiration:** 1 year

**How it works:**
```javascript
// Line 18 in CookieConsentBanner.jsx
document.cookie = `${CONSENT_COOKIE_KEY}=accepted; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}`;

// Line 9-14 - Check if already accepted
return document.cookie.split(';').some((cookie) => 
  cookie.startsWith(`${CONSENT_COOKIE_KEY}=`)
);
```

**Where it's used:** Banner doesn't re-appear after user clicks "Accept all".

---

## Summary Table

| Storage Type | Name | Location | Purpose | Duration |
|---|---|---|---|---|
| **Cookie** | `sidebar_state` | Admin sidebar (sidebar.tsx) | Remember expand/collapse state | 7 days |
| **localStorage** | `site-theme` | Theme switcher (themeGenerator.js) | Remember theme preference | Until cleared |
| **sessionStorage** | `stripe_session_id` | Checkout (PaymentSection.jsx) | Store payment session ID | Until tab closes |
| **sessionStorage** | `product_id` | Checkout (PaymentSection.jsx) | Store product being purchased | Until tab closes |
| **sessionStorage** | `customer_email` | Checkout (PaymentSection.jsx) | Store customer email | Until tab closes |
| **sessionStorage** | `customer_user_id` | Checkout (PaymentSection.jsx) | Store user ID | Until tab closes |
| **sessionStorage** | `usd_rates_cache` | Market data (marketData.js) | Cache currency rates | 1 hour or tab close |
| **Cookie** | `site-cookie-consent` | Cookie banner | Remember consent acknowledgment | 1 year |

---

## Key Insights

✅ **All are essential/functional** - no tracking or advertising storage  
✅ **Minimal storage footprint** - only what's needed for features to work  
✅ **Session storage is more ephemeral** - clears when user closes tab  
✅ **Theme preference uses localStorage** - persists even across browser restart  
✅ **Checkout data is temporary** - only lives during payment process  

**No user data leaks to third parties.**
