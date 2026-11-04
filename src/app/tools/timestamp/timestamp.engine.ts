export type TimestampUnit = 'seconds' | 'milliseconds' | 'auto';

export interface TimestampToDateResult {
  success: true;
  timestamp: number;
  unit: 'seconds' | 'milliseconds';
  utc: string;
  local: string;
  iso: string;
  relative: string;
  timezoneName: string;
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface TimestampError {
  success: false;
  error: string;
}

export type TimestampParseResult = TimestampToDateResult | TimestampError;

export interface DateToTimestampResult {
  seconds: number;
  milliseconds: number;
  iso: string;
  utc: string;
}

/**
 * Generates human-friendly relative time (e.g. "2 hours ago", "in 3 days").
 */
export function getRelativeTimeString(ms: number, nowMs: number = Date.now()): string {
  const diffSec = Math.floor((ms - nowMs) / 1000);
  const absDiff = Math.abs(diffSec);

  const minutes = Math.floor(absDiff / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let str = '';
  if (years > 0) {
    str = `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    str = `${months} month${months > 1 ? 's' : ''}`;
  } else if (days > 0) {
    str = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    str = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    str = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    str = `${absDiff} second${absDiff !== 1 ? 's' : ''}`;
  }

  if (absDiff < 5) {
    return 'just now';
  }

  return diffSec < 0 ? `${str} ago` : `in ${str}`;
}

/**
 * Converts a Unix timestamp string or number into structured date formats.
 */
export function timestampToDate(
  input: string | number,
  unit: TimestampUnit = 'auto'
): TimestampParseResult {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return {
        success: false,
        error: 'Timestamp input is empty. Please enter a Unix timestamp.'
      };
    }

    // Strict numeric check (allows negative, integer or float)
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return {
        success: false,
        error: `Invalid timestamp format "${trimmed}". Must be a valid numeric Unix timestamp.`
      };
    }
  }

  const rawNum = typeof input === 'number' ? input : Number(input);

  if (isNaN(rawNum) || !isFinite(rawNum)) {
    return {
      success: false,
      error: 'Value is not a finite number.'
    };
  }

  // Truncate decimals for timestamp calculation
  const intVal = Math.trunc(rawNum);

  let resolvedUnit: 'seconds' | 'milliseconds';
  let ms: number;

  if (unit === 'seconds') {
    resolvedUnit = 'seconds';
    ms = intVal * 1000;
  } else if (unit === 'milliseconds') {
    resolvedUnit = 'milliseconds';
    ms = intVal;
  } else {
    // Auto-detect: Values with more than 11 digits (or > 30000000000) are milliseconds
    const absVal = Math.abs(intVal);
    if (absVal >= 30000000000) {
      resolvedUnit = 'milliseconds';
      ms = intVal;
    } else {
      resolvedUnit = 'seconds';
      ms = intVal * 1000;
    }
  }

  // Check JavaScript Date valid range: +/- 8,640,000,000,000,000 ms (~100,000,000 days from epoch)
  const MAX_DATE_MS = 8640000000000000;
  if (ms < -MAX_DATE_MS || ms > MAX_DATE_MS) {
    return {
      success: false,
      error: `Timestamp is out of range. JavaScript Date supports timestamps between -8.64e15 and +8.64e15 ms.`
    };
  }

  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    return {
      success: false,
      error: 'Failed to construct a valid Date from the provided timestamp.'
    };
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return {
    success: true,
    timestamp: intVal,
    unit: resolvedUnit,
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    iso: date.toISOString(),
    relative: getRelativeTimeString(ms),
    timezoneName: tz,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds()
  };
}

/**
 * Converts a standard date string, datetime-local string, or Date object into Unix seconds and milliseconds.
 */
export function dateToTimestamp(dateInput: string | Date): DateToTimestampResult | TimestampError {
  let d: Date;

  if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    const trimmed = (dateInput || '').trim();
    if (!trimmed) {
      return {
        success: false,
        error: 'Date input is empty. Please select or enter a valid date.'
      };
    }
    d = new Date(trimmed);
  }

  if (isNaN(d.getTime())) {
    return {
      success: false,
      error: 'Invalid Date format. Unable to parse into a valid timestamp.'
    };
  }

  const ms = d.getTime();
  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    iso: d.toISOString(),
    utc: d.toUTCString()
  };
}

