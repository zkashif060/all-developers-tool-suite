import Papa from 'papaparse';

export type CsvDelimiter = 'auto' | ',' | ';' | '\t' | '|';

export interface CsvToJsonOptions {
  delimiter?: CsvDelimiter;
  hasHeader: boolean;
  dynamicTyping: boolean;
  indent: 2 | 4 | 'minify';
}

export interface CsvToJsonSuccess {
  success: true;
  json: string;
  rowCount: number;
  columnCount: number;
  detectedDelimiter: string;
  warnings?: string[];
}

export interface CsvToJsonError {
  success: false;
  error: string;
  line?: number;
}

export type CsvToJsonResult = CsvToJsonSuccess | CsvToJsonError;

/**
 * Resolves duplicate and empty headers to prevent silent data loss.
 */
export function sanitizeHeaders(rawHeaders: string[]): { headers: string[]; warnings: string[] } {
  const seenCount = new Map<string, number>();
  const sanitized: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < rawHeaders.length; i++) {
    let h = (rawHeaders[i] ?? '').trim();
    if (!h) {
      h = `column_${i + 1}`;
      warnings.push(`Empty header at column ${i + 1} was assigned name "${h}".`);
    }

    const currentCount = seenCount.get(h) || 0;
    if (currentCount > 0) {
      const renamed = `${h}_${currentCount + 1}`;
      warnings.push(`Duplicate header "${h}" at column ${i + 1} was renamed to "${renamed}" to prevent data overwrite.`);
      seenCount.set(h, currentCount + 1);
      sanitized.push(renamed);
    } else {
      seenCount.set(h, 1);
      sanitized.push(h);
    }
  }

  return { headers: sanitized, warnings };
}

/**
 * Parses CSV text into JSON with support for RFC 4180 quotes, delimiters, newlines, and duplicate headers.
 */
export function csvToJson(
  input: string,
  options: CsvToJsonOptions = {
    delimiter: 'auto',
    hasHeader: true,
    dynamicTyping: true,
    indent: 2
  }
): CsvToJsonResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Input is empty. Please enter or paste CSV content.'
    };
  }

  const papaConfig: Papa.ParseConfig = {
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  };

  if (options.delimiter && options.delimiter !== 'auto') {
    papaConfig.delimiter = options.delimiter;
  }

  // Parse raw matrix first to safely inspect and sanitize headers
  const parsed = Papa.parse<any[]>(input, papaConfig);

  if (parsed.errors && parsed.errors.length > 0) {
    const firstFatal = parsed.errors.find(e => e.type === 'Quotes' || e.code === 'UndetectableDelimiter');
    if (firstFatal) {
      return {
        success: false,
        error: `CSV Parsing Error: ${firstFatal.message}`,
        line: firstFatal.row !== undefined ? firstFatal.row + 1 : undefined
      };
    }
  }

  const dataRows = parsed.data;
  if (!dataRows || dataRows.length === 0) {
    return {
      success: false,
      error: 'No valid data rows found in the CSV input.'
    };
  }

  const detectedDelimiter = parsed.meta.delimiter || (options.delimiter && options.delimiter !== 'auto' ? options.delimiter : ',');

  let finalData: any;
  let columnCount = 0;
  let rowCount = 0;
  let warnings: string[] = [];

  if (options.hasHeader) {
    if (dataRows.length < 2) {
      return {
        success: false,
        error: 'CSV with header row enabled must contain at least a header row and one data row.'
      };
    }

    const rawHeaders = (dataRows[0] as string[]).map(h => (h !== undefined && h !== null ? String(h) : ''));
    const sanitizedResult = sanitizeHeaders(rawHeaders);
    const headers = sanitizedResult.headers;
    warnings = sanitizedResult.warnings;
    columnCount = headers.length;

    const rows = dataRows.slice(1);
    rowCount = rows.length;

    const jsonObjects: Array<Record<string, any>> = [];

    for (const row of rows) {
      const obj: Record<string, any> = {};
      for (let c = 0; c < headers.length; c++) {
        const headerName = headers[c];
        let val = row[c];

        if (val === undefined || val === null || val === '') {
          obj[headerName] = null;
        } else if (options.dynamicTyping) {
          obj[headerName] = parseDynamicType(val);
        } else {
          obj[headerName] = String(val);
        }
      }
      jsonObjects.push(obj);
    }
    finalData = jsonObjects;
  } else {
    // Array of arrays
    rowCount = dataRows.length;
    columnCount = Math.max(...dataRows.map(r => (Array.isArray(r) ? r.length : 0)));

    finalData = dataRows.map(row => {
      if (!Array.isArray(row)) return [];
      return row.map(cell => {
        if (cell === undefined || cell === null || cell === '') {
          return null;
        }
        return options.dynamicTyping ? parseDynamicType(cell) : String(cell);
      });
    });
  }

  const indentVal = options.indent === 'minify' ? 0 : options.indent;
  const jsonString = indentVal === 0 ? JSON.stringify(finalData) : JSON.stringify(finalData, null, indentVal);

  return {
    success: true,
    json: jsonString,
    rowCount,
    columnCount,
    detectedDelimiter,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Infers and parses booleans and numbers with safe bounds.
 */
function parseDynamicType(val: any): any {
  if (typeof val !== 'string') return val;
  const clean = val.trim();

  // Boolean
  if (clean.toLowerCase() === 'true') return true;
  if (clean.toLowerCase() === 'false') return false;

  // Null
  if (clean.toLowerCase() === 'null') return null;

  // Number validation (prevent parsing phone numbers with leading zeros or empty string)
  if (clean !== '' && !isNaN(Number(clean))) {
    // Check if it's a number with a leading zero (like zip code or phone '01234')
    if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
      return clean;
    }
    const num = Number(clean);
    if (Number.isSafeInteger(num) || !isNaN(num)) {
      return num;
    }
  }

  return val;
}
