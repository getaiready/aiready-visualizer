import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractJson, withRetry } from '../workflows/remediation-swarm';

describe('extractJson', () => {
  it('should extract valid JSON from plain text', () => {
    const text = 'Here is the result: {"status":"success","diff":"some diff"}';
    const result = extractJson(text);
    expect(result).toEqual({ status: 'success', diff: 'some diff' });
  });

  it('should extract JSON from a markdown code block', () => {
    const text = [
      '```json',
      '{"status":"success","prUrl":"https://github.com/test/pull/1"}',
      '```',
    ].join('\n');
    const result = extractJson(text);
    expect(result).toEqual({
      status: 'success',
      prUrl: 'https://github.com/test/pull/1',
    });
  });

  it('should extract JSON from a plain code block (no language tag)', () => {
    const text = ['```', '{"ok":true}', '```'].join('\n');
    const result = extractJson(text);
    expect(result).toEqual({ ok: true });
  });

  it('should handle nested objects', () => {
    const text = '{"outer":{"inner":"value","nested":{"a":1}}}';
    const result = extractJson(text);
    expect(result).toEqual({
      outer: { inner: 'value', nested: { a: 1 } },
    });
  });

  it('should handle JSON with arrays', () => {
    const text = '{"files":["a.ts","b.ts"],"count":2}';
    const result = extractJson(text);
    expect(result).toEqual({ files: ['a.ts', 'b.ts'], count: 2 });
  });

  it('should return null for text with no JSON', () => {
    const result = extractJson('No JSON here, just plain text.');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractJson('')).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const result = extractJson('{"broken": "missing brace"');
    expect(result).toBeNull();
  });

  it('should ignore braces inside strings', () => {
    const text = '{"msg":"hello {world} inside string","ok":true}';
    const result = extractJson(text);
    expect(result).toEqual({
      msg: 'hello {world} inside string',
      ok: true,
    });
  });

  it('should extract the first complete JSON object when multiple exist', () => {
    const text = 'First: {"a":1} Second: {"b":2}';
    const result = extractJson(text);
    expect(result).toEqual({ a: 1 });
  });

  it('should handle JSON with escaped quotes', () => {
    const text = '{"name":"say \\"hello\\"","val":42}';
    const result = extractJson(text);
    expect(result).toEqual({ name: 'say "hello"', val: 42 });
  });

  it('should handle deeply nested braces', () => {
    const text = 'prefix {"a":{"b":{"c":{"d":1}}}} suffix';
    const result = extractJson(text);
    expect(result).toEqual({ a: { b: { c: { d: 1 } } } });
  });
});

describe('withRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 'test');
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 'test');
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  }, 15000);

  it('should retry on third attempt after two failures', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('third time lucky');

    const result = await withRetry(fn, 3, 'test');
    expect(result).toBe('third time lucky');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 15000);

  it('should throw after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, 3, 'test')).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 15000);

  it('should handle non-Error thrown values', async () => {
    const fn = vi.fn().mockRejectedValue('string error');

    await expect(withRetry(fn, 2, 'test')).rejects.toThrow('string error');
    expect(fn).toHaveBeenCalledTimes(2);
  }, 15000);

  it('should use default maxRetries of 3', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(withRetry(fn)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3);
  }, 15000);

  it('should not delay after the final failed attempt', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const start = Date.now();
    await expect(withRetry(fn, 2, 'test')).rejects.toThrow('fail');
    const elapsed = Date.now() - start;

    expect(fn).toHaveBeenCalledTimes(2);
    // With 2 retries, there's 1 delay of 2^1*1000 = 2000ms
    // Allow some tolerance
    expect(elapsed).toBeLessThan(5000);
  }, 15000);
});
