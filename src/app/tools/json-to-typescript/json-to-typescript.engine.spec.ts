import { describe, it, expect } from 'vitest';
import {
  convertJsonToTypeScript,
  JsonToTsOptions,
  JSON_TS_SAMPLES
} from './json-to-typescript.engine';

describe('JsonToTypeScriptEngine', () => {
  const defaultOptions: JsonToTsOptions = {
    rootName: 'UserResponse',
    declarationType: 'interface',
    exportTypes: true,
    readonlyFields: false,
    optionalNulls: true,
    addComments: false
  };

  it('should return empty result for blank JSON', () => {
    const res = convertJsonToTypeScript('', defaultOptions);
    expect(res.code).toBe('');
    expect(res.typeCount).toBe(0);
  });

  it('should report syntax errors for invalid JSON', () => {
    const res = convertJsonToTypeScript('{ name: "invalid" ', defaultOptions);
    expect(res.error).toBeDefined();
    expect(res.code).toBe('');
  });

  it('should generate interface for simple key-value object', () => {
    const json = JSON.stringify({
      id: 1,
      name: 'Alice',
      isAdmin: false
    });
    const res = convertJsonToTypeScript(json, defaultOptions);
    expect(res.code).toContain('export interface UserResponse {');
    expect(res.code).toContain('id: number;');
    expect(res.code).toContain('name: string;');
    expect(res.code).toContain('isAdmin: boolean;');
    expect(res.typeCount).toBe(1);
    expect(res.propertyCount).toBe(3);
  });

  it('should support type alias generation mode', () => {
    const json = JSON.stringify({ status: 'ok' });
    const res = convertJsonToTypeScript(json, {
      ...defaultOptions,
      declarationType: 'type'
    });
    expect(res.code).toContain('export type UserResponse = {');
    expect(res.code).toContain('status: string;');
  });

  it('should generate nested interfaces for nested objects', () => {
    const json = JSON.stringify({
      user: {
        firstName: 'Jane',
        address: {
          city: 'London'
        }
      }
    });
    const res = convertJsonToTypeScript(json, defaultOptions);
    expect(res.code).toContain('export interface UserResponse {');
    expect(res.code).toContain('export interface User {');
    expect(res.code).toContain('export interface Address {');
    expect(res.code).toContain('user: User;');
    expect(res.typeCount).toBe(3);
  });

  it('should handle arrays of primitives', () => {
    const json = JSON.stringify({ tags: ['news', 'tech'], counts: [1, 2, 3] });
    const res = convertJsonToTypeScript(json, defaultOptions);
    expect(res.code).toContain('tags: string[];');
    expect(res.code).toContain('counts: number[];');
  });

  it('should handle arrays of objects and infer merged element types', () => {
    const json = JSON.stringify({
      items: [
        { id: 101, title: 'Item A', inStock: true },
        { id: 102, title: 'Item B' }
      ]
    });
    const res = convertJsonToTypeScript(json, defaultOptions);
    expect(res.code).toContain('items: Item[];');
    expect(res.code).toContain('export interface Item {');
    expect(res.code).toContain('id: number;');
    expect(res.code).toContain('title: string;');
    expect(res.code).toContain('inStock: boolean;');
  });

  it('should quote special or non-identifier property keys', () => {
    const json = JSON.stringify({
      'content-type': 'application/json',
      'user name': 'john',
      '123': 'numeric'
    });
    const res = convertJsonToTypeScript(json, defaultOptions);
    expect(res.code).toContain("'content-type': string;");
    expect(res.code).toContain("'user name': string;");
    expect(res.code).toContain("'123': string;");
  });

  it('should generate readonly modifiers when enabled', () => {
    const json = JSON.stringify({ id: 100 });
    const res = convertJsonToTypeScript(json, {
      ...defaultOptions,
      readonlyFields: true
    });
    expect(res.code).toContain('readonly id: number;');
  });

  it('should generate JSDoc comments with example values when enabled', () => {
    const json = JSON.stringify({ port: 8080 });
    const res = convertJsonToTypeScript(json, {
      ...defaultOptions,
      addComments: true
    });
    expect(res.code).toContain('/** Example: 8080 */');
  });

  it('should correctly convert comprehensive realistic samples', () => {
    const sample = JSON_TS_SAMPLES['userProfile'].json;
    const res = convertJsonToTypeScript(sample, defaultOptions);
    expect(res.error).toBeUndefined();
    expect(res.code).toContain('export interface UserResponse {');
    expect(res.code).toContain('geo: Geo;');
    expect(res.typeCount).toBeGreaterThanOrEqual(3);
  });
});
