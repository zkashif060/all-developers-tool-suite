import * as beautify from 'js-beautify';

export type CodeLanguage = 'html' | 'css' | 'javascript';
export type FormatterIndent = '2-spaces' | '4-spaces' | 'tabs';

export interface CodeFormatterOptions {
  language: CodeLanguage;
  indent: FormatterIndent;
  wrapLineLength: number;
  preserveNewlines: boolean;
  maxPreserveNewlines: number;
  indentInnerHtml: boolean;
}

export interface CodeFormatterResult {
  formatted: string;
  originalSize: number;
  formattedSize: number;
  lineCount: number;
  compressionRatio: string;
  error?: string;
}

export const CODE_SAMPLES: Record<CodeLanguage, { name: string; code: string }> = {
  html: {
    name: 'Modern Semantic Card Component',
    code: `<article class="developer-card" data-card-id="101"><header class="card-header"><div class="avatar-badge"><img src="/assets/avatar.png" alt="Developer Avatar" loading="lazy" class="avatar-img"/><span class="status-indicator online"></span></div><div class="user-meta"><h2 class="user-name">Sarah Connor</h2><p class="user-role">Systems Architect</p></div></header><div class="card-body"><p class="bio">Building resilient, privacy-first software infrastructure. Direct in-browser processing with zero server hops.</p><ul class="tags-list"><li class="tag">TypeScript</li><li class="tag">Angular</li><li class="tag">Rust</li></ul></div><footer class="card-footer"><button type="button" class="btn btn-primary" onclick="handleConnect()">Connect</button><a href="/profile" class="btn-link">View Portfolio</a></footer></article>`
  },
  css: {
    name: 'Modern CSS Grid & Color Tokens',
    code: `:root{--primary:#3762ea;--primary-hover:#2851cf;--bg-card:rgba(255,255,255,0.85);--border-subtle:#e2e8f0;--text-main:#0f172a}.developer-card{display:flex;flex-direction:column;gap:1.25rem;padding:1.5rem;border-radius:1rem;background:var(--bg-card);border:1px solid var(--border-subtle);backdrop-filter:blur(12px);box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1);transition:transform .2s ease,box-shadow .2s ease}.developer-card:hover{transform:translateY(-2px);box-shadow:0 10px 15px -3px rgba(0,0,0,0.1)}@media (prefers-color-scheme:dark){:root{--bg-card:rgba(15,23,42,0.85);--border-subtle:#1e293b;--text-main:#f8fafc}}`
  },
  javascript: {
    name: 'ES6+ Async Service Class',
    code: `class DeveloperApiClient{constructor(baseUrl,timeoutMs=15000){this.baseUrl=baseUrl;this.timeoutMs=timeoutMs}async fetchUserData(userId){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);try{const response=await fetch(\`\${this.baseUrl}/users/\${encodeURIComponent(userId)}\`,{method:'GET',headers:{'Accept':'application/json'},signal:controller.signal});clearTimeout(timer);if(!response.ok){throw new Error(\`HTTP error! status: \${response.status}\`)}const data=await response.json();return{success:true,data}}catch(err){clearTimeout(timer);return{success:false,error:err instanceof Error?err.message:String(err)}}}}`
  }
};

/**
 * Formats code according to language and formatting options.
 */
export function formatCode(
  source: string,
  options: CodeFormatterOptions
): CodeFormatterResult {
  const trimmed = source.trim();
  if (!trimmed) {
    return {
      formatted: '',
      originalSize: 0,
      formattedSize: 0,
      lineCount: 0,
      compressionRatio: '0.0%'
    };
  }

  const indent_size = options.indent === '4-spaces' ? 4 : 2;
  const indent_char = options.indent === 'tabs' ? '\t' : ' ';
  const indent_with_tabs = options.indent === 'tabs';

  try {
    let formatted = '';

    if (options.language === 'html') {
      formatted = beautify.html(trimmed, {
        indent_size,
        indent_char,
        indent_with_tabs,
        wrap_line_length: options.wrapLineLength,
        preserve_newlines: options.preserveNewlines,
        max_preserve_newlines: options.maxPreserveNewlines,
        indent_inner_html: options.indentInnerHtml,
        end_with_newline: true
      });
    } else if (options.language === 'css') {
      formatted = beautify.css(trimmed, {
        indent_size,
        indent_char,
        indent_with_tabs,
        preserve_newlines: options.preserveNewlines,
        max_preserve_newlines: options.maxPreserveNewlines,
        end_with_newline: true
      });
    } else {
      formatted = beautify.js(trimmed, {
        indent_size,
        indent_char,
        indent_with_tabs,
        wrap_line_length: options.wrapLineLength,
        preserve_newlines: options.preserveNewlines,
        max_preserve_newlines: options.maxPreserveNewlines,
        space_before_conditional: true,
        unescape_strings: false,
        end_with_newline: true
      });
    }

    const origSize = new TextEncoder().encode(trimmed).length;
    const fmtSize = new TextEncoder().encode(formatted).length;
    const ratio = origSize > 0
      ? (((fmtSize - origSize) / origSize) * 100).toFixed(1) + '%'
      : '0.0%';

    return {
      formatted,
      originalSize: origSize,
      formattedSize: fmtSize,
      lineCount: formatted.split('\n').length,
      compressionRatio: ratio
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      formatted: trimmed,
      originalSize: new TextEncoder().encode(trimmed).length,
      formattedSize: new TextEncoder().encode(trimmed).length,
      lineCount: trimmed.split('\n').length,
      compressionRatio: '0.0%',
      error: errorMsg
    };
  }
}

/**
 * Minifies code based on language syntax.
 */
export function minifyCode(source: string, language: CodeLanguage): CodeFormatterResult {
  const trimmed = source.trim();
  if (!trimmed) {
    return {
      formatted: '',
      originalSize: 0,
      formattedSize: 0,
      lineCount: 0,
      compressionRatio: '0.0%'
    };
  }

  let minified = '';

  if (language === 'html') {
    // HTML Minify: strip comments and whitespace between tags
    minified = trimmed
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else if (language === 'css') {
    // CSS Minify: strip comments, spaces around delimiters
    minified = trimmed
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s*([\{\}:;,])\s*/g, '$1')
      .replace(/\s+/g, ' ')
      .replace(/;}/g, '}')
      .trim();
  } else {
    // JS Minify: strip single-line and multi-line comments safely while preserving strings
    minified = safeJsMinify(trimmed);
  }

  const origSize = new TextEncoder().encode(trimmed).length;
  const minSize = new TextEncoder().encode(minified).length;
  const ratio = origSize > 0
    ? (((minSize - origSize) / origSize) * 100).toFixed(1) + '%'
    : '0.0%';

  return {
    formatted: minified,
    originalSize: origSize,
    formattedSize: minSize,
    lineCount: minified.split('\n').length,
    compressionRatio: ratio
  };
}

/**
 * Safe JavaScript minifier that respects string literals.
 */
function safeJsMinify(js: string): string {
  const stringLiterals: string[] = [];
  let tokenized = '';
  let i = 0;
  const len = js.length;

  while (i < len) {
    const ch = js[i];

    // Single-line comment
    if (ch === '/' && i + 1 < len && js[i + 1] === '/') {
      i += 2;
      while (i < len && js[i] !== '\n' && js[i] !== '\r') {
        i++;
      }
      continue;
    }

    // Multi-line comment
    if (ch === '/' && i + 1 < len && js[i + 1] === '*') {
      i += 2;
      while (i + 1 < len && !(js[i] === '*' && js[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // String literal: '...', "...", `...`
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let lit = quote;
      i++;
      while (i < len) {
        const c = js[i];
        lit += c;
        if (c === '\\') {
          if (i + 1 < len) {
            i++;
            lit += js[i];
          }
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      const marker = `__JS_STR_${stringLiterals.length}__`;
      stringLiterals.push(lit);
      tokenized += marker;
      continue;
    }

    // Whitespace collapse
    if (/\s/.test(ch)) {
      if (tokenized.length > 0 && !/\s$/.test(tokenized)) {
        tokenized += ' ';
      }
      i++;
      continue;
    }

    tokenized += ch;
    i++;
  }

  let cleaned = tokenized
    .replace(/\s*([=+\-*\/%&|^!<>?:;,{}()[\]])\s*/g, (match, op) => {
      if (op === ';' || op === ',') return `${op} `;
      if (op === '(' || op === ')' || op === '{' || op === '}') return op;
      return op;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Restore string literals verbatim
  for (let idx = 0; idx < stringLiterals.length; idx++) {
    cleaned = cleaned.replace(`__JS_STR_${idx}__`, stringLiterals[idx]);
  }

  return cleaned;
}
