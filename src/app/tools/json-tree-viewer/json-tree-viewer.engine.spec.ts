import { describe, it, expect } from 'vitest';
import {
  parseAndBuildTree,
  filterTree,
  setTreeExpansion,
  getJsonNodeType,
  JSON_TREE_SAMPLES
} from './json-tree-viewer.engine';

describe('JsonTreeViewerEngine', () => {
  it('should return null root for blank input', () => {
    const res = parseAndBuildTree('');
    expect(res.root).toBeNull();
    expect(res.totalNodes).toBe(0);
  });

  it('should report syntax error for invalid JSON', () => {
    const res = parseAndBuildTree('{ invalid: json');
    expect(res.root).toBeNull();
    expect(res.error).toBeDefined();
  });

  it('should build hierarchical tree for basic object with accurate types', () => {
    const json = JSON.stringify({
      name: 'ZeroTrace',
      version: 1,
      active: true,
      tags: ['tool', 'privacy'],
      meta: null
    });
    const res = parseAndBuildTree(json, 2);
    expect(res.root).not.toBeNull();
    expect(res.root?.type).toBe('object');
    expect(res.root?.childCount).toBe(5);

    const children = res.root?.children || [];
    const nameNode = children.find(c => c.key === 'name');
    expect(nameNode?.type).toBe('string');
    expect(nameNode?.path).toBe('$.name');
    expect(nameNode?.preview).toBe('"ZeroTrace"');

    const tagsNode = children.find(c => c.key === 'tags');
    expect(tagsNode?.type).toBe('array');
    expect(tagsNode?.path).toBe('$.tags');
    expect(tagsNode?.childCount).toBe(2);
    expect(tagsNode?.children?.[0].path).toBe('$.tags[0]');
  });

  it('should calculate accurate paths for nested objects and array indices', () => {
    const json = JSON.stringify({
      users: [
        {
          id: 42,
          profile: {
            city: 'Berlin'
          }
        }
      ]
    });
    const res = parseAndBuildTree(json, 4);
    const usersArr = res.root?.children?.[0];
    const firstUser = usersArr?.children?.[0];
    const profileObj = firstUser?.children?.find(c => c.key === 'profile');
    const cityNode = profileObj?.children?.find(c => c.key === 'city');

    expect(cityNode?.path).toBe('$.users[0].profile.city');
    expect(cityNode?.value).toBe('Berlin');
  });

  it('should filter tree nodes by key or value and auto-expand matching ancestors', () => {
    const json = JSON.stringify({
      app: 'ZeroTrace',
      database: {
        host: 'localhost',
        port: 5432
      }
    });
    const res = parseAndBuildTree(json, 1);
    expect(res.root).not.toBeNull();

    // Database is collapsed initially
    const dbNode = res.root?.children?.find(c => c.key === 'database');
    expect(dbNode?.isExpanded).toBe(false);

    // Search for "localhost"
    const filterRes = filterTree(res.root!, 'localhost');
    expect(filterRes.matchesCount).toBe(1);

    // Ancestor node database should now be auto-expanded
    expect(dbNode?.hasMatchingDescendant).toBe(true);
    expect(dbNode?.isExpanded).toBe(true);
  });

  it('should expand and collapse all nodes properly', () => {
    const json = JSON_TREE_SAMPLES['githubRepo'].json;
    const res = parseAndBuildTree(json, 1);
    expect(res.root).not.toBeNull();

    setTreeExpansion(res.root!, true);
    const ownerNode = res.root?.children?.find(c => c.key === 'owner');
    expect(ownerNode?.isExpanded).toBe(true);

    setTreeExpansion(res.root!, false);
    expect(res.root?.isExpanded).toBe(false);
    expect(ownerNode?.isExpanded).toBe(false);
  });

  it('should detect all node types properly', () => {
    expect(getJsonNodeType('text')).toBe('string');
    expect(getJsonNodeType(123)).toBe('number');
    expect(getJsonNodeType(true)).toBe('boolean');
    expect(getJsonNodeType(null)).toBe('null');
    expect(getJsonNodeType([])).toBe('array');
    expect(getJsonNodeType({})).toBe('object');
  });
});
