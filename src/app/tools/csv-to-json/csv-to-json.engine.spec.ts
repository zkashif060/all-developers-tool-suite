import { describe, it, expect } from 'vitest';
import { csvToJson } from './csv-to-json.engine';

describe('CSV to JSON Engine', () => {
  it('should parse basic CSV with headers into array of objects', () => {
    const input = 'id,name,role\n1,Alice,Engineer\n2,Bob,Architect';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rowCount).toBe(2);
      expect(result.columnCount).toBe(3);
      const parsed = JSON.parse(result.json);
      expect(parsed).toEqual([
        { id: 1, name: 'Alice', role: 'Engineer' },
        { id: 2, name: 'Bob', role: 'Architect' }
      ]);
    }
  });

  it('should handle quoted fields containing commas', () => {
    const input = 'id,location\n101,"Lahore, Punjab, Pakistan"\n102,"New York, NY"';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].location).toBe('Lahore, Punjab, Pakistan');
      expect(parsed[1].location).toBe('New York, NY');
    }
  });

  it('should handle escaped quotes ("") correctly', () => {
    const input = 'id,quote\n1,"He said ""Hello World""."';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].quote).toBe('He said "Hello World".');
    }
  });

  it('should handle multiline content inside quoted fields', () => {
    const input = 'id,notes\n1,"First Line\nSecond Line\nThird Line"';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].notes).toBe('First Line\nSecond Line\nThird Line');
    }
  });

  it('should handle empty cell values as null', () => {
    const input = 'name,phone,email\nAli,,ali@example.com\nSara,03001234567,';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].phone).toBeNull();
      expect(parsed[1].email).toBeNull();
    }
  });

  it('should handle duplicate headers by suffixing them without overwriting data', () => {
    const input = 'name,age,name\nAli,25,Junior Ali';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].name).toBe('Ali');
      expect(parsed[0].name_2).toBe('Junior Ali');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('Duplicate header "name"');
    }
  });

  it('should handle missing / empty header names by assigning column_N', () => {
    const input = 'id,,status\n1,Alpha,Active';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].column_2).toBe('Alpha');
      expect(result.warnings).toBeDefined();
    }
  });

  it('should handle empty or whitespace-only CSV input gracefully', () => {
    const result = csvToJson('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Input is empty');
    }
  });

  it('should preserve Unicode and multilingual characters', () => {
    const input = 'title,author,emoji\nرہنمائی,علامہ اقبال,📚\nDevTools,开发者,🚀';
    const result = csvToJson(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed[0].title).toBe('رہنمائی');
      expect(parsed[0].author).toBe('علامہ اقبال');
      expect(parsed[0].emoji).toBe('📚');
      expect(parsed[1].emoji).toBe('🚀');
    }
  });

  it('should support array of arrays when hasHeader is false', () => {
    const input = 'apple,banana,cherry\n10,20,30';
    const result = csvToJson(input, { hasHeader: false, dynamicTyping: true, indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.json);
      expect(parsed).toEqual([
        ['apple', 'banana', 'cherry'],
        [10, 20, 30]
      ]);
    }
  });
  it('should support manual delimiter override for semicolon-separated data', () => {
    const input = 'name;price;stock\nCoffee;4,50;100\nTea;2,75;250';
    const result = csvToJson(input, { delimiter: ';', hasHeader: true, dynamicTyping: false, indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.detectedDelimiter).toBe(';');
      const parsed = JSON.parse(result.json);
      expect(parsed).toEqual([
        { name: 'Coffee', price: '4,50', stock: '100' },
        { name: 'Tea', price: '2,75', stock: '250' }
      ]);
    }
  });

  it('should support manual delimiter override for tab-separated data (TSV)', () => {
    const input = 'id\tusername\trole\n1\tzain\tadmin\n2\tsarah\tdeveloper';
    const result = csvToJson(input, { delimiter: '\t', hasHeader: true, dynamicTyping: true, indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.detectedDelimiter).toBe('\t');
      const parsed = JSON.parse(result.json);
      expect(parsed[0].username).toBe('zain');
      expect(parsed[1].role).toBe('developer');
    }
  });

  it('should support manual delimiter override for pipe-separated data', () => {
    const input = 'sku|item|active\nSKU-100|Keyboard|true\nSKU-200|Mouse|false';
    const result = csvToJson(input, { delimiter: '|', hasHeader: true, dynamicTyping: true, indent: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.detectedDelimiter).toBe('|');
      const parsed = JSON.parse(result.json);
      expect(parsed[0].active).toBe(true);
      expect(parsed[1].active).toBe(false);
    }
  });
});
