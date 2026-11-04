# DevTools Hub — Proposed Folder & File Structure

This document outlines the complete directory layout and module organization for **DevTools Hub**, adhering to modern Angular (v19/v20) standalone component architecture and clean software engineering practices.

---

## 1. High-Level Directory Overview

```text
devtools-hub/
├── .vscode/                      # Editor configuration (extensions, launch, settings)
├── public/                       # Static public assets, favicon, icons, manifest
├── src/
│   ├── app/                      # Main Angular application root
│   │   ├── core/                 # Singleton services, models, constants, tool registry
│   │   ├── shared/               # Reusable UI components, pipes, directives
│   │   ├── layout/               # Application shell, sidebar, navbar, footer
│   │   ├── pages/                # High-level route pages (Dashboard, All Tools, Favorites, About)
│   │   ├── tools/                # 12 Independent tool modules (standalone components + engines)
│   │   ├── app.component.ts      # Root shell component
│   │   ├── app.component.html    # Root shell template
│   │   ├── app.config.ts         # Application configuration (router, providers)
│   │   └── app.routes.ts         # Master route declarations
│   ├── assets/                   # Images, sample data templates, static resources
│   ├── styles.css                # Global Tailwind CSS imports, theme variables, fonts
│   ├── index.html                # HTML5 entrypoint with theme pre-init script
│   └── main.ts                   # Angular standalone bootstrap entrypoint
├── angular.json                  # Angular CLI workspace configuration
├── package.json                  # Dependencies, scripts, package metadata
├── tailwind.config.js            # Tailwind theme, colors (#3762EA), dark mode config
├── tsconfig.json                 # TypeScript compiler configuration (strict: true)
├── tsconfig.app.json             # App-specific TS configuration
├── tsconfig.spec.json            # Test-specific TS configuration
└── README.md                     # Project documentation & local development guide
```

---

## 2. Granular File Breakdown

### 2.1 Core Layer (`src/app/core/`)
Singleton infrastructure, immutable data definitions, and global state managers.

```text
src/app/core/
├── models/
│   ├── tool.model.ts             # ToolMetadata, ToolCategory, ToolStatus interfaces
│   ├── theme.model.ts            # ThemeMode ('light' | 'dark' | 'system')
│   ├── toast.model.ts            # Toast notification interfaces
│   └── common.model.ts           # Standardized result, error, and coordinate types
├── services/
│   ├── tool-registry.service.ts  # Central single source of truth for all tools
│   ├── theme.service.ts          # Reactive theme management with localStorage & system preference
│   ├── favorites.service.ts      # Reactive user favorites manager backed by localStorage
│   ├── recent-tools.service.ts   # Recents tracker for dashboard quick access
│   ├── toast.service.ts          # Non-blocking user feedback notification system
│   └── storage.service.ts        # Type-safe wrapper for localStorage with error traps
└── data/
    ├── tools.data.ts             # Canonical metadata array for all 12 tools
    └── sample-data.data.ts       # Preset sample inputs (JSON, CSV, JWT, Regex, etc.)
```

### 2.2 Shared Layer (`src/app/shared/`)
Reusable, presentation-focused UI widgets and utility pipes.

```text
src/app/shared/
├── components/
│   ├── tool-layout/              # Common container for all tool pages
│   │   ├── tool-layout.component.ts
│   │   └── tool-layout.component.html
│   ├── tool-header/              # Tool title, description, category tag, actions
│   │   ├── tool-header.component.ts
│   │   └── tool-header.component.html
│   ├── code-pane/                # Monospace editor pane with line numbers & counters
│   │   ├── code-pane.component.ts
│   │   └── code-pane.component.html
│   ├── copy-button/              # One-click clipboard copy with animated feedback
│   │   └── copy-button.component.ts
│   ├── download-button/          # One-click client-side file downloader
│   │   └── download-button.component.ts
│   ├── error-alert/              # Formatted error banner with coordinates
│   │   └── error-alert.component.ts
│   ├── status-badge/             # Visual state pill (Valid, Invalid, Active, Expired)
│   │   └── status-badge.component.ts
│   ├── search-dialog/            # Global command palette (Ctrl+K) tool search
│   │   ├── search-dialog.component.ts
│   │   └── search-dialog.component.html
│   └── toast-container/          # Toast stack overlay renderer
│       └── toast-container.component.ts
├── pipes/
│   ├── byte-size.pipe.ts         # Formats raw bytes to KB / MB
│   └── time-ago.pipe.ts          # Formats epoch timestamps into human-readable relative time
└── directives/
    ├── auto-focus.directive.ts   # Automatically focuses primary input on route entry
    └── drag-drop-file.directive.ts # Handles file drag-over and drop events on textareas
```

### 2.3 Layout Layer (`src/app/layout/`)
Structural navigation frame wrapping the application.

```text
src/app/layout/
├── app-shell/
│   ├── app-shell.component.ts    # Main container: Sidebar + Top Nav + Router Outlet
│   └── app-shell.component.html
├── sidebar/
│   ├── sidebar.component.ts      # Responsive navigation, categories, favorites summary
│   └── sidebar.component.html
├── navbar/
│   ├── navbar.component.ts       # Top header, search trigger, theme switcher, GitHub link
│   └── navbar.component.html
└── footer/
    ├── footer.component.ts       # Bottom disclaimer, privacy guarantee, copyright
    └── footer.component.html
```

### 2.4 High-Level Pages (`src/app/pages/`)
General portal pages for navigation, overview, and information.

```text
src/app/pages/
├── dashboard/
│   ├── dashboard.component.ts    # SaaS metrics, recent tools, favorites, featured tools
│   └── dashboard.component.html
├── all-tools/
│   ├── all-tools.component.ts    # Categorized catalog grid with live search & filters
│   └── all-tools.component.html
├── favorites/
│   ├── favorites.component.ts    # Dedicated view for bookmarked developer tools
│   └── favorites.component.html
├── about/
│   ├── about.component.ts        # About DevTools Hub, local-only architecture, privacy
│   └── about.component.html
└── not-found/
    ├── not-found.component.ts    # 404 handler with redirection back to dashboard
    └── not-found.component.html
```

### 2.5 Tool Implementations (`src/app/tools/`)
12 independently maintainable tool modules, each encapsulating its UI component and pure engine.

```text
src/app/tools/
├── json-formatter/
│   ├── json-formatter.component.ts
│   ├── json-formatter.component.html
│   ├── json-formatter.engine.ts
│   └── json-formatter.engine.spec.ts
├── json-validator/
│   ├── json-validator.component.ts
│   ├── json-validator.component.html
│   ├── json-validator.engine.ts
│   └── json-validator.engine.spec.ts
├── json-to-csv/
│   ├── json-to-csv.component.ts
│   ├── json-to-csv.component.html
│   ├── json-to-csv.engine.ts
│   └── json-to-csv.engine.spec.ts
├── csv-to-json/
│   ├── csv-to-json.component.ts
│   ├── csv-to-json.component.html
│   ├── csv-to-json.engine.ts
│   └── csv-to-json.engine.spec.ts
├── base64/
│   ├── base64.component.ts
│   ├── base64.component.html
│   ├── base64.engine.ts
│   └── base64.engine.spec.ts
├── url-encoder/
│   ├── url-encoder.component.ts
│   ├── url-encoder.component.html
│   ├── url-encoder.engine.ts
│   └── url-encoder.engine.spec.ts
├── jwt-decoder/
│   ├── jwt-decoder.component.ts
│   ├── jwt-decoder.component.html
│   ├── jwt-decoder.engine.ts
│   └── jwt-decoder.engine.spec.ts
├── uuid-generator/
│   ├── uuid-generator.component.ts
│   ├── uuid-generator.component.html
│   ├── uuid-generator.engine.ts
│   └── uuid-generator.engine.spec.ts
├── timestamp-converter/
│   ├── timestamp-converter.component.ts
│   ├── timestamp-converter.component.html
│   ├── timestamp-converter.engine.ts
│   └── timestamp-converter.engine.spec.ts
├── regex-tester/
│   ├── regex-tester.component.ts
│   ├── regex-tester.component.html
│   ├── regex-tester.engine.ts
│   └── regex-tester.engine.spec.ts
├── cron-builder/
│   ├── cron-builder.component.ts
│   ├── cron-builder.component.html
│   ├── cron-builder.engine.ts
│   └── cron-builder.engine.spec.ts
└── sha256/
    ├── sha256.component.ts
    ├── sha256.component.html
    ├── sha256.engine.ts
    └── sha256.engine.spec.ts
```

---

## 3. Naming Conventions & Code Style Guidelines

1. **File Naming:**
   - Kebab-case with explicit role suffix: `[name].[role].ts`
   - Examples: `tool-registry.service.ts`, `json-formatter.engine.ts`, `copy-button.component.ts`.
2. **Component Conventions:**
   - Standalone components (`standalone: true`).
   - Suffix with `Component`: e.g. `JsonFormatterComponent`.
   - Use `ChangeDetectionStrategy.OnPush` across all components.
3. **Engine Conventions:**
   - Suffix with `.engine.ts`.
   - Pure, stateless TypeScript functions and exported helpers.
   - Accompanying unit test file `[name].engine.spec.ts`.
4. **CSS & Styling:**
   - Tailwind utility classes directly in templates.
   - Complex component classes defined cleanly via `@apply` or dedicated utility abstractions if reused.

