import { format, SqlLanguage } from 'sql-formatter';

export type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'transactsql' | 'sqlite' | 'bigquery' | 'plsql';
export type KeywordCase = 'upper' | 'lower' | 'preserve';
export type SqlIndent = '2-spaces' | '4-spaces' | 'tabs';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  keywordCase: KeywordCase;
  dataTypeCase: KeywordCase;
  functionCase: KeywordCase;
  indent: SqlIndent;
  linesBetweenQueries: number;
}

export interface SqlFormatResult {
  formatted: string;
  originalSize: number;
  formattedSize: number;
  queryCount: number;
  error?: string;
}

export const SQL_DIALECT_LABELS: Record<SqlDialect, string> = {
  sql: 'Standard SQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL / MariaDB',
  transactsql: 'SQL Server (T-SQL)',
  sqlite: 'SQLite',
  bigquery: 'Google BigQuery',
  plsql: 'Oracle PL/SQL'
};

export const SQL_SAMPLES: Record<string, { name: string; query: string }> = {
  complexJoin: {
    name: 'Multi-table JOIN with Aggregation',
    query: `select u.id as user_id, u.email, count(o.id) as total_orders, sum(o.total_amount) as total_revenue, avg(o.total_amount) as avg_order_val, max(o.created_at) as last_order_date from users u inner join orders o on u.id = o.user_id left join order_items oi on o.id = oi.order_id where u.status = 'active' and o.created_at >= '2026-01-01' group by u.id, u.email having count(o.id) > 5 order by total_revenue desc limit 100;`
  },
  cteWindow: {
    name: 'CTE & Window Functions',
    query: `with monthly_sales as (select employee_id, department_id, date_trunc('month', sale_date) as sales_month, sum(amount) as monthly_total from sales group by 1, 2, 3), ranked_sales as (select employee_id, department_id, sales_month, monthly_total, dense_rank() over (partition by department_id, sales_month order by monthly_total desc) as rank_in_dept from monthly_sales) select department_id, sales_month, employee_id, monthly_total from ranked_sales where rank_in_dept <= 3 order by department_id, sales_month, rank_in_dept;`
  },
  ddlTable: {
    name: 'Table Schema (CREATE TABLE & Constraints)',
    query: `create table if not exists developer_workspaces (id uuid primary key default gen_random_uuid(), tenant_id varchar(64) not null, name varchar(255) not null, config jsonb not null default '{}'::jsonb, is_active boolean default true, created_at timestamp with time zone default current_timestamp, updated_at timestamp with time zone default current_timestamp, constraint fk_workspace_tenant foreign key (tenant_id) references tenants(id) on delete cascade); create index if not exists idx_workspace_tenant on developer_workspaces(tenant_id);`
  }
};

/**
 * Formats an SQL query string according to the given options and dialect.
 */
export function formatSql(query: string, options: SqlFormatOptions): SqlFormatResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      formatted: '',
      originalSize: 0,
      formattedSize: 0,
      queryCount: 0
    };
  }

  const tabWidth = options.indent === '4-spaces' ? 4 : 2;
  const useTabs = options.indent === 'tabs';

  try {
    const formatted = format(trimmed, {
      language: options.dialect as SqlLanguage,
      tabWidth,
      useTabs,
      keywordCase: options.keywordCase,
      dataTypeCase: options.dataTypeCase,
      functionCase: options.functionCase,
      linesBetweenQueries: options.linesBetweenQueries
    });

    // Approximate query statement count
    const statements = trimmed
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return {
      formatted,
      originalSize: new TextEncoder().encode(trimmed).length,
      formattedSize: new TextEncoder().encode(formatted).length,
      queryCount: Math.max(1, statements.length)
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      formatted: trimmed,
      originalSize: new TextEncoder().encode(trimmed).length,
      formattedSize: new TextEncoder().encode(trimmed).length,
      queryCount: 1,
      error: errorMsg
    };
  }
}

/**
 * Minifies SQL by removing comments and collapsing redundant whitespace while preserving strings.
 */
export function minifySql(sql: string): string {
  if (!sql.trim()) return '';

  const stringLiterals: string[] = [];
  let tokenized = '';
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];

    // Single-line comment: -- until newline
    if (ch === '-' && i + 1 < len && sql[i + 1] === '-') {
      i += 2;
      while (i < len && sql[i] !== '\n' && sql[i] !== '\r') {
        i++;
      }
      continue;
    }

    // Multi-line comment: /* ... */
    if (ch === '/' && i + 1 < len && sql[i + 1] === '*') {
      i += 2;
      while (i + 1 < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // String literal: '...' or "..."
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let lit = quote;
      i++;
      while (i < len) {
        const c = sql[i];
        lit += c;
        if (c === quote) {
          if (i + 1 < len && sql[i + 1] === quote) {
            i++;
            lit += quote;
          } else {
            i++;
            break;
          }
        }
        i++;
      }
      const marker = `__SQL_STR_${stringLiterals.length}__`;
      stringLiterals.push(lit);
      tokenized += marker;
      continue;
    }

    // Whitespace collapse
    if (/\s/.test(ch)) {
      if (tokenized.length > 0 && !/\s$/.test(tokenized)) {
        tokenized += ' ';
      }
      i++;
      continue;
    }

    tokenized += ch;
    i++;
  }

  // Remove unnecessary spaces around operators and punctuation outside string literals
  let cleaned = tokenized
    .replace(/\s*([,;()=<>+*])\s*/g, (match, p1) => {
      if (p1 === ',' || p1 === ';') return `${p1} `;
      if (p1 === '(' || p1 === ')') return p1;
      return ` ${p1} `;
    })
    .replace(/\s+/g, ' ')
    .trim();

  // Restore string literals verbatim
  for (let idx = 0; idx < stringLiterals.length; idx++) {
    cleaned = cleaned.replace(`__SQL_STR_${idx}__`, stringLiterals[idx]);
  }

  return cleaned;
}
