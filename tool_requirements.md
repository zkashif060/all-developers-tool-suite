# DevTools Hub — Individual Tool Technical Requirements

This document provides exhaustive technical specifications, input/output contracts, error-handling mechanisms, and security boundaries for all 12 tools in DevTools Hub.

---

## 1. JSON Formatter

### 1.1 Overview
Provides instant formatting, pretty-printing, and minification of JSON documents with configurable indentation, size metrics, and clipboard/download actions.

### 1.2 Technical Specifications
- **Input:** Raw JSON string via textarea or file drop (`.json`).
- **Options:**
  - `indentation`: `2-spaces` (default), `4-spaces`, `tabs`.
  - `operation`: `format` | `minify`.
  - `sortKeys`: Boolean (alphabetically sorts object keys if enabled).
- **Engine Logic:**
  ```typescript
  export function formatJson(raw: string, indent: number | '\t', sortKeys = false): string {
    const parsed = JSON.parse(raw, (key, value) => {
      if (sortKeys && value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value).sort().reduce((sorted: any, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {});
      }
      return value;
    });
    return JSON.stringify(parsed, null, indent);
  }

  export function minifyJson(raw: string): string {
    return JSON.stringify(JSON.parse(raw));
  }
  ```
- **Error Handling:**
  - Extracts line and column number from `SyntaxError.message` (e.g. `Unexpected token '}' at position 142` or `at line 4 column 12`).
  - Displays localized error banner highlighting the character position and surrounding lines.
- **Metrics Displayed:**
  - Original Byte Size vs Output Byte Size
  - Compression/Expansion Ratio (%)
  - Line Count
- **Actions:** Format, Minify, Copy Output, Download `.json`, Clear, Load Sample JSON.

---

## 2. JSON Validator

### 2.1 Overview
Strict RFC 8259-compliant JSON syntax verification. Analyzes structural integrity, identifies parse failures with exact coordinates, and displays structural statistics (depth, total keys, array lengths) without altering the user's input.

### 2.2 Technical Specifications
- **Input:** Raw text input or file drop.
- **Options:**
  - `strictPrimitives`: Check if input is a valid top-level object/array vs standalone primitive (string, number, boolean).
- **Engine Logic:**
  - Uses native `JSON.parse()` within a safe try-catch wrapper.
  - Recursively computes structural depth, key count, array count, and primitive count when valid.
  - **Strict Rule:** Does NOT silently modify input or format without user interaction.
- **Error Diagnostics:**
  - Regex-based parser scans position index to calculate exact Line number and Column number:
    ```typescript
    export function getErrorCoordinates(input: string, position: number): { line: number; column: number; snippet: string } {
      const lines = input.slice(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      const allLines = input.split('\n');
      const snippet = allLines.slice(Math.max(0, line - 2), line + 1).join('\n');
      return { line, column, snippet };
    }
    ```
- **Visual State:**
  - Large status indicator: "Valid JSON" (Green) or "Invalid JSON" (Red).
  - Diagnostic drawer displaying SyntaxError details.
- **Actions:** Validate, Clear, Load Sample Valid JSON, Load Sample Broken JSON.

---

## 3. JSON to CSV Converter

### 3.1 Overview
Transforms JSON arrays of objects into structured, RFC 4180-compliant CSV format with support for custom delimiters, nested object flattening, and download capabilities.

### 3.2 Technical Specifications
- **Input:** JSON array of objects `[ { ... }, { ... } ]` or a single JSON object.
- **Configurable Options:**
  - `delimiter`: Comma (`,`), Semicolon (`;`), Tab (`\t`).
  - `nestedStrategy`:
    - `flatten`: Nested properties are flattened using dot notation (`user.address.city`).
    - `stringify`: Nested objects and arrays are preserved as escaped JSON strings (`"{\"city\":\"NY\"}"`).
  - `includeHeader`: Boolean (default `true`).
  - `quoteAll`: Boolean (default `false` — quotes only fields containing delimiter, newline, or quotes).
- **Engine Logic:**
  - Employs `Papa.unparse()` for RFC 4180 compliance.
  - Custom flattener utility:
    ```typescript
    export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
      return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          acc[pre + k] = JSON.stringify(obj[k]);
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    }
    ```
- **Edge Cases Handled:**
  - Missing keys across heterogeneous objects: Automatically scans all objects in the array to build a complete union of header columns; missing fields evaluate to empty string `""`.
  - Values containing quotes, commas, and multiline returns: Properly quoted and double-quoted (`"val""ue"`).
- **Outputs & Actions:**
  - Interactive Table Preview (first 10 rows) + Raw CSV Code Preview.
  - Copy CSV, Download `.csv`, Load Sample Data.

---

## 4. CSV to JSON Converter

### 4.1 Overview
Parses raw CSV content into clean, formatted JSON arrays using PapaParse. Handles diverse delimiters, quoted strings, line breaks, and dynamic data type coercion.

### 4.2 Technical Specifications
- **Input:** Raw CSV string or file drop (`.csv`).
- **Configurable Options:**
  - `hasHeader`: Boolean (default `true`). If false, produces array of arrays.
  - `dynamicTyping`: Boolean (auto-converts numbers, `true`/`false`, `null` to native types).
  - `delimiter`: Auto-detect or explicit (`,`, `;`, `|`, `\t`).
  - `skipEmptyLines`: Boolean (default `true`).
- **Engine Logic:**
  - Wrapped around `Papa.parse(csvString, config)`.
  - Structured error collector surface warnings (e.g. `TooFewFields`, `UndetectableDelimiter`).
- **Error Handling:**
  - Reports row-level parsing errors directly in the UI.
- **Outputs & Actions:**
  - Formatted JSON output pane.
  - Item count metric (`X rows converted`).
  - Copy JSON, Download `.json`, Load Sample CSV.

---

## 5. Base64 Encoder / Decoder

### 5.1 Overview
Robust encoding and decoding between raw UTF-8 text and Base64 representations. Completely eliminates legacy `escape`/`unescape` hacks in favor of the modern `TextEncoder` / `TextDecoder` APIs.

### 5.2 Technical Specifications
- **Input:** UTF-8 Text (for encoding) or Base64 string (for decoding).
- **Configurable Modes:**
  - Mode: `Encode` | `Decode`.
  - `urlSafe`: Boolean (replaces `+` with `-`, `/` with `_`, and strips trailing padding `=`).
- **Engine Logic (Unicode Safe):**
  ```typescript
  export function encodeBase64(input: string, urlSafe = false): string {
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let base64 = btoa(binary);
    if (urlSafe) {
      base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return base64;
  }

  export function decodeBase64(input: string, urlSafe = false): string {
    let clean = input.trim();
    if (urlSafe) {
      clean = clean.replace(/-/g, '+').replace(/_/g, '/');
      while (clean.length % 4) {
        clean += '=';
      }
    }
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  ```
- **Error Handling:**
  - Catches invalid Base64 character sets or invalid length boundaries.
  - Catches UTF-8 decoding failures (malformed byte sequences) when `{ fatal: true }` detects invalid character boundaries.
- **Actions:** Switch Mode, Copy Output, Download Result, Clear, Load Sample Text.

---

## 6. URL Encoder / Decoder

### 6.1 Overview
Encodes and decodes URLs and URL query components. Provides visual clarification on the critical functional differences between `encodeURIComponent` and `encodeURI`.

### 6.2 Technical Specifications
- **Input:** Raw URL or query string component.
- **Options:**
  - Mode: `Encode` | `Decode`.
  - Scope:
    - `Component` (`encodeURIComponent` / `decodeURIComponent`): Encodes all reserved punctuation (`; , / ? : @ & = + $ #`).
    - `Full URL` (`encodeURI` / `decodeURI`): Preserves URL protocol, host, and path structural characters.
- **Engine Logic:**
  - Real-time conversion with safe error traps for malformed sequences like `%E0%A4%9` or trailing unescaped `%`.
- **Educational UI Component:**
  - In-app comparison table explaining which characters are preserved in Component vs Full URL mode.
  - URL Query Parameters Parser: Automatically parses and displays detected query key-value pairs in a readable inspector table.
- **Actions:** Copy, Clear, Switch Mode, Load Sample URL.

---

## 7. JWT Decoder

### 7.1 Overview
Decodes and inspects JSON Web Tokens (JWT) directly in the client. Surfaces header metadata, claims payload, and calculates real-time token expiration status without sending tokens across the network.

### 7.2 Technical Specifications
- **Input:** Raw JWT string in `header.payload.signature` format.
- **Security & Privacy Banner (Prominent):**
  > **SECURITY NOTICE:** Token decoding happens entirely within your browser sandbox. The signature is NOT verified cryptographically here. Verification requires your backend authentication server and private secrets. Never submit live production secrets.
- **Engine Logic:**
  - Splits on `.` character to extract 3 distinct segments.
  - Decodes base64url encoded parts 0 (Header) and 1 (Payload) using `decodeBase64(part, true)`.
  - Parses JSON structures for both Header and Payload.
- **Timestamp & Expiration Inspector:**
  - Automatically identifies claims:
    - `exp` (Expiration Time)
    - `iat` (Issued At)
    - `nbf` (Not Before)
  - Displays human-readable ISO-8601 timestamps and localized date strings.
  - Computes active status:
    - `ACTIVE`: Displays countdown time remaining (`Expires in 42 minutes`).
    - `EXPIRED`: Displays elapsed expiration (`Expired 3 hours ago`).
- **Error Handling:**
  - Verifies 3-part segment structure.
  - Catches invalid Base64URL or invalid JSON payload formatting.
- **Actions:** Copy Header JSON, Copy Payload JSON, Clear, Load Sample JWT.

---

## 8. UUID Generator

### 8.1 Overview
Generates cryptographically secure Version 4 Universally Unique Identifiers (UUID v4) using native browser Web Crypto APIs.

### 8.2 Technical Specifications
- **Algorithm:**
  - Primary: `crypto.randomUUID()`.
  - Fallback (where supported): `crypto.getRandomValues(new Uint8Array(16))` formatted conforming to RFC 4122 v4 spec.
  - **Strict Requirement:** Under no circumstances is `Math.random()` used.
- **Configurable Options:**
  - `quantity`: Number of UUIDs to generate (1 to 100, default `1`).
  - `casing`: `lowercase` (default) | `uppercase`.
  - `hyphens`: Boolean (default `true`; if false, outputs 32-character continuous hex).
  - `brackets`: None (default) | Curly `{...}`.
- **Bulk Output Support:**
  - List view with individual copy buttons.
  - Combined text block for batch copying.
- **Actions:** Generate New Batch, Copy All, Copy Selected, Download as `.txt`.

---

## 9. Timestamp Converter

### 9.1 Overview
Converts between Unix epoch timestamps (seconds & milliseconds) and human-readable UTC and local date/time representations.

### 9.2 Technical Specifications
- **Input Modes:**
  1. **Epoch to Date:** Accepts 10-digit (seconds) or 13-digit (milliseconds) integer. Auto-detects scale.
  2. **Date to Epoch:** Interactive date/time picker (year, month, day, hours, minutes, seconds).
- **Engine Logic:**
  - Converts between `Date` object and integer epochs.
  - Outputs formatted:
    - ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
    - RFC 2822 (`ddd, DD MMM YYYY HH:mm:ss GMT`)
    - Local Formatted String with Timezone offset (e.g. `GMT+05:00`)
    - Relative time string (e.g., `in 5 days`, `2 hours ago`)
- **Live Clock Feature:**
  - Displays a real-time ticking current Unix timestamp with Pause / Copy button.
- **Error Handling:**
  - Traps non-numeric characters, NaN, negative values, and extreme out-of-range dates (> year 275760).
- **Actions:** Convert, Set to Current Time, Copy Milliseconds, Copy Seconds, Copy ISO String.

---

## 10. Regex Tester

### 10.1 Overview
Interactive regular expression evaluation and test sandbox. Evaluates regex expressions against test strings in real-time, displays match counts, indices, and capture groups, and highlights matches visually.

### 10.2 Technical Specifications
- **Inputs:**
  - `pattern`: Regular expression string.
  - `flags`: Checkboxes for `g` (global), `i` (case-insensitive), `m` (multiline), `s` (dotAll), `u` (unicode), `y` (sticky).
  - `testString`: Multi-line text block to evaluate.
- **Engine Logic:**
  ```typescript
  export interface RegexMatchResult {
    index: number;
    match: string;
    groups: Record<string, string> | string[];
    end: number;
  }

  export function testRegex(pattern: string, flags: string, text: string): { matches: RegexMatchResult[]; error?: string } {
    try {
      const regex = new RegExp(pattern, flags);
      const matches: RegexMatchResult[] = [];
      if (!flags.includes('g')) {
        const m = regex.exec(text);
        if (m) {
          matches.push({ index: m.index, match: m[0], groups: m.groups || m.slice(1), end: m.index + m[0].length });
        }
      } else {
        let m: RegExpExecArray | null;
        let count = 0;
        const maxMatches = 5000; // Protection against infinite loops
        while ((m = regex.exec(text)) !== null && count < maxMatches) {
          matches.push({ index: m.index, match: m[0], groups: m.groups || m.slice(1), end: m.index + m[0].length });
          if (m.index === regex.lastIndex) regex.lastIndex++;
          count++;
        }
      }
      return { matches };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }
  ```
- **ReDoS Protection & Browser Safeguards:**
  - Text length warning for strings exceeding 100,000 characters.
  - Maximum match threshold (5,000 matches) prevents browser UI lockups on empty matches (`/(?:)*/g`).
  - Clear UX note explaining catastrophic backtracking in JavaScript's V8 regex engine.
- **Visual Highlighting:**
  - Safe HTML generation highlighting matched spans with alternating amber/blue highlights and tooltips showing match index.
- **Actions:** Copy Matches as JSON, Clear, Load Preset Regex (Email, URL, IP Address, Phone Number).

---

## 11. Cron Expression Builder & Parser

### 11.1 Overview
Visual builder and validator for standard 5-field cron expressions (`minute hour day-of-month month day-of-week`). Provides two-way synchronization between visual controls, cron syntax, and plain-English schedule explanations.

### 11.2 Technical Specifications
- **Standard Cron Format:** `* * * * *` (5 fields: Minute `0-59`, Hour `0-23`, Day `1-31`, Month `1-12`, Day-of-Week `0-6` Sun-Sat).
- **Features:**
  1. **Visual Builder Tabs:**
     - Minute: Every X minutes, Specific minute.
     - Hour: Every X hours, Specific hour.
     - Day: Every day, Specific day of month.
     - Month: Every month, Specific months.
     - Day of Week: Every day, Specific weekdays (Mon-Fri) or weekend.
  2. **Direct Text Input:** Two-way bound text input for manual typing.
  3. **Plain English Explanation Generator:**
     - Translates expression into natural language (e.g. `*/15 * * * *` -> "Every 15 minutes", `0 0 * * 0` -> "At 00:00 on Sunday").
  4. **Common Presets:**
     - "Every minute" (`* * * * *`)
     - "Every 15 minutes" (`*/15 * * * *`)
     - "Hourly at :00" (`0 * * * *`)
     - "Daily at midnight" (`0 0 * * *`)
     - "Every weekday at 9:00 AM" (`0 9 * * 1-5`)
     - "Weekly on Sunday" (`0 0 * * 0`)
- **Syntax Validation:**
  - Validates character set (`*`, `-`, `,`, `/`, digits).
  - Validates field ranges.
- **Architectural Disclaimers:**
  - Clearly documents timezone caveats: Cron expressions are timezone-agnostic until scheduled within a specific cron runner (e.g., UTC server vs local server).
  - Disclaims variation across cron engines (Quartz 6-field vs Linux crontab 5-field).
  - Does NOT guess or claim to compute arbitrary future run dates without a designated timezone context.
- **Actions:** Copy Expression, Copy English Description, Reset to Default, Select Preset.

---

## 12. SHA-256 Hash Generator

### 12.1 Overview
Generates cryptographic SHA-256 digests of text inputs directly in the browser using the native Web Crypto API (`SubtleCrypto`).

### 12.2 Technical Specifications
- **Input:** Raw text input via textarea or file drop.
- **Options:**
  - `casing`: `lowercase` (default) | `uppercase`.
- **Engine Logic:**
  ```typescript
  export async function generateSha256(text: string): Promise<string> {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API is not available. Please ensure the application is served over HTTPS or localhost.');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  ```
- **Security & Educational Clarifications:**
  - Prominent in-app banner explaining:
    1. **One-Way Function:** Hashing is NOT encryption. A hash cannot be "decrypted" or reversed.
    2. **Deterministic:** Identical inputs will always produce the identical 64-character hexadecimal digest.
    3. **Password Storage:** Plain SHA-256 without salt or key-stretching (e.g., Argon2, bcrypt, PBKDF2) is vulnerable to rainbow table attacks.
- **Metrics Displayed:**
  - Digest length (256 bits / 32 bytes / 64 hex characters)
  - Input character and byte count
- **Actions:** Copy Hash, Download Hash `.txt`, Clear, Load Sample Text.

