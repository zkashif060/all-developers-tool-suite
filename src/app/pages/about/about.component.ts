import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, AppIconComponent, BrandLogoComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <!-- Title Block -->
      <div class="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <app-icon name="shield" [size]="14" />
          <span>Privacy & Architecture Guarantee</span>
        </div>
        <div class="flex items-center gap-3.5">
          <app-brand-logo [size]="42" />
          <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            About ZeroTrace Tools
          </h1>
        </div>
        <p class="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          ZeroTrace Tools is built on a fundamental principle: <strong>developer data must remain private, secure, and entirely within the user's control.</strong>
        </p>
      </div>

      <!-- Core Architecture Pillars -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <app-icon name="shield" [size]="20" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">100% Client-Side Execution</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every transformation, validation, conversion, and cryptographic hash is computed directly inside your browser's JavaScript V8 engine and Web Crypto subsystem. No inputs, pasted tokens, or documents are ever sent across the wire.
          </p>
        </div>

        <div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <app-icon name="key" [size]="20" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Ephemeral In-Memory Buffers</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your inputs live only in temporary JavaScript memory during your active browser tab session. We never persist pasted JSON, CSV, passwords, or JWT tokens into LocalStorage, IndexedDB, or server logs.
          </p>
        </div>

        <div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <app-icon name="sparkles" [size]="20" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Native Web Crypto API</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cryptographic operations such as SHA-256 and UUID generation use standard W3C Web Cryptography APIs (<code class="font-mono text-primary-500">crypto.subtle</code> and <code class="font-mono text-primary-500">crypto.randomUUID()</code>), guaranteeing hardware-accelerated, cryptographically secure results.
          </p>
        </div>

        <div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <app-icon name="info" [size]="20" />
          </div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Zero Analytics & Tracking</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            ZeroTrace Tools contains zero tracking scripts, telemetry pixels, Google Analytics, or third-party advertising beacons. We have no access to what tools you use or what data you process.
          </p>
        </div>
      </section>

      <!-- LocalStorage Usage Disclosure -->
      <section class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h2 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <app-icon name="database" [size]="18" className="text-primary-500" />
          <span>Transparent LocalStorage Usage Disclosure</span>
        </h2>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          ZeroTrace Tools uses your browser's <code class="font-mono text-primary-500">localStorage</code> strictly for non-sensitive client preferences to deliver a seamless user experience across visits:
        </p>
        <ul class="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
          <li><strong>devtools_theme:</strong> Stores your chosen color theme (<code class="text-primary-500">light</code>, <code class="text-primary-500">dark</code>, or <code class="text-primary-500">system</code>).</li>
          <li><strong>devtools_favorites:</strong> Stores the string array of utility IDs you have starred as favorites.</li>
          <li><strong>devtools_recent_tools:</strong> Remembers the last 5 visited utility routes for quick access on the Dashboard.</li>
        </ul>
        <div class="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
          <strong>Never Stored:</strong> Pasted JSON documents, CSV data, cryptographic keys, passwords, regex expressions, or JWT tokens are <u>never</u> saved into LocalStorage, IndexedDB, or cookies. All input processing resides in ephemeral memory buffers that vanish when your session or tab is closed.
        </div>
      </section>

      <!-- How to Verify Network Activity -->
      <section class="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
        <h2 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <app-icon name="terminal" [size]="18" className="text-primary-500" />
          <span>How to Verify Zero Network Activity Yourself</span>
        </h2>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          As developers, we don't believe in blind trust. You can verify our privacy guarantee anytime:
        </p>
        <ol class="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-mono">
          <li>Open your browser's Developer Tools (<kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">F12</kbd> or <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Ctrl+Shift+I</kbd>).</li>
          <li>Navigate to the <strong>Network</strong> tab.</li>
          <li>Paste sensitive JSON, CSV, or a JWT token into any tool on ZeroTrace Tools and trigger formatting or decoding.</li>
          <li>Notice that zero HTTP requests are recorded. Data never leaves your machine.</li>
        </ol>
      </section>

      <!-- Back to Dashboard -->
      <div class="pt-4 text-center">
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-sm transition-colors"
        >
          <span>Return to Dashboard</span>
          <app-icon name="chevron-right" [size]="14" />
        </a>
      </div>
    </div>
  `
})
export class AboutComponent {}

