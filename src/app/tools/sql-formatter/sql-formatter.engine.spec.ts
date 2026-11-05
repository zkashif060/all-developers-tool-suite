import { describe, it, expect } from 'vitest';
import {
  formatSql,
  minifySql,
  SqlFormatOptions,
  SQL_SAMPLES
} from './sql-formatter.engine';

describe('SqlFormatterEngine', () => {
  const defaultOptions: SqlFormatOptions = {
    dialect: 'sql',
    keywordCase: 'upper',
    dataTypeCase: 'upper',
    functionCase: 'upper',
    indent: '2-spaces',
    linesBetweenQueries: 1
  };

  it('should return empty result for blank input', () => {
    const res = formatSql('', defaultOptions);
    expect(res.formatted).toBe('');
    expect(res.originalSize).toBe(0);
  });

  it('should format simple SELECT query with uppercase keywords', () => {
    const query = 'select id, name, email from users where active = 1 order by id desc';
    const res = formatSql(query, defaultOptions);
    expect(res.formatted).toContain('SELECT');
    expect(res.formatted).toContain('FROM');
    expect(res.formatted).toContain('WHERE');
    expect(res.formatted).toContain('ORDER BY');
    expect(res.error).toBeUndefined();
  });

  it('should respect lowercase keywordCase option', () => {
    const query = 'SELECT ID, NAME FROM USERS WHERE ACTIVE = 1';
    const res = formatSql(query, {
      ...defaultOptions,
      keywordCase: 'lower'
    });
    expect(res.formatted).toContain('select');
    expect(res.formatted).toContain('from');
    expect(res.formatted).toContain('where');
  });

  it('should support PostgreSQL dialect and syntax', () => {
    const query = `select id, config->>'theme' as theme from users where created_at > now() - interval '1 day';`;
    const res = formatSql(query, {
      ...defaultOptions,
      dialect: 'postgresql'
    });
    expect(res.formatted).toContain('SELECT');
    expect(res.error).toBeUndefined();
  });

  it('should support MySQL dialect with backticks and LIMIT', () => {
    const query = 'select `user_id`, `name` from `customers` limit 10 offset 20;';
    const res = formatSql(query, {
      ...defaultOptions,
      dialect: 'mysql'
    });
    expect(res.formatted).toContain('LIMIT');
    expect(res.error).toBeUndefined();
  });

  it('should support SQL Server (T-SQL) with brackets and TOP', () => {
    const query = 'select top 10 [id], [username] from [dbo].[Accounts];';
    const res = formatSql(query, {
      ...defaultOptions,
      dialect: 'transactsql'
    });
    expect(res.formatted).toContain('SELECT');
    expect(res.error).toBeUndefined();
  });

  it('should format complex sample join query cleanly', () => {
    const sample = SQL_SAMPLES['complexJoin'].query;
    const res = formatSql(sample, defaultOptions);
    expect(res.formatted).toContain('INNER JOIN');
    expect(res.formatted).toContain('LEFT JOIN');
    expect(res.formatted).toContain('GROUP BY');
    expect(res.formatted).toContain('HAVING');
  });

  describe('minifySql', () => {
    it('should strip comments and reduce spaces', () => {
      const sqlWithComments = `
        -- Fetch active administrators
        SELECT
          id, /* primary key */
          email
        FROM users
        WHERE is_admin = 1;
      `;
      const min = minifySql(sqlWithComments);
      expect(min).not.toContain('-- Fetch');
      expect(min).not.toContain('/* primary key */');
      expect(min).toContain('SELECT id, email FROM users WHERE is_admin = 1;');
    });

    it('should preserve string literals containing comment tokens and spaces', () => {
      const sqlWithString = "SELECT * FROM logs WHERE message = 'Error: -- not a comment /* still string */';";
      const min = minifySql(sqlWithString);
      expect(min).toContain("'Error: -- not a comment /* still string */'");
    });
  });
});

