# DevTools Hub — Precision In-Browser Developer Utilities Suite

**DevTools Hub** is a modern, responsive, 100% client-side developer utility platform built with Angular 21, TypeScript strict mode, and Tailwind CSS. It provides 12 essential everyday developer tools with zero server-side dependencies, zero telemetry, and complete data privacy.

---

## 🔒 100% In-Browser Privacy Guarantee

DevTools Hub operates strictly within your local browser sandbox:
- **No external API calls:** No data entered into any tool is ever transmitted over the network.
- **Hardware-accelerated cryptography:** Cryptographic hashes and random values use the browser's native Web Crypto API (`crypto.subtle`, `crypto.getRandomValues`).
- **Local persistence:** Favorites, theme preference, and recently used tools are saved exclusively in your browser's `localStorage`.

---

## 🛠️ The 12 Developer Utilities

### 1. JSON & Data Tools
- **JSON Formatter** (`/tools/json-formatter`): Format JSON with 2 or 4 spaces, minify/compact mode, syntax error detection with line numbers, and sample data.
- **JSON Validator** (`/tools/json-validator`): Strict RFC 8259 validation, exact error line/column pointers, structural metrics (keys, arrays, depth).
- **JSON to CSV** (`/tools/json-to-csv`): Convert JSON arrays or nested API envelopes to RFC 4180 CSV, with interactive data grid preview, nested object flattening (`user.address`), array unwinding, and UTF-8 BOM download for Microsoft Excel.
- **CSV to JSON** (`/tools/csv-to-json`): Convert delimited files (comma, semicolon, tab, pipe) to structured JSON with automatic header detection, type inference (numbers/booleans), and preview.

### 2. Encoding & Decoding
- **Base64 Encoder / Decoder** (`/tools/base64`): Unicode/UTF-8 safe conversion supporting multilingual text, Urdu, Arabic, Chinese, and emojis. Supports URL-safe mode (`-`, `_`) and optional padding (`=`).
- **URL Encoder / Decoder** (`/tools/url-encoder`): RFC 3986 component encoding vs. full URL preserving modes, plus standard form space (`+`) encoding.

### 3. Security & Tokens
- **JWT Decoder** (`/tools/jwt-decoder`): Decode JSON Web Tokens (JWS) into readable headers and claims, with automated expiration tracking (`exp`, `nbf`, `iat`), human-readable relative time, and clear unverified signature advisories.
- **SHA-256 Hash Generator** (`/tools/sha256`): Irreversible NIST FIPS 180-4 cryptographic digest generator running asynchronously via `crypto.subtle.digest`. Supports uppercase/lowercase hex formatting and live character counters.

### 4. Generators & Formatters
- **UUID Generator** (`/tools/uuid-generator`): Cryptographically secure RFC 4122 v4 UUID generator using `crypto.getRandomValues()`. Batch generation (1 to 100), uppercase, hyphens, Windows Registry GUID braces (`{...}`), quotes, and individual item copy.

### 5. Date & Time
- **Timestamp Converter** (`/tools/timestamp`): Real-time live Unix epoch clock, bidirectional converter between Unix timestamps (seconds & milliseconds) and human-readable UTC/local dates, ISO 8601, and relative time expressions.

### 6. Testing & Development
- **Regex Tester** (`/tools/regex-tester`): Real-time regular expression tester with flags (`g`, `i`, `m`, `s`, `u`), capture group inspector, execution time metrics, zero-length loop safeguards, and quick presets (email, URL, IPv4, date, emoji).
- **Cron Builder** (`/tools/cron-builder`): 5-field interactive cron scheduler (Minute, Hour, Day of Month, Month, Day of Week), plain English schedule explainer, direct expression parser, and 10 common schedule presets.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js (v18.19+ or v20+)
- npm (v9+)

### Installation
```bash
git clone <repository-url>
cd "All Developers Tools Suite"
npm install
```

### Local Development Server
```bash
npm start
# or: ng serve
```
Navigate to `http://localhost:4200/`. The application will hot-reload automatically as you edit files.

### Global Search Shortcut
Press `Ctrl + K` (or `Cmd + K` on macOS) anywhere in the application to summon the instant tool command palette.

---

## 🧪 Testing & Verification

Execute the Vitest unit test suite across all 16 test suites:
```bash
npm test -- --watch=false
```
**Current Test Coverage:** 150/150 passing unit tests.

---

## 📦 Production Build

Compile optimized production assets:
```bash
npm run build
```
Build output is saved to `dist/devtools-hub`.
- **Initial Total Transfer:** ~81.27 kB (Gzipped)
- **Lazy Chunks:** Individual tool chunks lazily loaded on demand.

---

## 📐 Technology Architecture

- **Framework:** Angular 21 (Standalone Components, Signals API, `inject()`, Control Flow `@if` / `@for`)
- **Styling:** Tailwind CSS with custom design tokens (Primary `#3762EA`, neutral slate, dark mode class strategy)
- **Icons:** `@lucide/angular` dynamic SVG icon mapping
- **Parsing:** Browser native `TextEncoder`/`TextDecoder`, `JSON`, `RegExp`, `Intl.DateTimeFormat`, and PapaParse for CSV
- **Cryptography:** Native browser Web Crypto API (`window.crypto.subtle` & `window.crypto.getRandomValues`)
