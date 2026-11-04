# DevTools Hub — Cloudflare Pages Production Deployment Guide

This guide provides step-by-step instructions for deploying the **DevTools Hub** application to **Cloudflare Pages** for global edge hosting, instant cache invalidation, and zero server maintenance.

---

## 1. Deployment Specification & Parameters

| Parameter | Value | Notes |
|---|---|---|
| **Platform** | Cloudflare Pages (JAMstack / Static SPA) | Free tier includes unlimited requests & bandwidth |
| **Framework Preset** | `Angular` (or `None`) | Standard static output |
| **Node.js Version** | `18.19.0` or `20.x` or `22.x` | Set via `NODE_VERSION` environment variable |
| **Build Command** | `npm run build` | Runs `ng build --configuration production` |
| **Build Output Directory** | `dist/devtools-hub/browser` | **CRITICAL:** Must include `/browser` subfolder |
| **Root Directory** | `/` (Repository root) | Where `package.json` resides |
| **SPA Route Fallback** | `_redirects` (`/*  /index.html  200`) | Pre-configured in `public/_redirects` |
| **Security Headers** | `_headers` | Pre-configured in `public/_headers` |

> [!IMPORTANT]
> **Output Directory Warning**: Angular 17+ with the modern application builder emits static browser assets into `dist/devtools-hub/browser`. Setting the output directory to `dist/devtools-hub` without `/browser` will result in a 404 error on Cloudflare Pages because `index.html` lives inside `browser/`.

---

## 2. Pre-Configured Cloudflare Pages Assets

The following files are maintained in `public/` and automatically bundled into `dist/devtools-hub/browser/` during every production build:

1. **`_redirects`** (`public/_redirects`):
   ```
   /*    /index.html   200
   ```
   Ensures direct browser navigation and page refreshes on any of the 12 utility routes (e.g., `/tools/json-to-csv`, `/tools/jwt-decoder`) serve `/index.html` with an HTTP 200 status, allowing Angular Router to resolve the route without 404 errors.

2. **`_headers`** (`public/_headers`):
   - Sets strict security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
   - Enables 1-year immutable caching (`max-age=31536000, immutable`) on content-hashed chunks (`chunk-*.js`, `styles-*.css`).
   - Disables stale caching on `index.html` (`max-age=0, must-revalidate`) so updates go live immediately upon deployment.

3. **`robots.txt` & `sitemap.xml`** (`public/robots.txt`, `public/sitemap.xml`):
   - Configures search engine crawl rules and indexes all 16 application routes.

---

## 3. Step-by-Step Deployment Instructions

Choose either **Method A (Git Integration — Recommended)** or **Method B (Wrangler Direct Upload CLI)**.

### Method A: Git Integration (Recommended for Continuous Deployment)

1. **Push Repository to GitHub or GitLab**:
   Ensure all changes are committed and pushed to your remote repository.

2. **Log into Cloudflare Dashboard**:
   - Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Select your Git account and choose the `All Developers Tools Suite` repository.

3. **Configure Build Settings**:
   - **Project Name**: `devtools-hub` (or your preferred name)
   - **Production Branch**: `main` (or `master`)
   - **Framework Preset**: `Angular` (or `None`)
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist/devtools-hub/browser`

4. **Add Environment Variable**:
   Under **Environment variables (advanced)**, add:
   - Variable name: `NODE_VERSION`
   - Value: `20.18.0` (or `22.x`)

5. **Deploy**:
   - Click **Save and Deploy**.
   - Cloudflare will clone the repo, run `npm install`, execute `npm run build`, and publish `dist/devtools-hub/browser` across its global edge network.
   - Your site will be live at `https://devtools-hub.pages.dev`.

---

### Method B: Wrangler CLI Direct Upload (No Git Required)

If you wish to deploy directly from your local terminal without connecting Git:

1. **Run Local Production Build**:
   ```bash
   npm run build
   ```

2. **Login to Cloudflare via Wrangler**:
   ```bash
   npx wrangler login
   ```

3. **Deploy the Output Folder**:
   ```bash
   npx wrangler pages deploy dist/devtools-hub/browser --project-name=devtools-hub
   ```

4. Wrangler will package the `browser` folder, upload the assets to Cloudflare Pages, and output your live deployment URL.

---

## 4. Custom Domain Configuration (Optional)

To connect your own domain (e.g. `devtools.yourdomain.com` or `devtoolshub.com`):

1. In the Cloudflare Dashboard, open your Pages project (**devtools-hub**).
2. Go to the **Custom domains** tab.
3. Click **Set up a custom domain**.
4. Enter your domain name and follow the DNS verification instructions:
   - If your domain's DNS is managed by Cloudflare, it will automatically configure the CNAME record with zero downtime.
   - If using an external registrar (Namecheap, GoDaddy, Route 53), add a CNAME record pointing to `devtools-hub.pages.dev`.
5. Cloudflare automatically provisions and renews a free Universal SSL/TLS certificate for your custom domain.

---

## 5. Post-Deployment Verification Checklist

Verify the following after deployment:

- [ ] **Root Route**: Visiting `https://<your-project>.pages.dev/` redirects seamlessly to `/dashboard`.
- [ ] **Direct Nested Navigation**: Navigating directly to `https://<your-project>.pages.dev/tools/json-to-csv` loads the tool without a 404 error.
- [ ] **Browser Refresh**: Pressing `F5` / `Ctrl+R` on `/tools/jwt-decoder` reloads the page with status 200.
- [ ] **Network Isolation**: Open Developer Tools (`F12`), paste data into any tool, and verify that 0 outbound network requests occur.
- [ ] **LocalStorage Persistence**: Toggle dark mode, star a favorite tool, and refresh the browser — preferences persist correctly.
- [ ] **Asset Caching**: Verify in the Network tab that JS chunks load with `Cache-Control: public, max-age=31536000, immutable`.

---

## 6. Troubleshooting Common Issues

### Issue 1: "404 Not Found" on Page Refresh
- **Cause:** Cloudflare Pages is looking for a physical `.html` file matching the route.
- **Solution:** Verify that `_redirects` exists in `dist/devtools-hub/browser/_redirects` containing `/*  /index.html  200`.

### Issue 2: "Page Not Found / Missing Assets" After Initial Deployment
- **Cause:** Build output directory in Cloudflare Pages was set to `dist/devtools-hub` instead of `dist/devtools-hub/browser`.
- **Solution:** Go to **Pages Project Settings** > **Builds & deployments** > **Build configuration**, change **Build output directory** to `dist/devtools-hub/browser`, and trigger a new deployment.

### Issue 3: Build Fails with "Node version incompatible"
- **Cause:** Cloudflare Pages default Node.js version may be older (e.g. v12 or v14).
- **Solution:** Set the environment variable `NODE_VERSION` to `20.18.0` in the Pages project settings.

