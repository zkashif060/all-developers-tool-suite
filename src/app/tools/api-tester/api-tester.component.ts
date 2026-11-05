import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolRegistryService } from '../../core/services/tool-registry.service';
import { RecentToolsService } from '../../core/services/recent-tools.service';
import { ToolMetadata } from '../../core/models/tool.model';
import { ToolPageLayoutComponent } from '../../shared/components/tool-page-layout/tool-page-layout.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import {
  HttpMethod,
  KeyValueParam,
  RequestBodyType,
  ApiResponseResult,
  API_PRESETS,
  ApiPreset,
  executeApiRequest,
  generateCurlCommand,
  formatByteSize,
  formatDurationMs,
  parseQueryParamsFromUrl
} from './api-tester.engine';

@Component({
  selector: 'app-api-tester',
  standalone: true,
  imports: [
    FormsModule,
    ToolPageLayoutComponent,
    AppIconComponent,
    CopyButtonComponent,
    DownloadButtonComponent
  ],
  template: `
    @if (tool(); as t) {
      <app-tool-page-layout [tool]="t">
        <div class="flex flex-col gap-6">
          <!-- Preset Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sample Requests:</span>
              @for (preset of presets; track preset.name) {
                <button
                  type="button"
                  (click)="loadPreset(preset)"
                  class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {{ preset.name }}
                </button>
              }
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="copyCurl()"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                title="Copy as cURL"
              >
                <app-icon name="terminal" [size]="14" />
                Copy cURL
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <!-- Main Request Bar -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <div class="flex flex-col sm:flex-row gap-2">
              <!-- Method Select -->
              <div class="relative sm:w-36 flex-shrink-0">
                <select
                  [(ngModel)]="method"
                  [class]="getMethodColorClass(method())"
                  class="w-full px-3 py-2.5 rounded-lg border font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <app-icon name="arrow-down" [size]="14" />
                </div>
              </div>

              <!-- URL Input -->
              <div class="relative flex-1">
                <input
                  type="text"
                  [(ngModel)]="url"
                  (ngModelChange)="onUrlChange($event)"
                  placeholder="https://api.example.com/v1/resource"
                  class="w-full px-3 py-2.5 font-mono text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <!-- Send Button -->
              @if (!isLoading()) {
                <button
                  type="button"
                  (click)="sendRequest()"
                  [disabled]="!url().trim()"
                  class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <app-icon name="send" [size]="16" />
                  <span>Send</span>
                </button>
              } @else {
                <button
                  type="button"
                  (click)="cancelRequest()"
                  class="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <app-icon name="x" [size]="16" />
                  <span>Cancel</span>
                </button>
              }
            </div>

            <!-- Request Configuration Tabs -->
            <div class="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
              <button
                type="button"
                (click)="requestTab.set('params')"
                class="pb-2 border-b-2 transition-colors"
                [class.border-primary]="requestTab() === 'params'"
                [class.text-primary]="requestTab() === 'params'"
                [class.border-transparent]="requestTab() !== 'params'"
                [class.text-slate-500]="requestTab() !== 'params'"
              >
                Params
                @if (activeParamsCount() > 0) {
                  <span class="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                    {{ activeParamsCount() }}
                  </span>
                }
              </button>
              <button
                type="button"
                (click)="requestTab.set('headers')"
                class="pb-2 border-b-2 transition-colors"
                [class.border-primary]="requestTab() === 'headers'"
                [class.text-primary]="requestTab() === 'headers'"
                [class.border-transparent]="requestTab() !== 'headers'"
                [class.text-slate-500]="requestTab() !== 'headers'"
              >
                Headers
                @if (activeHeadersCount() > 0) {
                  <span class="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                    {{ activeHeadersCount() }}
                  </span>
                }
              </button>
              <button
                type="button"
                (click)="requestTab.set('body')"
                class="pb-2 border-b-2 transition-colors"
                [class.border-primary]="requestTab() === 'body'"
                [class.text-primary]="requestTab() === 'body'"
                [class.border-transparent]="requestTab() !== 'body'"
                [class.text-slate-500]="requestTab() !== 'body'"
              >
                Body
                @if (bodyType() !== 'none' && rawBody().trim()) {
                  <span class="ml-1.5 w-2 h-2 inline-block rounded-full bg-emerald-500"></span>
                }
              </button>
            </div>

            <!-- Tab: Query Params -->
            @if (requestTab() === 'params') {
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Query Parameters</span>
                  <button
                    type="button"
                    (click)="addParam()"
                    class="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <app-icon name="plus" [size]="12" /> Add Param
                  </button>
                </div>
                <div class="flex flex-col gap-1.5">
                  @for (p of queryParams(); track p.id; let i = $index) {
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        [(ngModel)]="p.enabled"
                        class="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        [(ngModel)]="p.key"
                        placeholder="Key"
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        [(ngModel)]="p.value"
                        placeholder="Value"
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        (click)="removeParam(i)"
                        class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete parameter"
                      >
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  }
                  @if (queryParams().length === 0) {
                    <div class="py-4 text-center text-xs text-slate-400 italic">
                      No query parameters configured. Click "Add Param" to append URL query arguments.
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Tab: Headers -->
            @if (requestTab() === 'headers') {
              <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>HTTP Request Headers</span>
                  <button
                    type="button"
                    (click)="addHeader()"
                    class="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <app-icon name="plus" [size]="12" /> Add Header
                  </button>
                </div>
                <div class="flex flex-col gap-1.5">
                  @for (h of headers(); track h.id; let i = $index) {
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        [(ngModel)]="h.enabled"
                        class="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <input
                        type="text"
                        [(ngModel)]="h.key"
                        placeholder="Header (e.g. Authorization)"
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      />
                      <input
                        type="text"
                        [(ngModel)]="h.value"
                        placeholder="Value (e.g. Bearer token)"
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        (click)="removeHeader(i)"
                        class="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete header"
                      >
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </div>
                  }
                  @if (headers().length === 0) {
                    <div class="py-4 text-center text-xs text-slate-400 italic">
                      No custom headers. Browser default headers will be applied automatically.
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Tab: Body -->
            @if (requestTab() === 'body') {
              <div class="flex flex-col gap-3">
                <div class="flex flex-wrap items-center gap-4 text-xs">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" [(ngModel)]="bodyType" value="none" name="bodyType" />
                    <span>None</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" [(ngModel)]="bodyType" value="json" name="bodyType" />
                    <span>JSON (application/json)</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" [(ngModel)]="bodyType" value="text" name="bodyType" />
                    <span>Text (text/plain)</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" [(ngModel)]="bodyType" value="x-www-form-urlencoded" name="bodyType" />
                    <span>x-www-form-urlencoded</span>
                  </label>

                  @if (bodyType() === 'json') {
                    <button
                      type="button"
                      (click)="formatJsonBody()"
                      class="ml-auto text-xs text-primary hover:underline font-medium"
                    >
                      Prettify JSON
                    </button>
                  }
                </div>

                @if (bodyType() !== 'none') {
                  <textarea
                    [(ngModel)]="rawBody"
                    rows="6"
                    placeholder="Enter payload content..."
                    class="w-full px-3 py-2 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  ></textarea>
                } @else {
                  <div class="py-6 text-center text-xs text-slate-400 italic">
                    This request does not include a body payload. Select "JSON" or "Text" above to send request data.
                  </div>
                }
              </div>
            }
          </div>

          <!-- Response Panel -->
          @if (response(); as res) {
            <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
              <!-- Response Status Header Bar -->
              <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response:</span>
                  <span
                    class="px-2.5 py-1 text-xs font-bold rounded-md"
                    [class]="getStatusBadgeColor(res.status, res.isCorsError)"
                  >
                    {{ res.status > 0 ? res.status + ' ' + res.statusText : res.statusText }}
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">
                    Time: <strong class="text-slate-700 dark:text-slate-300 font-mono">{{ formatMs(res.durationMs) }}</strong>
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">
                    Size: <strong class="text-slate-700 dark:text-slate-300 font-mono">{{ formatBytes(res.sizeBytes) }}</strong>
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  @if (res.body) {
                    <app-copy-button [text]="res.body" label="Copy Response" />
                    <app-download-button
                      [content]="res.body"
                      [filename]="res.isJson ? 'response.json' : 'response.txt'"
                      [label]="res.isJson ? 'Download JSON' : 'Download'"
                    />
                  }
                </div>
              </div>

              <!-- CORS Explanatory Banner -->
              @if (res.isCorsError) {
                <div class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
                  <div class="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                    <app-icon name="alert-circle" [size]="18" />
                    <span>CORS (Cross-Origin Resource Sharing) Restriction Detected</span>
                  </div>
                  <p class="leading-relaxed">
                    ZeroTrace executes requests <strong>100% inside your browser</strong>. Modern web browsers strictly block direct JavaScript API calls to external domains unless the target server explicitly returns the header:
                    <code class="px-1.5 py-0.5 font-mono bg-amber-500/20 rounded">Access-Control-Allow-Origin: *</code> (or your origin).
                  </p>
                  <div class="mt-1 flex flex-col gap-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                    <strong>Quick Solutions:</strong>
                    <ul class="list-disc list-inside space-y-0.5">
                      <li>Test with public CORS-enabled APIs (e.g. JSONPlaceholder, HTTPBin, GitHub API).</li>
                      <li>Test local servers (e.g. <code>http://localhost:3000</code> or <code>http://127.0.0.1:8080</code> configured with CORS enabled).</li>
                      <li>If testing private APIs during development, enable a CORS-unblocking browser extension or install the ZeroTrace Desktop app.</li>
                    </ul>
                  </div>
                </div>
              }

              <!-- Response Navigation Tabs -->
              <div class="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
                <button
                  type="button"
                  (click)="responseTab.set('body')"
                  class="pb-2 border-b-2 transition-colors"
                  [class.border-primary]="responseTab() === 'body'"
                  [class.text-primary]="responseTab() === 'body'"
                  [class.border-transparent]="responseTab() !== 'body'"
                  [class.text-slate-500]="responseTab() !== 'body'"
                >
                  Body
                </button>
                <button
                  type="button"
                  (click)="responseTab.set('headers')"
                  class="pb-2 border-b-2 transition-colors"
                  [class.border-primary]="responseTab() === 'headers'"
                  [class.text-primary]="responseTab() === 'headers'"
                  [class.border-transparent]="responseTab() !== 'headers'"
                  [class.text-slate-500]="responseTab() !== 'headers'"
                >
                  Headers ({{ res.headers.length }})
                </button>
              </div>

              <!-- Response Tab: Body -->
              @if (responseTab() === 'body') {
                @if (res.body) {
                  <pre
                    class="p-4 rounded-lg font-mono text-xs leading-relaxed max-h-[500px] overflow-auto select-text border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200"
                  >{{ res.formattedJson || res.body }}</pre>
                } @else if (!res.isCorsError) {
                  <div class="py-8 text-center text-xs text-slate-400 italic">
                    Empty response body returned by the server.
                  </div>
                }
              }

              <!-- Response Tab: Headers -->
              @if (responseTab() === 'headers') {
                @if (res.headers.length > 0) {
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs font-mono">
                      <thead>
                        <tr class="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                          <th class="py-2 px-3">Header Name</th>
                          <th class="py-2 px-3">Header Value</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                        @for (h of res.headers; track h.key) {
                          <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td class="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">{{ h.key }}</td>
                            <td class="py-2 px-3 text-slate-600 dark:text-slate-400 break-all select-text">{{ h.value }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="py-8 text-center text-xs text-slate-400 italic">
                    No response headers captured.
                  </div>
                }
              }
            </div>
          }
        </div>
      </app-tool-page-layout>
    }
  `
})
export class ApiTesterComponent implements OnInit {
  private readonly toolRegistry = inject(ToolRegistryService);
  private readonly recentToolsService = inject(RecentToolsService);

  public readonly tool = signal<ToolMetadata | undefined>(
    this.toolRegistry.getToolById('api-tester')
  );

  public readonly presets = API_PRESETS;

  // Request State
  public readonly method = signal<HttpMethod>('GET');
  public readonly url = signal<string>('https://jsonplaceholder.typicode.com/posts/1');
  public readonly requestTab = signal<'params' | 'headers' | 'body'>('params');
  public readonly responseTab = signal<'body' | 'headers'>('body');

  public readonly queryParams = signal<KeyValueParam[]>([
    { id: '1', key: '', value: '', enabled: true }
  ]);
  public readonly headers = signal<KeyValueParam[]>([
    { id: '1', key: 'Accept', value: 'application/json', enabled: true }
  ]);

  public readonly bodyType = signal<RequestBodyType>('none');
  public readonly rawBody = signal<string>('');

  // Execution State
  public readonly isLoading = signal<boolean>(false);
  public readonly response = signal<ApiResponseResult | null>(null);

  private abortController: AbortController | null = null;
  private idCounter = 10;

  public readonly activeParamsCount = computed(
    () => this.queryParams().filter(p => p.enabled && p.key.trim().length > 0).length
  );

  public readonly activeHeadersCount = computed(
    () => this.headers().filter(h => h.enabled && h.key.trim().length > 0).length
  );

  public ngOnInit(): void {
    this.recentToolsService.recordUsage('api-tester');
  }

  public onUrlChange(newUrl: string): void {
    if (newUrl.includes('?')) {
      const parsed = parseQueryParamsFromUrl(newUrl);
      if (parsed.params.length > 0) {
        this.queryParams.set(parsed.params);
      }
    }
  }

  public addParam(): void {
    this.queryParams.update(list => [
      ...list,
      { id: `param-${++this.idCounter}`, key: '', value: '', enabled: true }
    ]);
  }

  public removeParam(index: number): void {
    this.queryParams.update(list => list.filter((_, i) => i !== index));
  }

  public addHeader(): void {
    this.headers.update(list => [
      ...list,
      { id: `header-${++this.idCounter}`, key: '', value: '', enabled: true }
    ]);
  }

  public removeHeader(index: number): void {
    this.headers.update(list => list.filter((_, i) => i !== index));
  }

  public formatJsonBody(): void {
    try {
      const parsed = JSON.parse(this.rawBody());
      this.rawBody.set(JSON.stringify(parsed, null, 2));
    } catch {
      // Keep as is if invalid JSON
    }
  }

  public loadPreset(preset: ApiPreset): void {
    this.method.set(preset.method);
    this.url.set(preset.url);

    if (preset.headers) {
      this.headers.set(
        preset.headers.map((h, i) => ({
          id: `preset-h-${i}`,
          key: h.key,
          value: h.value,
          enabled: true
        }))
      );
    } else {
      this.headers.set([]);
    }

    if (preset.queryParams) {
      this.queryParams.set(
        preset.queryParams.map((p, i) => ({
          id: `preset-p-${i}`,
          key: p.key,
          value: p.value,
          enabled: true
        }))
      );
    } else {
      this.queryParams.set([]);
    }

    this.bodyType.set(preset.bodyType || 'none');
    this.rawBody.set(preset.body || '');

    // Focus response tab on send
    this.response.set(null);
  }

  public resetForm(): void {
    this.method.set('GET');
    this.url.set('');
    this.queryParams.set([]);
    this.headers.set([{ id: 'h-1', key: 'Accept', value: 'application/json', enabled: true }]);
    this.bodyType.set('none');
    this.rawBody.set('');
    this.response.set(null);
  }

  public async sendRequest(): Promise<void> {
    if (!this.url().trim()) return;

    this.isLoading.set(true);
    this.abortController = new AbortController();

    try {
      const res = await executeApiRequest(
        {
          url: this.url(),
          method: this.method(),
          queryParams: this.queryParams(),
          headers: this.headers(),
          bodyType: this.bodyType(),
          rawBody: this.rawBody()
        },
        this.abortController.signal
      );
      this.response.set(res);
      this.responseTab.set('body');
    } finally {
      this.isLoading.set(false);
      this.abortController = null;
    }
  }

  public cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  public copyCurl(): void {
    const cmd = generateCurlCommand({
      url: this.url(),
      method: this.method(),
      queryParams: this.queryParams(),
      headers: this.headers(),
      bodyType: this.bodyType(),
      rawBody: this.rawBody()
    });
    navigator.clipboard.writeText(cmd);
  }

  public getMethodColorClass(m: HttpMethod): string {
    switch (m) {
      case 'GET':
        return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40';
      case 'POST':
        return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40';
      case 'PUT':
        return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40';
      case 'PATCH':
        return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/40';
      case 'DELETE':
        return 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40';
      default:
        return 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900';
    }
  }

  public getStatusBadgeColor(status: number, isCors?: boolean): string {
    if (isCors) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
    if (status >= 200 && status < 300) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
    if (status >= 300 && status < 400) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30';
    if (status >= 400 && status < 500) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
    if (status >= 500) return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30';
    return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30';
  }

  public formatMs(ms: number): string {
    return formatDurationMs(ms);
  }

  public formatBytes(bytes: number): string {
    return formatByteSize(bytes);
  }
}
