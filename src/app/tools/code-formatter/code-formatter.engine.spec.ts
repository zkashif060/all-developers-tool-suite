import { describe, it, expect } from 'vitest';
import {
  formatCode,
  minifyCode,
  CodeFormatterOptions,
  CODE_SAMPLES
} from './code-formatter.engine';

describe('CodeFormatterEngine', () => {
  const defaultOptions: CodeFormatterOptions = {
    language: 'html',
    indent: '2-spaces',
    wrapLineLength: 0,
    preserveNewlines: true,
    maxPreserveNewlines: 2,
    indentInnerHtml: false
  };

  describe('HTML formatting', () => {
    it('should return empty result for blank string', () => {
      const res = formatCode('', defaultOptions);
      expect(res.formatted).toBe('');
      expect(res.originalSize).toBe(0);
    });

    it('should format nested HTML structure properly', () => {
      const messyHtml = '<div><div>Hello <strong>World</strong></div><p>Paragraph</p></div>';
      const res = formatCode(messyHtml, defaultOptions);
      expect(res.formatted).toContain('<div>\n  <div>');
      expect(res.formatted).toContain('<p>Paragraph</p>');
      expect(res.lineCount).toBeGreaterThan(1);
    });

    it('should minify HTML by removing comments and extra spaces', () => {
      const html = '<div> <!-- comment --> \n <span> test </span> </div>';
      const res = minifyCode(html, 'html');
      expect(res.formatted).not.toContain('comment');
      expect(res.formatted).toBe('<div><span> test </span></div>');
    });
  });

  describe('CSS formatting', () => {
    it('should format minified CSS into indented rules', () => {
      const minifiedCss = '.card{display:flex;padding:1rem;color:#333;}';
      const res = formatCode(minifiedCss, {
        ...defaultOptions,
        language: 'css'
      });
      expect(res.formatted).toContain('.card {');
      expect(res.formatted).toContain('  display: flex;');
      expect(res.formatted).toContain('  color: #333;');
    });

    it('should minify CSS by removing comments and whitespace', () => {
      const css = `
        /* Main card container */
        .card {
          margin: 0px 10px;
          padding: 20px;
        }
      `;
      const res = minifyCode(css, 'css');
      expect(res.formatted).not.toContain('Main card container');
      expect(res.formatted).toContain('.card{margin:0px 10px;padding:20px}');
    });
  });

  describe('JavaScript formatting', () => {
    it('should format unformatted JavaScript code with clean indents', () => {
      const messyJs = 'function calculate(a,b){if(a>0){return a*b;}return 0;}';
      const res = formatCode(messyJs, {
        ...defaultOptions,
        language: 'javascript'
      });
      expect(res.formatted).toContain('function calculate(a, b) {');
      expect(res.formatted).toContain('  if (a > 0) {');
      expect(res.formatted).toContain('    return a * b;');
    });

    it('should minify JS code safely while preserving string literals', () => {
      const js = `
        // Compute total amount
        function getTotal(price, tax) {
          const message = "Total: // not a comment /* ok */";
          return price + tax;
        }
      `;
      const res = minifyCode(js, 'javascript');
      expect(res.formatted).not.toContain('Compute total amount');
      expect(res.formatted).toContain('"Total: // not a comment /* ok */"');
    });
  });

  describe('Sample presets', () => {
    it('should format HTML sample preset cleanly', () => {
      const res = formatCode(CODE_SAMPLES.html.code, defaultOptions);
      expect(res.formatted).toContain('<article class="developer-card"');
      expect(res.error).toBeUndefined();
    });

    it('should format CSS sample preset cleanly', () => {
      const res = formatCode(CODE_SAMPLES.css.code, {
        ...defaultOptions,
        language: 'css'
      });
      expect(res.formatted).toContain('--primary: #3762ea;');
      expect(res.error).toBeUndefined();
    });

    it('should format JS sample preset cleanly', () => {
      const res = formatCode(CODE_SAMPLES.javascript.code, {
        ...defaultOptions,
        language: 'javascript'
      });
      expect(res.formatted).toContain('class DeveloperApiClient {');
      expect(res.error).toBeUndefined();
    });
  });
});
