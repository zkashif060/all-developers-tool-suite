import { describe, it, expect } from 'vitest';
import {
  convertYamlToJson,
  convertJsonToYaml,
  YAML_SAMPLES
} from './yaml-json-converter.engine';

describe('YamlJsonConverterEngine', () => {
  describe('convertYamlToJson', () => {
    it('should return empty result for empty string', () => {
      const res = convertYamlToJson('');
      expect(res.output).toBe('');
      expect(res.originalSize).toBe(0);
    });

    it('should convert valid YAML to formatted JSON', () => {
      const yaml = `
name: ZeroTrace
version: 1.0.0
tags:
  - privacy
  - offline
      `;
      const res = convertYamlToJson(yaml, '2-spaces');
      expect(res.error).toBeUndefined();
      const parsed = JSON.parse(res.output);
      expect(parsed.name).toBe('ZeroTrace');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.tags).toEqual(['privacy', 'offline']);
    });

    it('should support minified JSON output', () => {
      const yaml = 'foo: bar\nbaz: 123';
      const res = convertYamlToJson(yaml, '2-spaces', true);
      expect(res.output).toBe('{"foo":"bar","baz":123}');
    });

    it('should report parsing error with line position for malformed YAML', () => {
      const badYaml = 'key: [1, 2';
      const res = convertYamlToJson(badYaml);
      expect(res.error).toBeDefined();
      expect(res.output).toBe('');
      expect(res.errorLine).toBeDefined();
    });

    it('should convert complex Docker Compose sample cleanly', () => {
      const sample = YAML_SAMPLES.dockerCompose.yaml;
      const res = convertYamlToJson(sample);
      expect(res.error).toBeUndefined();
      const parsed = JSON.parse(res.output);
      expect(parsed.services.app.ports).toContain('3000:3000');
    });
  });

  describe('convertJsonToYaml', () => {
    it('should return empty result for empty string', () => {
      const res = convertJsonToYaml('');
      expect(res.output).toBe('');
    });

    it('should convert valid JSON to clean YAML', () => {
      const json = JSON.stringify({
        project: 'ZeroTrace',
        enabled: true,
        count: 5
      });
      const res = convertJsonToYaml(json, '2-spaces');
      expect(res.error).toBeUndefined();
      expect(res.output).toContain('project: ZeroTrace');
      expect(res.output).toContain('enabled: true');
      expect(res.output).toContain('count: 5');
    });

    it('should sort keys when sortKeys option is enabled', () => {
      const json = JSON.stringify({ z: 1, a: 2, m: 3 });
      const res = convertJsonToYaml(json, '2-spaces', true);
      const lines = res.output.trim().split('\n');
      expect(lines[0]).toContain('a: 2');
      expect(lines[1]).toContain('m: 3');
      expect(lines[2]).toContain('z: 1');
    });

    it('should handle invalid JSON with informative error message', () => {
      const badJson = '{ name: "unterminated"';
      const res = convertJsonToYaml(badJson);
      expect(res.error).toContain('JSON Parse Error');
      expect(res.output).toBe('');
    });
  });
});

