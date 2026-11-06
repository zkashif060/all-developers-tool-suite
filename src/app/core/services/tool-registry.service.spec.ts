import { TestBed } from '@angular/core/testing';
import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register exactly 23 tools', () => {
    expect(service.tools().length).toBe(23);
  });

  it('should register exactly 7 categories', () => {
    expect(service.categories().length).toBe(7);
  });

  it('should find tool by id', () => {
    const tool = service.getToolById('json-formatter');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('JSON Formatter');
    expect(tool?.route).toBe('/tools/json-formatter');
  });

  it('should search tools by keyword', () => {
    const results = service.searchTools('token');
    expect(results.some(t => t.id === 'jwt-decoder')).toBe(true);
  });

  it('should filter tools by category', () => {
    const results = service.getToolsByCategory('Encoding');
    expect(results.length).toBe(3);
    expect(results.map(t => t.id)).toEqual(['base64', 'image-base64', 'url-encoder']);
  });
});

