<div align="center">

# 🛡️ ZeroTrace Tools

### Precision In-Browser & Native Desktop Developer Utilities Suite
**Fast, beautiful, offline-ready developer utilities — 100% private, client-side, zero tracking.**

[![Angular 21](https://img.shields.io/badge/Angular-21.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-166%2F166%20Passed-10B981?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Desktop Ready](https://img.shields.io/badge/Desktop-Electron%20%7C%20PWA-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-6366F1?style=for-the-badge&logo=shield&logoColor=white)](#-100-in-browser-privacy-guarantee)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<br/>

[Explore Tools](#-the-13-precision-developer-utilities) • [Quick Start](#-quick-start) • [Desktop App](#-native-desktop-app-electron) • [PWA](#-progressive-web-app-pwa) • [Testing](#-testing--quality-assurance) • [Architecture](#-architecture--design-system)

</div>

---

## 🔒 100% In-Browser Privacy Guarantee

Unlike common online developer utilities that send your sensitive data, production API payloads, and internal credentials to remote servers, **ZeroTrace Tools executes 100% inside your local browser sandbox**:

- 🛡️ **Zero Remote Network Calls:** Your tokens, database dumps, JSON structures, and images never leave your machine.
- ⚡ **Hardware-Accelerated Cryptography:** Uses browser native `crypto.subtle` and `crypto.getRandomValues()` for NIST FIPS-compliant hashes and secure UUIDs.
- 💾 **Local-Only State:** Favorites, theme preference, and usage history are persisted strictly in your browser's `localStorage`.
- ✈️ **Offline & Air-Gap Ready:** Works completely offline without an internet connection — ideal for enterprise environments and on-the-go development.

---

## 🛠️ The 13 Precision Developer Utilities

### 1. 🖼️ Image Tools
- **Image to Base64 Converter & Decoder** (`/tools/image-base64`)
  - **Encode:** Drag & drop or paste from clipboard (PNG, JPG, WEBP, SVG, GIF, BMP, ICO). Instant live preview, image dimensions, byte metrics, and +33% base64 overhead calculation.
  - **Export Formats:** Direct Data URI (`data:image/...;base64,...`), raw Base64 string, HTML `<img>` tag, CSS `background-image`, and JSON. Download as `.txt` or copy with one click.
  - **Decode:** Automatic format & MIME sniffing for raw strings or data URIs with checkered transparency preview canvas. Download as native image files with matching file extensions.

### 2. 🔄 Encoding & Decoding
- **Base64 Encoder / Decoder** (`/tools/base64`)
  - Unicode/UTF-8 safe conversion supporting multilingual alphabets, Chinese, Arabic, Urdu, and emoji characters without mangling.
  - Standard Base64 and URL-Safe (`-`, `_`) mode toggle with optional `=` padding control.
- **URL Encoder / Decoder** (`/tools/url-encoder`)
  - RFC 3986 component encoding (`encodeURIComponent`) vs. full URI preserving mode (`encodeURI`).
  - Space encoding option (`%20` vs `+`), automatic query parameter parsing table, and format statistics.

### 3. 📊 JSON & Data Tools
- **JSON Formatter & Minifier** (`/tools/json-formatter`)
  - Beautify JSON with 2-space or 4-space indentation, or minify to single-line for production transmission.
  - Syntax error diagnostics with exact line numbers, character counters, and byte savings ratio.
- **JSON Validator** (`/tools/json-validator`)
  - Strict RFC 8259 syntax validation with real-time error pointers (row/column coordinates).
  - Structural metrics: object keys count, array items count, nesting depth calculation, and type breakdowns.
- **JSON to CSV Converter** (`/tools/json-to-csv`)
  - Convert flat or deeply nested JSON object arrays into standard RFC 4180 CSV spreadsheets.
  - Dot-notation key flattening (`user.profile.email`), array unwinding, live tabular data preview, and UTF-8 BOM download for seamless Microsoft Excel compatibility.
- **CSV to JSON Converter** (`/tools/csv-to-json`)
  - Convert CSV and TSV text to structured JSON arrays.
  - Auto-detect delimiters (comma, semicolon, tab, pipe), automatic type inference for numbers and booleans, and malformed row reporting.

### 4. 🛡️ Security & Tokens
- **JWT Decoder & Inspector** (`/tools/jwt-decoder`)
  - Inspect JSON Web Tokens (JWS/JWT) header, claims payload, and signature components.
  - Real-time expiration tracking with live countdowns, human-readable relative time, and clear unverified signature warnings.
- **SHA-256 Hash Generator** (`/tools/sha256`)
  - Irreversible NIST FIPS 180-4 cryptographic digest generator running asynchronously via the Web Crypto API.
  - Case formatting toggle (lowercase / uppercase hex), live input character counter, and instant clipboard copy.

### 5. ✨ Generators & Identifiers
- **UUID / GUID Generator** (`/tools/uuid-generator`)
  - Generate cryptographically secure RFC 4122 Version 4 UUIDs using `crypto.getRandomValues()`.
  - Batch generation (1 to 100 IDs), uppercase/lowercase, optional hyphen stripping, Windows Registry GUID braces (`{...}`), and quotation wrapping.

### 6. ⏱️ Date & Time
- **Unix Timestamp Converter** (`/tools/timestamp`)
  - Real-time ticking Unix epoch clock (seconds and milliseconds).
  - Bidirectional conversion between Unix timestamps and ISO 8601, UTC, and localized human-readable dates with relative time ("in 3 hours", "2 days ago").

### 7. 🧪 Testing & Productivity
- **Regex Tester & Matcher** (`/tools/regex-tester`)
  - Real-time regex testing with flag toggles (`g`, `i`, `m`, `s`, `u`).
  - Capture group extraction, match positions (start/end indexes), catastrophic backtracking loop safeguards, and quick presets (Email, URL, IPv4, Date, Hex Color).
- **Cron Expression Builder & Parser** (`/tools/cron-builder`)
  - Visual 5-field scheduler (Minute, Hour, Day of Month, Month, Day of Week).
  - Bidirectional sync: construct visually with dropdowns or type raw cron expressions.
  - Human-readable English schedule explanation and upcoming execution runtimes list.

---

## ⌨️ Command Palette (`Ctrl + K`)

Press `Ctrl + K` (or `Cmd + K` on macOS) anywhere in the application to summon the instant fuzzy search modal. Quickly switch between tools, search by keywords, or jump to categories without taking your hands off the keyboard.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js:** v18.19+ or v20+
- **npm:** v9+

### Installation & Development Server
```bash
# Clone the repository
git clone https://github.com/zkashif060/all-developers-tool-suite.git

# Navigate into the project directory
cd all-developers-tool-suite

# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:4200` in your browser. The application will automatically reload when source files change.

---

## 🧪 Testing & Quality Assurance

ZeroTrace Tools features an extensive Vitest automated test suite covering every parsing engine, cryptographic algorithm, and utility service:

```bash
# Run all unit tests
npm test -- --watch=false
```

```
✓ 17 Test Suites Passed
✓ 166 Unit Tests Passed (100% Pass Rate)
✓ 0 Failures / 0 Errors
```

---

## 💻 Native Desktop App (Electron)

Package ZeroTrace Tools as an offline, hardware-accelerated desktop application for your operating system:

```bash
# Launch Electron locally in development mode
npm run electron:start

# Build installer for macOS (.dmg, .zip)
npm run dist:mac

# Build installer for Windows (.exe setup & portable)
npm run dist:win

# Build installer for Linux (.AppImage, .deb)
npm run dist:linux
```

Desktop builds output to the `release/` directory.

---

## 📱 Progressive Web App (PWA)

ZeroTrace Tools is fully configured with a Service Worker (`public/sw.js`) and Web Application Manifest (`public/manifest.webmanifest`).
- Installable on desktop Chrome, Edge, Brave, and macOS Safari.
- Installable on mobile iOS (Add to Home Screen) and Android.
- Pre-caches core application bundles for complete offline usage.

---

## 📦 Production Deployment

Build optimized static assets for zero-cost hosting on modern edge platforms:

```bash
npm run build
```

Compiled static output is generated in `dist/devtools-hub`. Deploy seamlessly with:

| Platform | Setup Command / Guide |
|---|---|
| **Cloudflare Pages** | Connect repository, build command: `npm run build`, output: `dist/devtools-hub/browser` |
| **Vercel** | `vercel deploy` (configured automatically via included `_redirects` & `_headers`) |
| **Netlify** | Connect repository, publish directory: `dist/devtools-hub/browser` |
| **GitHub Pages** | Use GitHub Actions to build and deploy static artifacts to GitHub Pages |

---

## 📐 Technology Architecture

- **Core Framework:** [Angular 21](https://angular.dev) (Standalone Components, Signals API, Control Flow Syntax, Lazy-Loaded Routes)
- **Styling System:** [Tailwind CSS 3.4](https://tailwindcss.com) with custom color tokens, dark mode class strategy, and custom scrollbars
- **Icons:** [Lucide Icons](https://lucide.dev) with clean lightweight SVG rendering
- **Unit Testing:** [Vitest](https://vitest.dev) with Angular Testing Library
- **Desktop Engine:** [Electron 45](https://www.electronjs.org) with context isolation and secure local file protocols
- **Offline Engine:** Progressive Web App Service Worker with cache-first asset strategy

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal, commercial, and enterprise usage.
