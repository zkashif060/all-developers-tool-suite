import * as YAML from 'yaml';

export type ConversionDirection = 'yaml-to-json' | 'json-to-yaml';
export type ConverterIndent = '2-spaces' | '4-spaces';

export interface YamlJsonOptions {
  direction: ConversionDirection;
  indent: ConverterIndent;
  minifyJson?: boolean;
  sortKeys?: boolean;
}

export interface YamlJsonResult {
  output: string;
  originalSize: number;
  outputSize: number;
  lineCount: number;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export const YAML_SAMPLES = {
  dockerCompose: {
    name: 'Docker Compose (Services & Volumes)',
    yaml: `version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:secret@db:5432/app
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  pgdata:
    driver: local`
  },
  k8sDeployment: {
    name: 'Kubernetes Pod & Deployment',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: zerotrace-web
  labels:
    app.kubernetes.io/name: zerotrace-web
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zerotrace-web
  template:
    metadata:
      labels:
        app: zerotrace-web
    spec:
      containers:
        - name: web
          image: zerotrace/web:v1.2.0
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: 500m
              memory: 256Mi
            requests:
              cpu: 100m
              memory: 128Mi`
  }
};

/**
 * Converts YAML string to JSON string.
 */
export function convertYamlToJson(
  yamlStr: string,
  indent: ConverterIndent = '2-spaces',
  minify = false
): YamlJsonResult {
  const trimmed = yamlStr.trim();
  if (!trimmed) {
    return { output: '', originalSize: 0, outputSize: 0, lineCount: 0 };
  }

  try {
    const parsed = YAML.parse(trimmed);
    const spaceCount = indent === '4-spaces' ? 4 : 2;
    const output = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, spaceCount);

    return {
      output,
      originalSize: new TextEncoder().encode(trimmed).length,
      outputSize: new TextEncoder().encode(output).length,
      lineCount: output.split('\n').length
    };
  } catch (err: unknown) {
    return extractYamlError(err, trimmed);
  }
}

/**
 * Converts JSON string to YAML string.
 */
export function convertJsonToYaml(
  jsonStr: string,
  indent: ConverterIndent = '2-spaces',
  sortKeys = false
): YamlJsonResult {
  const trimmed = jsonStr.trim();
  if (!trimmed) {
    return { output: '', originalSize: 0, outputSize: 0, lineCount: 0 };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const indentWidth = indent === '4-spaces' ? 4 : 2;
    const output = YAML.stringify(parsed, {
      indent: indentWidth,
      sortMapEntries: sortKeys
    });

    return {
      output,
      originalSize: new TextEncoder().encode(trimmed).length,
      outputSize: new TextEncoder().encode(output).length,
      lineCount: output.split('\n').length
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      output: '',
      originalSize: new TextEncoder().encode(trimmed).length,
      outputSize: 0,
      lineCount: 0,
      error: `JSON Parse Error: ${errorMsg}`
    };
  }
}

function extractYamlError(err: unknown, originalText: string): YamlJsonResult {
  let errorMsg = 'Unknown YAML parsing error';
  let errorLine: number | undefined;
  let errorColumn: number | undefined;

  if (err instanceof Error) {
    errorMsg = err.message;
    // Inspect YAML error line positions
    if ('linePos' in (err as { linePos?: { line: number; col: number }[] })) {
      const pos = (err as { linePos?: { line: number; col: number }[] }).linePos;
      if (pos && pos.length > 0) {
        errorLine = pos[0].line;
        errorColumn = pos[0].col;
      }
    }
  }

  return {
    output: '',
    originalSize: new TextEncoder().encode(originalText).length,
    outputSize: 0,
    lineCount: 0,
    error: errorMsg,
    errorLine,
    errorColumn
  };
}

