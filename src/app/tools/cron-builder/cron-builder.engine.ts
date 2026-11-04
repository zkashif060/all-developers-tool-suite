export interface CronFieldDefinition {
  name: string;
  min: number;
  max: number;
  names?: Record<string, number>;
}

export const CRON_FIELDS: CronFieldDefinition[] = [
  { name: 'Minute', min: 0, max: 59 },
  { name: 'Hour', min: 0, max: 23 },
  { name: 'Day of Month', min: 1, max: 31 },
  {
    name: 'Month',
    min: 1,
    max: 12,
    names: {
      JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
      JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
    }
  },
  {
    name: 'Day of Week',
    min: 0,
    max: 7, // 0 and 7 both represent Sunday in standard cron
    names: {
      SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
    }
  }
];

export interface CronValidationSuccess {
  valid: true;
  fields: string[];
  humanExplanation: string;
}

export interface CronValidationError {
  valid: false;
  error: string;
}

export type CronValidationResult = CronValidationSuccess | CronValidationError;

/**
 * Validates an individual cron field sub-atom against range and syntax rules.
 */
function validateSubAtom(val: string, field: CronFieldDefinition): boolean {
  let numVal: number;
  const upper = val.toUpperCase();

  if (field.names && field.names[upper] !== undefined) {
    numVal = field.names[upper];
  } else if (/^\d+$/.test(val)) {
    numVal = parseInt(val, 10);
  } else {
    return false;
  }

  return numVal >= field.min && numVal <= field.max;
}

/**
 * Validates a single cron field (supports wildcards, step intervals, ranges, lists, or single values).
 */
export function validateCronField(fieldStr: string, fieldDef: CronFieldDefinition): { valid: boolean; error?: string } {
  const trimmed = fieldStr.trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldDef.name} cannot be empty.` };
  }

  // Comma-separated list (e.g. 1,5,10)
  const atoms = trimmed.split(',');
  for (const atom of atoms) {
    if (!atom) {
      return { valid: false, error: `Empty list element in ${fieldDef.name}.` };
    }

    // Step value (e.g. */5 or 10-50/5)
    if (atom.includes('/')) {
      const parts = atom.split('/');
      if (parts.length !== 2) {
        return { valid: false, error: `Invalid step syntax in ${fieldDef.name}: "${atom}".` };
      }
      const [base, step] = parts;
      const stepNum = parseInt(step, 10);
      if (!/^\d+$/.test(step) || stepNum <= 0) {
        return { valid: false, error: `Step in ${fieldDef.name} must be a positive integer.` };
      }

      if (base !== '*') {
        // Base can be a range (e.g. 10-30) or single number
        if (base.includes('-')) {
          const rangeParts = base.split('-');
          if (rangeParts.length !== 2 || !validateSubAtom(rangeParts[0], fieldDef) || !validateSubAtom(rangeParts[1], fieldDef)) {
            return { valid: false, error: `Invalid range base in ${fieldDef.name}: "${base}".` };
          }
        } else if (!validateSubAtom(base, fieldDef)) {
          return { valid: false, error: `Invalid base value in ${fieldDef.name}: "${base}".` };
        }
      }
      continue;
    }

    // Range (e.g. 1-5 or MON-FRI)
    if (atom.includes('-')) {
      const rangeParts = atom.split('-');
      if (rangeParts.length !== 2) {
        return { valid: false, error: `Invalid range syntax in ${fieldDef.name}: "${atom}".` };
      }
      const [start, end] = rangeParts;
      if (!validateSubAtom(start, fieldDef) || !validateSubAtom(end, fieldDef)) {
        return { valid: false, error: `Range values out of bounds (${fieldDef.min}-${fieldDef.max}) in ${fieldDef.name}: "${atom}".` };
      }
      continue;
    }

    // Wildcard (*)
    if (atom === '*') {
      continue;
    }

    // Single value
    if (!validateSubAtom(atom, fieldDef)) {
      return { valid: false, error: `Value out of bounds (${fieldDef.min}-${fieldDef.max}) in ${fieldDef.name}: "${atom}".` };
    }
  }

  return { valid: true };
}

/**
 * Generates an accurate plain-English human explanation of a 5-field cron expression.
 */
export function explainCron(parts: string[]): string {
  if (parts.length !== 5) return 'Invalid cron expression';

  const [min, hour, dom, mon, dow] = parts;

  // Common special patterns
  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every minute';
  }
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Every ${min.slice(2)} minutes`;
  }
  if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every hour, at minute 0';
  }
  if (min === '0' && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    return `Every ${hour.slice(2)} hours, on the hour`;
  }
  if (min === '0' && hour === '0' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every day at midnight (00:00)';
  }
  if (min === '0' && hour === '12' && dom === '*' && mon === '*' && dow === '*') {
    return 'Every day at noon (12:00)';
  }
  if (min === '0' && hour === '0' && dom === '1' && mon === '*' && dow === '*') {
    return 'At 00:00 on day 1 of every month';
  }
  if (min === '0' && hour === '0' && dom === '*' && mon === '*' && dow === '1') {
    return 'At 00:00 every Monday';
  }
  if (min === '0' && hour === '9' && dom === '*' && mon === '*' && dow === '1-5') {
    return 'At 09:00, Monday through Friday';
  }

  // Construct structured explanation
  let desc = 'At ';

  // Time part
  if (min === '*' && hour === '*') {
    desc += 'every minute ';
  } else if (min.startsWith('*/') && hour === '*') {
    desc += `every ${min.slice(2)} minutes `;
  } else if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
    const hh = hour.padStart(2, '0');
    const mm = min.padStart(2, '0');
    desc += `${hh}:${mm} `;
  } else {
    desc += `minute ${min}, hour ${hour} `;
  }

  // Day of Month part
  if (dom !== '*') {
    desc += `on day ${dom} of the month `;
  }

  // Month part
  if (mon !== '*') {
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (/^\d+$/.test(mon) && parseInt(mon, 10) >= 1 && parseInt(mon, 10) <= 12) {
      desc += `in ${monthNames[parseInt(mon, 10)]} `;
    } else {
      desc += `in month ${mon} `;
    }
  }

  // Day of Week part
  if (dow !== '*') {
    const days: Record<string, string> = {
      '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday'
    };
    if (days[dow]) {
      desc += `on ${days[dow]} `;
    } else if (dow === '1-5') {
      desc += `on Monday through Friday `;
    } else {
      desc += `on weekday ${dow} `;
    }
  }

  return desc.trim() + '.';
}

/**
 * Validates and parses a 5-field cron expression string.
 */
export function validateCronExpression(expression: string): CronValidationResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Cron expression is empty. Please enter a valid 5-field cron string.'
    };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      error: `Invalid field count: Found ${parts.length} field${parts.length === 1 ? '' : 's'}. Standard cron requires exactly 5 fields (minute, hour, day of month, month, day of week).`
    };
  }

  for (let i = 0; i < 5; i++) {
    const valRes = validateCronField(parts[i], CRON_FIELDS[i]);
    if (!valRes.valid) {
      return {
        valid: false,
        error: valRes.error || `Invalid value in ${CRON_FIELDS[i].name} field.`
      };
    }
  }

  return {
    valid: true,
    fields: parts,
    humanExplanation: explainCron(parts)
  };
}
