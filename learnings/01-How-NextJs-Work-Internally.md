Here is the **step-by-step flow** of what happens from the moment a user types your URL to when they click a button, using our Product Page example.

---

## Phase 1: The Request (Browser → Server)
```
User types "yourstore.com/product/123" → Presses Enter
```
| **Where** | **What happens** |
| :--- | :--- |
| **Browser** | Sends a GET request to your Next.js server. |
| **Server** | Receives the request and looks for `app/product/page.jsx`. |

---

## Phase 2: Server-Side Rendering (SSR) - The "80%"
**This all happens on the SERVER in milliseconds:**

```
Server executes ProductPage (Server Component)
```

| **Step** | **Code** | **Where** | **Output** |
| :--- | :--- | :--- | :--- |
| 1 | `await getProductData()` | **Server** | Fetches product data from database. |
| 2 | `<h1>{product.name}</h1>` | **Server** | Converts JSX to HTML string. |
| 3 | `<AddToCartButton />` | **Server** | Renders the Client Component placeholder. |
| 4 | Generates a **special JSON stream** (RSC Payload) | **Server** | Contains the rendered HTML + instructions for hydration. |
| 5 | Sends response back to browser | **Server → Browser** | Sends HTML + minimal JavaScript. |

**At this point:** The user sees the **full page** (product name, description, price, and a static button) almost instantly. 

```
📦 Total JS sent to browser: ~2KB (only for the button)
📦 Total JS NOT sent: ~500KB (database drivers, heavy logic stayed on server)
```

---

## Phase 3: Hydration (Browser - The "20%")
**This happens on the CLIENT after HTML loads:**

```
Browser receives HTML + RSC Payload
```

| **Step** | **What happens** | **Where** |
| :--- | :--- | :--- |
| 1 | Browser parses HTML and paints the page instantly. | **Client** |
| 2 | React reads the RSC Payload and "reconciles" the component tree. | **Client** |
| 3 | React spots `"use client"` in `AddToCartButton`. | **Client** |
| 4 | React attaches event listeners (`onClick`) to the button. | **Client** |
| 5 | `useState` becomes active. Button is now "alive". | **Client** |

**Result:** The page is now **interactive**. The button can respond to clicks.

---

## Phase 4: User Interaction (100% Client)
**User clicks the "Add to Cart" button:**

```
User clicks button → Client handles everything
```

| **Step** | **What happens** | **Where** |
| :--- | :--- | :--- |
| 1 | `onClick` triggers `handleClick()`. | **Client** |
| 2 | `setIsAdded(true)` updates state. | **Client** |
| 3 | React re-renders JUST the button (not the whole page). | **Client** |
| 4 | `localStorage.setItem()` saves to browser storage. | **Client** |
| 5 | Alert popup appears. | **Client** |

**Notice:** The server is **NOT** involved in this click. No network request. Instant feedback. 🚀

---

## Full Visual Flow Diagram

```
┌─────────────┐      ┌─────────────────────────────────────┐      ┌─────────────┐
│   USER      │      │           SERVER (Phase 2)          │      │   CLIENT    │
│ Types URL   │─────▶│  1. Fetch database                  │─────▶│  (Phase 3)  │
└─────────────┘      │  2. Generate HTML                   │      │  1. Paint   │
                     │  3. Send HTML + RSC Payload         │      │  2. Hydrate │
                     └─────────────────────────────────────┘      │  3. Alive!  │
                                                                  └─────────────┘
                                                                         │
                                                                         ▼
┌─────────────┐      ┌─────────────────────────────────────┐      ┌─────────────┐
│   USER      │      │        CLIENT (Phase 4)             │      │   CLIENT    │
│ Clicks      │─────▶│  1. Run onClick handler             │─────▶│  Button     │
│ Button      │      │  2. Update useState                 │      │  Re-renders │
└─────────────┘      │  3. Save to localStorage           │      │  (Instant)  │
                     └─────────────────────────────────────┘      └─────────────┘
```

---

## The 80/20 Summary Table

| **Phase** | **Runs On** | **What executes** | **Example** |
| :--- | :--- | :--- | :--- |
| **Initial Render** | Server | All Server Components + Static HTML | `getProductData()`, `<h1>`, `<p>` |
| **Hydration** | Client | Attaches event listeners to Client Components | `onClick` becomes active |
| **State Changes** | Client | `useState`, `useEffect`, browser APIs | `setIsAdded()`, `localStorage` |
| **Subsequent Navigation** | Server (for new pages) or Client (for cached) | Next.js decides based on Link prefetching | Clicking to another product page |

---

## The Golden Rule (Repeated)
- **80% of the initial page load** runs on the **Server** (fast, secure, SEO-friendly).
- **20% of interactions** (clicks, typing) run on the **Client** (smooth, instant).
- The server is **never** touched when the user clicks the button unless you explicitly make an API call (`fetch`).

This is why Server Components are a game-changer: **you get the speed of a static site with the interactivity of a single-page app!** 🎯