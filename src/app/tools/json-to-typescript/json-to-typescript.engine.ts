export type TsDeclarationType = 'interface' | 'type';

export interface JsonToTsOptions {
  rootName: string;
  declarationType: TsDeclarationType;
  exportTypes: boolean;
  readonlyFields: boolean;
  optionalNulls: boolean;
  addComments: boolean;
}

export interface JsonToTsResult {
  code: string;
  typeCount: number;
  propertyCount: number;
  error?: string;
}

export const JSON_TS_SAMPLES: Record<string, { name: string; json: string }> = {
  userProfile: {
    name: 'User Profile & Geo Location',
    json: JSON.stringify(
      {
        id: 1042,
        uuid: 'd3b07384-d113-469b-9c7b-7b0b30be349e',
        name: 'Alex Morgan',
        username: 'alexm',
        email: 'alex.morgan@example.com',
        isActive: true,
        roles: ['admin', 'developer'],
        scores: [98, 87, 94],
        address: {
          street: '450 Innovation Blvd',
          suite: 'Suite 800',
          city: 'San Francisco',
          zipcode: '94107',
          geo: {
            lat: 37.7749,
            lng: -122.4194
          }
        },
        metadata: {
          lastLogin: '2026-11-05T09:30:00Z',
          loginCount: 142,
          notes: null
        }
      },
      null,
      2
    )
  },
  ecommerceOrder: {
    name: 'E-Commerce Order Payload',
    json: JSON.stringify(
      {
        orderId: 'ORD-2026-9981',
        customer: {
          customerId: 'CUST-881',
          name: 'Sarah Connor',
          verified: true
        },
        items: [
          {
            sku: 'MCH-001',
            title: 'Wireless Mechanical Keyboard',
            price: 129.99,
            quantity: 1,
            discount: 0.1
          },
          {
            sku: 'MCH-002',
            title: 'Desk Mat (Large)',
            price: 29.5,
            quantity: 2,
            inStock: true
          }
        ],
        shipping: {
          method: 'express',
          cost: 15.0,
          delivered: false
        },
        payment: {
          gateway: 'stripe',
          transactionId: 'txn_3Mabcd1234',
          status: 'captured'
        }
      },
      null,
      2
    )
  }
};

/**
 * Converts a raw JSON string into TypeScript interfaces or type aliases.
 */
export function convertJsonToTypeScript(
  jsonString: string,
  options: JsonToTsOptions
): JsonToTsResult {
  const trimmed = jsonString.trim();
  if (!trimmed) {
    return { code: '', typeCount: 0, propertyCount: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid JSON syntax';
    return { code: '', typeCount: 0, propertyCount: 0, error: errorMsg };
  }

  const generatedTypes: Map<string, string> = new Map();
  let totalProps = 0;

  const rootName = toPascalCase(options.rootName.trim() || 'RootObject');

  // Handle root array vs root object vs primitives
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      const typeDef = renderTypeAlias(rootName, 'any[]', options.exportTypes);
      return { code: typeDef, typeCount: 1, propertyCount: 0 };
    }

    // Inspect array elements
    const elementSchema = mergeArrayElementSchemas(parsed);
    const itemTypeName = `${rootName}Item`;
    buildTypeDefinition(itemTypeName, elementSchema, generatedTypes, options);

    const rootDef = options.declarationType === 'interface'
      ? `${options.exportTypes ? 'export ' : ''}type ${rootName} = ${itemTypeName}[];`
      : `${options.exportTypes ? 'export ' : ''}type ${rootName} = ${itemTypeName}[];`;

    generatedTypes.set(rootName, rootDef);
  } else if (typeof parsed === 'object' && parsed !== null) {
    buildTypeDefinition(rootName, parsed as Record<string, unknown>, generatedTypes, options);
  } else {
    const primType = inferPrimitiveType(parsed);
    const code = renderTypeAlias(rootName, primType, options.exportTypes);
    return { code, typeCount: 1, propertyCount: 0 };
  }

  // Count total properties across all generated types
  for (const [, body] of generatedTypes.entries()) {
    const matches = body.match(/;/g);
    if (matches) totalProps += matches.length;
  }

  // Render types with RootObject placed first or last
  const typeEntries = Array.from(generatedTypes.entries());
  // Move rootName to the top
  typeEntries.sort((a, b) => {
    if (a[0] === rootName) return -1;
    if (b[0] === rootName) return 1;
    return a[0].localeCompare(b[0]);
  });

  const finalCode = typeEntries.map(([, def]) => def).join('\n\n');

  return {
    code: finalCode,
    typeCount: generatedTypes.size,
    propertyCount: totalProps
  };
}

/**
 * Recursively creates interfaces or type aliases for an object schema.
 */
function buildTypeDefinition(
  typeName: string,
  obj: Record<string, unknown>,
  typeRegistry: Map<string, string>,
  options: JsonToTsOptions
): string {
  // Prevent duplicate recursion
  if (typeRegistry.has(typeName)) {
    return typeName;
  }

  // Placeholder to handle circular reference
  typeRegistry.set(typeName, '');

  const lines: string[] = [];
  const keys = Object.keys(obj);

  for (const rawKey of keys) {
    const val = obj[rawKey];
    const isOptional = options.optionalNulls && (val === null || val === undefined);
    const safeKey = formatKey(rawKey);
    const keyLabel = `${options.readonlyFields ? 'readonly ' : ''}${safeKey}${isOptional ? '?' : ''}`;

    let inferredType = 'any';

    if (val === null || val === undefined) {
      inferredType = 'null | any';
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        inferredType = 'any[]';
      } else {
        // Check if array of objects
        const objectElements = val.filter(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (objectElements.length > 0) {
          const childTypeName = singularizeAndPascal(rawKey);
          const merged = mergeArrayElementSchemas(val);
          buildTypeDefinition(childTypeName, merged, typeRegistry, options);
          inferredType = `${childTypeName}[]`;
        } else {
          // Array of primitives or mixed
          const typesSet = new Set<string>();
          for (const item of val) {
            typesSet.add(inferPrimitiveType(item));
          }
          const typesList = Array.from(typesSet);
          inferredType = typesList.length === 1 ? `${typesList[0]}[]` : `(${typesList.join(' | ')})[]`;
        }
      }
    } else if (typeof val === 'object') {
      const childTypeName = singularizeAndPascal(rawKey);
      buildTypeDefinition(childTypeName, val as Record<string, unknown>, typeRegistry, options);
      inferredType = childTypeName;
    } else {
      inferredType = inferPrimitiveType(val);
    }

    if (options.addComments && val !== null && typeof val !== 'object') {
      lines.push(`  /** Example: ${JSON.stringify(val)} */`);
    }

    lines.push(`  ${keyLabel}: ${inferredType};`);
  }

  let fullDef = '';
  const exportPrefix = options.exportTypes ? 'export ' : '';

  if (options.declarationType === 'interface') {
    fullDef = `${exportPrefix}interface ${typeName} {\n${lines.join('\n')}\n}`;
  } else {
    fullDef = `${exportPrefix}type ${typeName} = {\n${lines.join('\n')}\n};`;
  }

  typeRegistry.set(typeName, fullDef);
  return typeName;
}

/**
 * Merges multiple objects in an array to create a unified schema with all properties.
 */
function mergeArrayElementSchemas(arr: unknown[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const item of arr) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        if (!(k in merged) || (merged[k] === null && v !== null)) {
          merged[k] = v;
        }
      }
    }
  }
  return merged;
}

/**
 * Infers TypeScript primitive type name from a value.
 */
function inferPrimitiveType(val: unknown): string {
  if (typeof val === 'string') return 'string';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (val === null || val === undefined) return 'null';
  return 'any';
}

/**
 * Formats property key: wraps in quotes if non-standard identifier.
 */
function formatKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return `'${key.replace(/'/g, "\\'")}'`;
}

/**
 * Converts strings to PascalCase for interface names.
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Type';
}

/**
 * Turns plural property keys (e.g. "users", "items", "roles") into singular PascalCase names.
 */
function singularizeAndPascal(key: string): string {
  let singular = key;
  if (singular.endsWith('ies')) {
    singular = singular.slice(0, -3) + 'y';
  } else if (singular.endsWith('ses')) {
    singular = singular.slice(0, -2);
  } else if (singular.endsWith('s') && !singular.endsWith('ss')) {
    singular = singular.slice(0, -1);
  }
  return toPascalCase(singular);
}

function renderTypeAlias(name: string, typeVal: string, isExport: boolean): string {
  return `${isExport ? 'export ' : ''}type ${name} = ${typeVal};`;
}
