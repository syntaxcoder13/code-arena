import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGES,
  isMarkupLanguage,
  pickTargetLanguages,
  rankTechStack,
} from '../../src/common/utils/languages.util';
import { interleaveUnique, normalizePaging } from '../../src/common/utils/collections.util';
import { CryptoUtil } from '../../src/common/utils/crypto.util';
import { errorMessage } from '../../src/common/utils/errors.util';

describe('rankTechStack', () => {
  it('ranks code languages by weight, with forks counting half', () => {
    const { technologies } = rankTechStack([
      { language: 'Go' },
      { language: 'Rust', fork: true },
      { language: 'Rust', fork: true },
      { language: 'Rust', fork: true },
      { language: 'TypeScript' },
      { language: 'TypeScript' },
    ]);
    expect(technologies).toEqual(['TypeScript', 'Rust', 'Go']);
  });

  it('always puts markup/styling languages after real code', () => {
    const { technologies } = rankTechStack([
      { language: 'HTML' },
      { language: 'HTML' },
      { language: 'HTML' },
      { language: 'CSS' },
      { language: 'Python' },
    ]);
    expect(technologies).toEqual(['Python', 'HTML', 'CSS']);
  });

  it('ignores empty, null and placeholder languages', () => {
    const { technologies } = rankTechStack([
      { language: null },
      { language: '' },
      { language: 'Unknown' },
      { language: 'null' },
      { language: '  Kotlin ' },
    ]);
    expect(technologies).toEqual(['Kotlin']);
  });

  it('lower-cases and ranks topics, respecting limits', () => {
    const result = rankTechStack(
      [
        { topics: ['CLI', 'web'] },
        { topics: ['cli', ' '] },
        { language: 'A' },
        { language: 'B' },
        { language: 'C' },
      ],
      { maxLanguages: 2, maxTopics: 1 },
    );
    expect(result.topics).toEqual(['cli']);
    expect(result.technologies).toHaveLength(2);
  });
});

describe('isMarkupLanguage / pickTargetLanguages', () => {
  it('recognises markup regardless of case and whitespace', () => {
    expect(isMarkupLanguage(' SCSS ')).toBe(true);
    expect(isMarkupLanguage('TeX')).toBe(true);
    expect(isMarkupLanguage('Go')).toBe(false);
  });

  it('prefers code languages, then any language, then defaults', () => {
    expect(pickTargetLanguages(['HTML', 'Go', 'CSS', 'Rust'], 3)).toEqual(['Go', 'Rust']);
    expect(pickTargetLanguages(['HTML', 'CSS'], 3)).toEqual(['HTML', 'CSS']);
    expect(pickTargetLanguages([], 2)).toEqual(DEFAULT_LANGUAGES.slice(0, 2));
    expect(pickTargetLanguages(['', '  '], 1)).toEqual([DEFAULT_LANGUAGES[0]]);
  });
});

describe('interleaveUnique', () => {
  it('merges round-robin and drops duplicates by key', () => {
    const merged = interleaveUnique(
      [
        ['a1', 'a2', 'shared'],
        ['b1', 'shared'],
        [],
      ],
      (x) => x,
    );
    expect(merged).toEqual(['a1', 'b1', 'a2', 'shared']);
  });

  it('handles no lists', () => {
    expect(interleaveUnique<string>([], (x) => x)).toEqual([]);
  });
});

describe('normalizePaging', () => {
  it('clamps page and limit and computes skip', () => {
    expect(normalizePaging(3, 10)).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(normalizePaging(undefined, undefined)).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(normalizePaging(-5, 999)).toEqual({ page: 1, limit: 50, skip: 0 });
    expect(normalizePaging(Number.NaN, 0, { defaultLimit: 5 })).toEqual({ page: 1, limit: 5, skip: 0 });
  });
});

describe('CryptoUtil', () => {
  it('round-trips with a random IV each time', () => {
    const a = CryptoUtil.encrypt('gho_secret_token');
    const b = CryptoUtil.encrypt('gho_secret_token');
    expect(a).not.toEqual(b);
    expect(a.split(':')).toHaveLength(3);
    expect(CryptoUtil.decrypt(a)).toBe('gho_secret_token');
  });

  it('returns legacy plaintext values unchanged', () => {
    expect(CryptoUtil.decrypt('gho_plain_legacy')).toBe('gho_plain_legacy');
  });

  it('returns empty string for tampered ciphertext or the wrong key', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const [iv, tag, data] = CryptoUtil.encrypt('value').split(':');
    const flipped = (data[0] === 'a' ? 'b' : 'a') + data.slice(1);
    expect(CryptoUtil.decrypt(`${iv}:${tag}:${flipped}`)).toBe('');
    expect(CryptoUtil.decrypt(CryptoUtil.encrypt('value', 'key-one'), 'key-two')).toBe('');
  });

  it('handles empty input', () => {
    expect(CryptoUtil.encrypt('')).toBe('');
    expect(CryptoUtil.decrypt('')).toBe('');
  });
});

describe('errorMessage', () => {
  it('extracts messages from any thrown value', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
    expect(errorMessage(42)).toBe('42');
  });
});
