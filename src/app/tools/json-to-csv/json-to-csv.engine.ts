export type NestedHandlingStrategy = 'flatten' | 'flatten_underscore' | 'stringify';
export type ArrayHandlingStrategy = 'unwind' | 'join' | 'indexed' | 'stringify';

export interface JsonToCsvOptions {
  nestedStrategy: NestedHandlingStrategy;
  arrayStrategy?: ArrayHandlingStrategy;
  delimiter: ',' | ';' | '\t' | '|';
  includeHeader: boolean;
  excelBom?: boolean;
  arrayPath?: string;
  mergeParentFields?: boolean;
  repeatParentValues?: boolean;
}

export interface ArrayPathOption {
  path: string;
  label: string;
  count: number;
}

export interface JsonToCsvSuccess {
  success: true;
  csv: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  previewRows: string[][];
  unwrappedKey?: string;
  availablePaths: ArrayPathOption[];
}

export interface JsonToCsvError {
  success: false;
  error: string;
}

export type JsonToCsvResult = JsonToCsvSuccess | JsonToCsvError;

/**
 * Scans a JSON structure to discover all candidate array paths (e.g. root, employees, data.items).
 */
export function findCandidateArrayPaths(parsed: any): ArrayPathOption[] {
  const result: ArrayPathOption[] = [];

  if (Array.isArray(parsed)) {
    result.push({ path: '', label: `Root Array (${parsed.length} records)`, count: parsed.length });
    return result;
  }

  if (parsed !== null && typeof parsed === 'object') {
    for (const key of Object.keys(parsed)) {
      const val = parsed[key];
      if (Array.isArray(val) && val.length > 0) {
        result.push({
          path: key,
          label: `${key} (${val.length} records)`,
          count: val.length
        });
      } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        for (const subKey of Object.keys(val)) {
          const subVal = val[subKey];
          if (Array.isArray(subVal) && subVal.length > 0) {
            result.push({
              path: `${key}.${subKey}`,
              label: `${key}.${subKey} (${subVal.length} records)`,
              count: subVal.length
            });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Extracts candidate records and metadata from the input JSON.
 */
export function extractRecordArray(
  parsed: any,
  chosenPath?: string,
  mergeParentFields = true
): { data: any[] | null; unwrappedKey?: string; availablePaths: ArrayPathOption[] } {
  const availablePaths = findCandidateArrayPaths(parsed);

  if (Array.isArray(parsed)) {
    return { data: parsed, availablePaths };
  }

  if (parsed !== null && typeof parsed === 'object') {
    const keys = Object.keys(parsed);

    // If a specific path was chosen
    if (chosenPath) {
      const parts = chosenPath.split('.');
      let current: any = parsed;
      for (const p of parts) {
        if (current && typeof current === 'object') {
          current = current[p];
        } else {
          current = null;
          break;
        }
      }

      if (Array.isArray(current)) {
        if (mergeParentFields) {
          const parentMetadata: Record<string, any> = {};
          for (const k of keys) {
            if (k !== parts[0] && typeof parsed[k] !== 'object') {
              parentMetadata[k] = parsed[k];
            }
          }
          const merged = current.map(item =>
            typeof item === 'object' && item !== null ? { ...parentMetadata, ...item } : item
          );
          return { data: merged, unwrappedKey: chosenPath, availablePaths };
        }
        return { data: current, unwrappedKey: chosenPath, availablePaths };
      }
    }

    // Auto-selection:
    // Check if the object contains arrays of objects
    const objectArrayKeys = keys.filter(
      k => Array.isArray(parsed[k]) && parsed[k].length > 0 && typeof parsed[k][0] === 'object' && parsed[k][0] !== null
    );

    // Case 1: Single key whose value is an array of objects (e.g. { "employees": [...] })
    if (keys.length === 1 && objectArrayKeys.length === 1) {
      return { data: parsed[keys[0]], unwrappedKey: keys[0], availablePaths };
    }

    // Case 2: Standard REST API collection envelope (e.g. { status: 'ok', total: 10, data: [...] })
    // Only unwrap if:
    // a) There is EXACTLY ONE array of objects (not multiple collections like products and orders)
    // b) The candidate key is a standard collection name ('data', 'items', 'results', 'records', 'rows', 'list', 'payload', or 'employees' with scalar metadata)
    // c) All other keys are primitive scalars (no nested objects like settings or secondary arrays)
    const envelopeCandidateKeys = ['data', 'items', 'results', 'records', 'rows', 'list', 'payload'];
    if (objectArrayKeys.length === 1) {
      const ck = objectArrayKeys[0];
      const isEnvelopeCandidate = envelopeCandidateKeys.includes(ck) || (ck === 'employees' && keys.length <= 4);
      const otherKeysAreScalars = keys.every(k => k === ck || (typeof parsed[k] !== 'object' && !Array.isArray(parsed[k])) || parsed[k] === null);

      if (isEnvelopeCandidate && otherKeysAreScalars) {
        if (mergeParentFields) {
          const parentMetadata: Record<string, any> = {};
          for (const k of keys) {
            if (k !== ck && typeof parsed[k] !== 'object') {
              parentMetadata[k] = parsed[k];
            }
          }
          const merged = parsed[ck].map((item: any) =>
            typeof item === 'object' && item !== null ? { ...parentMetadata, ...item } : item
          );
          return { data: merged, unwrappedKey: ck, availablePaths };
        }
        return { data: parsed[ck], unwrappedKey: ck, availablePaths };
      }
    }

    // Otherwise, treat the root object as a rich entity record with nested fields and multiple arrays
    return { data: [parsed], availablePaths };
  }

  return { data: null, availablePaths };
}

/**
 * Recursively flattens an object into dot or underscore notation paths.
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  arrayStrategy: ArrayHandlingStrategy = 'stringify',
  separator = '.'
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const propPath = prefix ? `${prefix}${separator}${key}` : key;
    const val = obj[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0) {
      const nested = flattenObject(val, propPath, arrayStrategy, separator);
      Object.assign(result, nested);
    } else if (Array.isArray(val)) {
      if (arrayStrategy === 'indexed') {
        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          if (item !== null && typeof item === 'object') {
            Object.assign(result, flattenObject(item, `${propPath}${separator}${i}`, arrayStrategy, separator));
          } else {
            result[`${propPath}${separator}${i}`] = item;
          }
        }
      } else if (arrayStrategy === 'join') {
        if (val.length === 0) {
          result[propPath] = '';
        } else if (typeof val[0] === 'object' && val[0] !== null) {
          // Format object array items cleanly (e.g. name or description)
          result[propPath] = val
            .map(item => {
              if (item.name) return `${item.name}${item.price ? ` ($${item.price})` : ''}`;
              if (item.title) return item.title;
              if (item.id) return item.id;
              return JSON.stringify(item);
            })
            .join('; ');
        } else {
          result[propPath] = val.join(', ');
        }
      } else {
        result[propPath] = JSON.stringify(val);
      }
    } else {
      result[propPath] = val;
    }
  }

  return result;
}

/**
 * Unwinds array fields (such as variations, products, orders) into separate rows, aligning array items in columns.
 */
export function unwindObjectArrays(
  record: Record<string, any>,
  separator = '.',
  repeatParent = false
): Array<Record<string, any>> {
  const parentBase: Record<string, any> = {};
  const arrayMap: Record<string, any[]> = {};
  const arrayKeys: string[] = [];

  for (const key of Object.keys(record)) {
    const val = record[key];
    if (Array.isArray(val) && val.length > 0) {
      arrayKeys.push(key);
      arrayMap[key] = val;
    } else if (Array.isArray(val) && val.length === 0) {
      parentBase[key] = '';
    } else {
      parentBase[key] = val;
    }
  }

  if (arrayKeys.length === 0) {
    return [flattenObject(record, '', 'stringify', separator)];
  }

  const parentFlattened = flattenObject(parentBase, '', 'stringify', separator);
  const maxRows = Math.max(...arrayKeys.map(k => arrayMap[k].length));

  const arrayItemsFlattened: Record<string, Array<Record<string, any>>> = {};
  for (const k of arrayKeys) {
    arrayItemsFlattened[k] = [];
    for (let r = 0; r < arrayMap[k].length; r++) {
      const item = arrayMap[k][r];
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        arrayItemsFlattened[k].push(flattenObject(item, k, 'stringify', separator));
      } else if (Array.isArray(item)) {
        arrayItemsFlattened[k].push({ [k]: JSON.stringify(item) });
      } else {
        arrayItemsFlattened[k].push({ [k]: item });
      }
    }
  }

  const results: Array<Record<string, any>> = [];

  for (let r = 0; r < maxRows; r++) {
    const row: Record<string, any> = {};

    for (const pk of Object.keys(parentFlattened)) {
      row[pk] = (r === 0 || repeatParent) ? parentFlattened[pk] : '';
    }

    for (const k of arrayKeys) {
      const flattenedItem = arrayItemsFlattened[k][r];
      if (flattenedItem) {
        Object.assign(row, flattenedItem);
      }
    }

    results.push(row);
  }

  return results;
}

/**
 * Escapes a cell value according to RFC 4180 rules.
 */
export function escapeCsvCell(val: any, delimiter: string): string {
  if (val === null || val === undefined) {
    return '';
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Converts a JSON string containing an array of objects into RFC 4180 compliant CSV.
 */
export function jsonToCsv(
  input: string,
  options: JsonToCsvOptions = {
    nestedStrategy: 'flatten',
    arrayStrategy: 'unwind',
    delimiter: ',',
    includeHeader: true,
    excelBom: true,
    mergeParentFields: true,
    repeatParentValues: false
  }
): JsonToCsvResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Input is empty. Please enter or paste a JSON array of objects.'
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(input);
  } catch (err: any) {
    return {
      success: false,
      error: `Invalid JSON syntax: ${err.message}`
    };
  }

  const separator = options.nestedStrategy === 'flatten_underscore' ? '_' : '.';
  const extraction = extractRecordArray(parsed, options.arrayPath, options.mergeParentFields ?? true);
  parsed = extraction.data;
  const unwrappedKey = extraction.unwrappedKey;
  const availablePaths = extraction.availablePaths;

  if (!parsed || !Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Input must be a JSON array of objects (e.g. [{"name": "Ali", "age": 25}]).'
    };
  }

  if (parsed.length === 0) {
    return {
      success: false,
      error: 'JSON array is empty. Please provide an array with at least one object.'
    };
  }

  const arrayStrategy = options.arrayStrategy || 'stringify';
  const processedRows: Array<Record<string, any>> = [];
  const headerSet = new Set<string>();

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return {
        success: false,
        error: `Item at index ${i} is not an object. Each element in the JSON array must be an object.`
      };
    }

    if (arrayStrategy === 'unwind') {
      const unwound = unwindObjectArrays(item, separator, options.repeatParentValues ?? false);
      for (const row of unwound) {
        Object.keys(row).forEach(k => headerSet.add(k));
        processedRows.push(row);
      }
    } else {
      let processed: Record<string, any>;
      if (options.nestedStrategy === 'flatten' || options.nestedStrategy === 'flatten_underscore') {
        processed = flattenObject(item, '', arrayStrategy, separator);
      } else {
        processed = {};
        for (const k of Object.keys(item)) {
          const v = item[k];
          processed[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
        }
      }

      Object.keys(processed).forEach(k => headerSet.add(k));
      processedRows.push(processed);
    }
  }

  const headers = Array.from(headerSet);
  if (headers.length === 0) {
    return {
      success: false,
      error: 'The provided objects have no keys to generate CSV columns.'
    };
  }

  const lines: string[] = [];

  if (options.includeHeader) {
    const headerLine = headers.map(h => escapeCsvCell(h, options.delimiter)).join(options.delimiter);
    lines.push(headerLine);
  }

  for (const row of processedRows) {
    const rowValues = headers.map(h => escapeCsvCell(row[h], options.delimiter));
    lines.push(rowValues.join(options.delimiter));
  }

  // Pre-generate table preview rows (up to 50 rows) for rapid client-side rendering
  const previewRows = processedRows.slice(0, 50).map(row =>
    headers.map(h => (row[h] !== undefined && row[h] !== null ? (typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])) : ''))
  );

  const bom = options.excelBom ? '\uFEFF' : '';
  const csvOutput = bom + lines.join('\n');

  return {
    success: true,
    csv: csvOutput,
    rowCount: processedRows.length,
    columnCount: headers.length,
    headers,
    previewRows,
    unwrappedKey,
    availablePaths
  };
}
