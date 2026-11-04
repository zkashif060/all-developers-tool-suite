import { describe, it, expect } from 'vitest';
import { jsonToCsv, findCandidateArrayPaths } from './json-to-csv.engine';

describe('JSON to CSV Engine', () => {
  it('should auto-unwrap objects containing an array like {"employees": [...]} into rows', () => {
    const input = JSON.stringify({
      employees: [
        { id: 1001, name: 'Ahmed Khan', department: 'IT', salary: 75000 },
        { id: 1002, name: 'Sara Ali', department: 'HR', salary: 85000 }
      ]
    });

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.unwrappedKey).toBe('employees');
      expect(result.rowCount).toBe(2);
      expect(result.headers).toEqual(['id', 'name', 'department', 'salary']);
      expect(result.csv).toBe('id,name,department,salary\n1001,Ahmed Khan,IT,75000\n1002,Sara Ali,HR,85000');
    }
  });

  it('should merge parent metadata fields when auto-unwrapping an envelope', () => {
    const input = JSON.stringify({
      organization: 'TechLabs',
      year: 2026,
      employees: [
        { id: 1001, name: 'Ahmed Khan' }
      ]
    });

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false,
      mergeParentFields: true
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toContain('organization');
      expect(result.headers).toContain('year');
      expect(result.headers).toContain('id');
      expect(result.headers).toContain('name');
      expect(result.csv).toContain('TechLabs');
      expect(result.csv).toContain('Ahmed Khan');
    }
  });

  it('should convert a simple array of objects into CSV', () => {
    const input = JSON.stringify([
      { name: 'Ali', age: 25, city: 'Lahore' },
      { name: 'Sara', age: 27, city: 'Karachi' }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rowCount).toBe(2);
      expect(result.csv).toBe('name,age,city\nAli,25,Lahore\nSara,27,Karachi');
      expect(result.previewRows.length).toBe(2);
    }
  });

  it('should handle missing properties across objects by inserting empty cells', () => {
    const input = JSON.stringify([
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com', active: true }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toContain('id');
      expect(result.headers).toContain('name');
      expect(result.headers).toContain('email');
      expect(result.headers).toContain('active');
      const lines = result.csv.split('\n');
      expect(lines.length).toBe(4);
    }
  });

  it('should flatten nested objects using dot notation by default', () => {
    const input = JSON.stringify([
      { id: 10, user: { name: 'Zain', location: { city: 'Islamabad' } } }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toEqual(['id', 'user.name', 'user.location.city']);
      expect(result.csv).toBe('id,user.name,user.location.city\n10,Zain,Islamabad');
    }
  });

  it('should flatten nested objects using underscore notation when requested', () => {
    const input = JSON.stringify([
      { id: 10, user: { name: 'Zain', city: 'Lahore' } }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten_underscore',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toEqual(['id', 'user_name', 'user_city']);
      expect(result.csv).toBe('id,user_name,user_city\n10,Zain,Lahore');
    }
  });

  it('should serialize nested objects as JSON strings when stringify strategy is chosen', () => {
    const input = JSON.stringify([
      { id: 10, profile: { role: 'admin' } }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'stringify',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.headers).toEqual(['id', 'profile']);
      expect(result.csv).toContain('"{""role"":""admin""}"');
    }
  });

  it('should stringify arrays inside objects correctly by default', () => {
    const input = JSON.stringify([
      { name: 'Project A', tags: ['angular', 'typescript'] }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toContain('"[""angular"",""typescript""]"');
    }
  });

  it('should unwind nested arrays of variation/product objects into multiple rows when unwind strategy is selected', () => {
    const input = JSON.stringify([
      {
        id: 1001,
        company: 'TechSolutions Pakistan',
        products: [
          { id: 'PRD-001', name: 'Wireless Keyboard', price: 4500 },
          { id: 'PRD-002', name: 'USB-C Hub', price: 3200 }
        ]
      }
    ]);

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      arrayStrategy: 'unwind',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rowCount).toBe(2);
      expect(result.headers).toContain('products.name');
      expect(result.headers).toContain('products.price');
      expect(result.csv).toContain('Wireless Keyboard');
      expect(result.csv).toContain('USB-C Hub');
    }
  });

  it('should flatten nested array items into indexed columns when indexed strategy is selected', () => {
    const input = JSON.stringify([
      {
        id: 1001,
        products: [
          { id: 'P1', name: 'Keyboard' },
          { id: 'P2', name: 'Mouse' }
        ]
      }
    ]);

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      arrayStrategy: 'indexed',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rowCount).toBe(1);
      expect(result.headers).toContain('products.0.name');
      expect(result.headers).toContain('products.1.name');
    }
  });

  it('should format arrays as readable text when join strategy is selected', () => {
    const input = JSON.stringify([
      { id: 1, tags: ['frontend', 'angular', 'tailwind'] }
    ]);

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      arrayStrategy: 'join',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toContain('"frontend, angular, tailwind"');
    }
  });

  it('should escape internal double-quotes by doubling them per RFC 4180', () => {
    const input = JSON.stringify([
      { id: 1, comment: 'He said "Hello World" to the team.' }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toContain('"He said ""Hello World"" to the team."');
    }
  });

  it('should wrap values containing commas in double-quotes', () => {
    const input = JSON.stringify([
      { id: 1, address: 'Lahore, Punjab, Pakistan' }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toBe('id,address\n1,"Lahore, Punjab, Pakistan"');
    }
  });

  it('should wrap values containing newlines in double-quotes', () => {
    const input = JSON.stringify([
      { id: 1, notes: 'Line 1\nLine 2\nLine 3' }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toContain('"Line 1\nLine 2\nLine 3"');
    }
  });

  it('should handle empty arrays with a clear error message', () => {
    const result = jsonToCsv('[]');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('JSON array is empty');
    }
  });

  it('should handle non-array and primitive inputs with a clear error message', () => {
    const result = jsonToCsv('"Just a string"');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Input must be a JSON array of objects');
    }
  });

  it('should handle invalid JSON syntax with a descriptive error', () => {
    const result = jsonToCsv('[ { "unclosed": "object" ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid JSON syntax');
    }
  });

  it('should preserve Multilingual and Unicode text correctly', () => {
    const input = JSON.stringify([
      { person: 'علی', location: 'لاہور', emoji: '🌟' }
    ]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv).toContain('علی');
      expect(result.csv).toContain('لاہور');
      expect(result.csv).toContain('🌟');
    }
  });

  it('should prepend UTF-8 BOM when excelBom is enabled', () => {
    const input = JSON.stringify([{ a: 'test' }]);
    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      delimiter: ',',
      includeHeader: true,
      excelBom: true
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.csv.startsWith('\uFEFF')).toBe(true);
    }
  });

  it('should support alternative delimiters such as semicolon, tab and pipe', () => {
    const input = JSON.stringify([{ a: 1, b: 2 }]);
    const semiResult = jsonToCsv(input, { nestedStrategy: 'flatten', delimiter: ';', includeHeader: true, excelBom: false });
    expect(semiResult.success).toBe(true);
    if (semiResult.success) {
      expect(semiResult.csv).toBe('a;b\n1;2');
    }

    const tabResult = jsonToCsv(input, { nestedStrategy: 'flatten', delimiter: '\t', includeHeader: true, excelBom: false });
    expect(tabResult.success).toBe(true);
    if (tabResult.success) {
      expect(tabResult.csv).toBe('a\tb\n1\t2');
    }

    const pipeResult = jsonToCsv(input, { nestedStrategy: 'flatten', delimiter: '|', includeHeader: true, excelBom: false });
    expect(pipeResult.success).toBe(true);
    if (pipeResult.success) {
      expect(pipeResult.csv).toBe('a|b\n1|2');
    }
  });

  it('should unwind multiple arrays (products and orders) and nested settings into aligned rows', () => {
    const input = JSON.stringify({
      id: 1001,
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      role: 'admin',
      company: 'TechSolutions Pakistan',
      active: true,
      settings: {
        timezone: 'Asia/Karachi',
        currency: 'PKR',
        notifications: true
      },
      products: [
        { id: 'PRD-001', name: 'Wireless Keyboard', price: 4500, stock: 35 },
        { id: 'PRD-002', name: 'USB-C Hub', price: 3200, stock: 12 }
      ],
      orders: [
        { order_id: 'ORD-001', customer: 'Ali Enterprises', quantity: 2, total: 9000, payment_status: 'paid' }
      ]
    });

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      arrayStrategy: 'unwind',
      delimiter: ',',
      includeHeader: true,
      excelBom: false,
      repeatParentValues: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rowCount).toBe(2);
      expect(result.headers).toEqual([
        'id',
        'name',
        'email',
        'role',
        'company',
        'active',
        'settings.timezone',
        'settings.currency',
        'settings.notifications',
        'products.id',
        'products.name',
        'products.price',
        'products.stock',
        'orders.order_id',
        'orders.customer',
        'orders.quantity',
        'orders.total',
        'orders.payment_status'
      ]);

      const lines = result.csv.split('\n');
      expect(lines.length).toBe(3); // header + 2 rows

      // Row 1: Ahmed Khan, products[0] (PRD-001), orders[0] (ORD-001)
      expect(lines[1]).toBe(
        '1001,Ahmed Khan,ahmed@example.com,admin,TechSolutions Pakistan,true,Asia/Karachi,PKR,true,PRD-001,Wireless Keyboard,4500,35,ORD-001,Ali Enterprises,2,9000,paid'
      );

      // Row 2: 9 blank parent fields, products[1] (PRD-002), 5 blank orders fields
      expect(lines[2]).toBe(
        ',,,,,,,,,PRD-002,USB-C Hub,3200,12,,,,,'
      );
    }
  });

  it('should support tab-separated output for multi-array entity', () => {
    const input = JSON.stringify({
      id: 1001,
      name: 'Ahmed Khan',
      products: [
        { id: 'PRD-001', name: 'Wireless Keyboard' },
        { id: 'PRD-002', name: 'USB-C Hub' }
      ]
    });

    const result = jsonToCsv(input, {
      nestedStrategy: 'flatten',
      arrayStrategy: 'unwind',
      delimiter: '\t',
      includeHeader: false,
      excelBom: false,
      repeatParentValues: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.csv.split('\n');
      expect(lines[0]).toBe('1001\tAhmed Khan\tPRD-001\tWireless Keyboard');
      expect(lines[1]).toBe('\t\tPRD-002\tUSB-C Hub');
    }
  });

  it('should find candidate array paths correctly', () => {
    const payload = {
      status: 'ok',
      users: [{ id: 1 }, { id: 2 }],
      nested: {
        items: [{ sku: 'A1' }]
      }
    };
    const paths = findCandidateArrayPaths(payload);
    expect(paths.map(p => p.path)).toContain('users');
    expect(paths.map(p => p.path)).toContain('nested.items');
  });
});
