export type JsonNodeType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface JsonTreeNode {
  id: string;
  key: string;
  path: string;
  type: JsonNodeType;
  value: unknown;
  preview: string;
  childCount: number;
  depth: number;
  children?: JsonTreeNode[];
  isExpanded: boolean;
  matchesFilter: boolean;
  hasMatchingDescendant: boolean;
}

export interface TreeBuildResult {
  root: JsonTreeNode | null;
  totalNodes: number;
  maxTreeDepth: number;
  error?: string;
}

export const JSON_TREE_SAMPLES: Record<string, { name: string; json: string }> = {
  githubRepo: {
    name: 'GitHub Repository & Permissions',
    json: JSON.stringify(
      {
        id: 7291823,
        name: 'zerotrace-tools',
        full_name: 'zerotrace/zerotrace-tools',
        private: false,
        owner: {
          login: 'zerotrace',
          id: 19842,
          avatar_url: 'https://avatars.githubusercontent.com/u/19842?v=4',
          type: 'Organization',
          site_admin: false
        },
        description: '100% In-Browser Privacy-First Developer Tools Suite',
        fork: false,
        topics: ['developer-tools', 'privacy', 'angular', 'standalone', 'offline-first'],
        visibility: 'public',
        forks_count: 42,
        stargazers_count: 1280,
        watchers_count: 1280,
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
          url: 'https://api.github.com/licenses/mit'
        },
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true
        },
        settings: {
          has_issues: true,
          has_projects: false,
          has_wiki: false,
          allow_squash_merge: true,
          delete_branch_on_merge: true
        }
      },
      null,
      2
    )
  },
  ecommerceCatalog: {
    name: 'Product Catalog with Variants',
    json: JSON.stringify(
      {
        catalogId: 'CAT-2026-X1',
        title: 'Precision Mechanical Hardware',
        currency: 'USD',
        categories: [
          {
            id: 'cat-kb',
            name: 'Keyboards',
            products: [
              {
                sku: 'KB-PRO-98',
                model: 'HyperTactile 98-Key',
                price: 189.99,
                inStock: true,
                rating: 4.85,
                specs: {
                  switchType: 'Optical Tactile (Brown)',
                  actuationForceGrams: 55,
                  wireless: true,
                  batteryMah: 4000,
                  keycaps: 'Double-Shot PBT'
                },
                variants: [
                  { color: 'Cyber Slate', hex: '#1E293B', stockQty: 24 },
                  { color: 'Pure Chalk', hex: '#F8FAFC', stockQty: 18 }
                ]
              }
            ]
          }
        ]
      },
      null,
      2
    )
  }
};

let nodeIdCounter = 0;

/**
 * Builds a hierarchical tree representation of parsed JSON with path extraction and depths.
 */
export function buildJsonTree(
  data: unknown,
  key = 'root',
  path = '$',
  depth = 0,
  defaultExpandDepth = 2
): JsonTreeNode {
  const id = `node-${++nodeIdCounter}`;
  const type = getJsonNodeType(data);
  const isExpanded = depth < defaultExpandDepth;

  if (type === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    const children: JsonTreeNode[] = [];

    for (const k of keys) {
      const childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
        ? `${path}.${k}`
        : `${path}['${k.replace(/'/g, "\\'")}']`;
      children.push(buildJsonTree(obj[k], k, childPath, depth + 1, defaultExpandDepth));
    }

    return {
      id,
      key,
      path,
      type,
      value: obj,
      preview: `{ ${keys.length} ${keys.length === 1 ? 'key' : 'keys'} }`,
      childCount: keys.length,
      depth,
      children,
      isExpanded,
      matchesFilter: false,
      hasMatchingDescendant: false
    };
  }

  if (type === 'array') {
    const arr = data as unknown[];
    const children: JsonTreeNode[] = [];

    for (let i = 0; i < arr.length; i++) {
      const childPath = `${path}[${i}]`;
      children.push(buildJsonTree(arr[i], String(i), childPath, depth + 1, defaultExpandDepth));
    }

    return {
      id,
      key,
      path,
      type,
      value: arr,
      preview: `[ ${arr.length} ${arr.length === 1 ? 'item' : 'items'} ]`,
      childCount: arr.length,
      depth,
      children,
      isExpanded,
      matchesFilter: false,
      hasMatchingDescendant: false
    };
  }

  // Primitive leaf node
  return {
    id,
    key,
    path,
    type,
    value: data,
    preview: formatPrimitivePreview(data, type),
    childCount: 0,
    depth,
    isExpanded: false,
    matchesFilter: false,
    hasMatchingDescendant: false
  };
}

/**
 * Parses a raw JSON string and generates the complete tree model and metrics.
 */
export function parseAndBuildTree(
  rawJson: string,
  defaultExpandDepth = 2
): TreeBuildResult {
  const trimmed = rawJson.trim();
  if (!trimmed) {
    return { root: null, totalNodes: 0, maxTreeDepth: 0 };
  }

  nodeIdCounter = 0;

  try {
    const parsed = JSON.parse(trimmed);
    const root = buildJsonTree(parsed, 'root', '$', 0, defaultExpandDepth);

    let totalNodes = 0;
    let maxTreeDepth = 0;

    function traverse(node: JsonTreeNode) {
      totalNodes++;
      if (node.depth > maxTreeDepth) {
        maxTreeDepth = node.depth;
      }
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }

    traverse(root);

    return {
      root,
      totalNodes,
      maxTreeDepth
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON format';
    return {
      root: null,
      totalNodes: 0,
      maxTreeDepth: 0,
      error: msg
    };
  }
}

/**
 * Searches the tree recursively and marks matching nodes and ancestor paths.
 */
export function filterTree(
  node: JsonTreeNode,
  query: string
): { matchesCount: number } {
  const clean = query.trim().toLowerCase();
  let matchesCount = 0;

  function evaluate(n: JsonTreeNode): boolean {
    if (!clean) {
      n.matchesFilter = false;
      n.hasMatchingDescendant = false;
      if (n.children) {
        for (const child of n.children) {
          evaluate(child);
        }
      }
      return false;
    }

    const keyMatches = n.key.toLowerCase().includes(clean);
    const valueMatches = n.type !== 'object' && n.type !== 'array'
      ? String(n.value).toLowerCase().includes(clean)
      : false;
    const pathMatches = n.path.toLowerCase().includes(clean);

    const isMatch = keyMatches || valueMatches || pathMatches;
    n.matchesFilter = isMatch;

    if (isMatch) {
      matchesCount++;
    }

    let descendantMatch = false;
    if (n.children) {
      for (const child of n.children) {
        const childMatched = evaluate(child);
        if (childMatched) {
          descendantMatch = true;
        }
      }
    }

    n.hasMatchingDescendant = descendantMatch;

    // Automatically expand ancestor if child matched
    if (descendantMatch) {
      n.isExpanded = true;
    }

    return isMatch || descendantMatch;
  }

  evaluate(node);
  return { matchesCount };
}

/**
 * Sets expansion state across all nodes or up to a specific depth.
 */
export function setTreeExpansion(
  node: JsonTreeNode,
  expand: boolean,
  targetDepth?: number
): void {
  function apply(n: JsonTreeNode) {
    if (n.type === 'object' || n.type === 'array') {
      if (targetDepth !== undefined) {
        n.isExpanded = n.depth < targetDepth;
      } else {
        n.isExpanded = expand;
      }
      if (n.children) {
        for (const child of n.children) {
          apply(child);
        }
      }
    }
  }

  apply(node);
}

/**
 * Identifies the exact type of a JSON node.
 */
export function getJsonNodeType(val: unknown): JsonNodeType {
  if (val === null || val === undefined) return 'null';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'object') return 'object';
  return 'string';
}

/**
 * Formats primitive leaf value representation with quotes for strings.
 */
function formatPrimitivePreview(val: unknown, type: JsonNodeType): string {
  if (type === 'null') return 'null';
  if (type === 'string') return `"${val}"`;
  if (type === 'boolean') return String(val);
  if (type === 'number') return String(val);
  return String(val);
}

