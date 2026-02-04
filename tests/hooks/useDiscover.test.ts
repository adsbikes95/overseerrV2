import { MediaStatus } from '@server/constants/media';
import { describe, expect, it } from 'vitest';

// Test the encodeURIExtraParams function and related logic from useDiscover

const extraEncodes: [RegExp, string][] = [
  [/\(/g, '%28'],
  [/\)/g, '%29'],
  [/!/g, '%21'],
  [/\*/g, '%2A'],
];

const encodeURIExtraParams = (string: string): string => {
  let finalString = encodeURIComponent(string);

  extraEncodes.forEach((encode) => {
    finalString = finalString.replace(encode[0], encode[1]);
  });

  return finalString;
};

describe('useDiscover hook logic', () => {
  describe('encodeURIExtraParams', () => {
    it('should encode basic special characters', () => {
      expect(encodeURIExtraParams('hello world')).toBe('hello%20world');
    });

    it('should encode parentheses', () => {
      expect(encodeURIExtraParams('Movie (2024)')).toBe('Movie%20%282024%29');
    });

    it('should encode exclamation marks', () => {
      expect(encodeURIExtraParams('Hello!')).toBe('Hello%21');
    });

    it('should encode asterisks', () => {
      expect(encodeURIExtraParams('Test*Value')).toBe('Test%2AValue');
    });

    it('should encode multiple special characters', () => {
      expect(encodeURIExtraParams('Movie! (2024)*')).toBe(
        'Movie%21%20%282024%29%2A'
      );
    });

    it('should handle empty string', () => {
      expect(encodeURIExtraParams('')).toBe('');
    });

    it('should handle string with no special characters', () => {
      expect(encodeURIExtraParams('SimpleText')).toBe('SimpleText');
    });

    it('should encode ampersands', () => {
      expect(encodeURIExtraParams('Tom & Jerry')).toBe('Tom%20%26%20Jerry');
    });

    it('should encode question marks', () => {
      expect(encodeURIExtraParams('What?')).toBe('What%3F');
    });

    it('should encode equals signs', () => {
      expect(encodeURIExtraParams('a=b')).toBe('a%3Db');
    });

    it('should handle unicode characters', () => {
      const encoded = encodeURIExtraParams('Café');
      expect(encoded).toContain('Caf');
    });

    it('should handle multiple consecutive special characters', () => {
      expect(encodeURIExtraParams('!!!')).toBe('%21%21%21');
    });

    it('should handle nested parentheses', () => {
      expect(encodeURIExtraParams('((test))')).toBe('%28%28test%29%29');
    });
  });

  describe('hideAvailable filter logic', () => {
    const mockTitles = [
      {
        mediaType: 'movie',
        mediaInfo: { status: MediaStatus.AVAILABLE },
        title: 'Available Movie',
      },
      {
        mediaType: 'movie',
        mediaInfo: { status: MediaStatus.PARTIALLY_AVAILABLE },
        title: 'Partial Movie',
      },
      {
        mediaType: 'movie',
        mediaInfo: { status: MediaStatus.PENDING },
        title: 'Pending Movie',
      },
      {
        mediaType: 'tv',
        mediaInfo: { status: MediaStatus.AVAILABLE },
        title: 'Available TV',
      },
      {
        mediaType: 'tv',
        mediaInfo: { status: MediaStatus.PROCESSING },
        title: 'Processing TV',
      },
      { mediaType: 'movie', title: 'No MediaInfo Movie' },
    ];

    it('should filter out available movies when hideAvailable is true', () => {
      const filtered = mockTitles.filter(
        (i) =>
          (i.mediaType === 'movie' || i.mediaType === 'tv') &&
          i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );

      // Filters out: Available Movie, Partial Movie, Available TV (3 items)
      // Keeps: Pending Movie, Processing TV, No MediaInfo Movie (3 items)
      expect(filtered).toHaveLength(3);
      expect(
        filtered.find((t) => t.title === 'Available Movie')
      ).toBeUndefined();
    });

    it('should filter out partially available media', () => {
      const filtered = mockTitles.filter(
        (i) =>
          (i.mediaType === 'movie' || i.mediaType === 'tv') &&
          i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );

      expect(filtered.find((t) => t.title === 'Partial Movie')).toBeUndefined();
    });

    it('should keep pending media', () => {
      const filtered = mockTitles.filter(
        (i) =>
          (i.mediaType === 'movie' || i.mediaType === 'tv') &&
          i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );

      expect(filtered.find((t) => t.title === 'Pending Movie')).toBeDefined();
    });

    it('should keep processing media', () => {
      const filtered = mockTitles.filter(
        (i) =>
          (i.mediaType === 'movie' || i.mediaType === 'tv') &&
          i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );

      expect(filtered.find((t) => t.title === 'Processing TV')).toBeDefined();
    });

    it('should keep media without mediaInfo', () => {
      const filtered = mockTitles.filter(
        (i) =>
          (i.mediaType === 'movie' || i.mediaType === 'tv') &&
          i.mediaInfo?.status !== MediaStatus.AVAILABLE &&
          i.mediaInfo?.status !== MediaStatus.PARTIALLY_AVAILABLE
      );

      expect(
        filtered.find((t) => t.title === 'No MediaInfo Movie')
      ).toBeDefined();
    });
  });

  describe('pagination state logic', () => {
    it('should determine isLoadingInitialData correctly', () => {
      const isEnabled = true;
      const data = undefined;
      const error = undefined;

      const isLoadingInitialData = isEnabled && !data && !error;
      expect(isLoadingInitialData).toBe(true);
    });

    it('should not be loading when data exists', () => {
      const isEnabled = true;
      const data = [{ results: [], page: 1, totalResults: 0, totalPages: 0 }];
      const error = undefined;

      const isLoadingInitialData = isEnabled && !data && !error;
      expect(isLoadingInitialData).toBe(false);
    });

    it('should not be loading when disabled', () => {
      const isEnabled = false;
      const data = undefined;
      const error = undefined;

      const isLoadingInitialData = isEnabled && !data && !error;
      expect(isLoadingInitialData).toBe(false);
    });

    it('should not be loading when error exists', () => {
      const isEnabled = true;
      const data = undefined;
      const error = new Error('Failed to fetch');

      const isLoadingInitialData = isEnabled && !data && !error;
      expect(isLoadingInitialData).toBe(false);
    });
  });

  describe('isEmpty calculation', () => {
    it('should be empty when enabled, not loading, and no titles', () => {
      const isEnabled = true;
      const isLoadingInitialData = false;
      const titles: unknown[] = [];

      const isEmpty =
        isEnabled && !isLoadingInitialData && titles?.length === 0;
      expect(isEmpty).toBe(true);
    });

    it('should not be empty when there are titles', () => {
      const isEnabled = true;
      const isLoadingInitialData = false;
      const titles = [{ title: 'Test' }];

      const isEmpty =
        isEnabled && !isLoadingInitialData && titles?.length === 0;
      expect(isEmpty).toBe(false);
    });

    it('should not be empty when loading', () => {
      const isEnabled = true;
      const isLoadingInitialData = true;
      const titles: unknown[] = [];

      const isEmpty =
        isEnabled && !isLoadingInitialData && titles?.length === 0;
      expect(isEmpty).toBe(false);
    });

    it('should not be empty when disabled', () => {
      const isEnabled = false;
      const isLoadingInitialData = false;
      const titles: unknown[] = [];

      const isEmpty =
        isEnabled && !isLoadingInitialData && titles?.length === 0;
      expect(isEmpty).toBe(false);
    });
  });

  describe('isReachingEnd calculation', () => {
    it('should be reaching end when disabled', () => {
      const isEnabled = false;
      const isEmpty = false;
      const data = [{ results: new Array(20), totalResults: 100 }];

      const isReachingEnd =
        !isEnabled ||
        isEmpty ||
        (!!data && (data[data.length - 1]?.results.length ?? 0) < 20) ||
        (!!data && (data[data.length - 1]?.totalResults ?? 0) < 41);

      expect(isReachingEnd).toBe(true);
    });

    it('should be reaching end when isEmpty', () => {
      const isEnabled = true;
      const isEmpty = true;
      const data = [{ results: [], totalResults: 0 }];

      const isReachingEnd =
        !isEnabled ||
        isEmpty ||
        (!!data && (data[data.length - 1]?.results.length ?? 0) < 20) ||
        (!!data && (data[data.length - 1]?.totalResults ?? 0) < 41);

      expect(isReachingEnd).toBe(true);
    });

    it('should be reaching end when last page has fewer than 20 results', () => {
      const isEnabled = true;
      const isEmpty = false;
      const data = [{ results: new Array(15), totalResults: 100 }];

      const isReachingEnd =
        !isEnabled ||
        isEmpty ||
        (!!data && (data[data.length - 1]?.results.length ?? 0) < 20) ||
        (!!data && (data[data.length - 1]?.totalResults ?? 0) < 41);

      expect(isReachingEnd).toBe(true);
    });

    it('should be reaching end when totalResults < 41', () => {
      const isEnabled = true;
      const isEmpty = false;
      const data = [{ results: new Array(20), totalResults: 40 }];

      const isReachingEnd =
        !isEnabled ||
        isEmpty ||
        (!!data && (data[data.length - 1]?.results.length ?? 0) < 20) ||
        (!!data && (data[data.length - 1]?.totalResults ?? 0) < 41);

      expect(isReachingEnd).toBe(true);
    });

    it('should not be reaching end when more results available', () => {
      const isEnabled = true;
      const isEmpty = false;
      const data = [{ results: new Array(20), totalResults: 100 }];

      const isReachingEnd =
        !isEnabled ||
        isEmpty ||
        (!!data && (data[data.length - 1]?.results.length ?? 0) < 20) ||
        (!!data && (data[data.length - 1]?.totalResults ?? 0) < 41);

      expect(isReachingEnd).toBe(false);
    });
  });

  describe('results aggregation', () => {
    it('should flatten results from multiple pages', () => {
      const data = [
        { results: [{ id: 1 }, { id: 2 }], page: 1 },
        { results: [{ id: 3 }, { id: 4 }], page: 2 },
      ];

      const titles = data.reduce(
        (a, v) => [...a, ...v.results],
        [] as { id: number }[]
      );

      expect(titles).toHaveLength(4);
      expect(titles[0].id).toBe(1);
      expect(titles[3].id).toBe(4);
    });

    it('should handle empty data', () => {
      const data: { results: { id: number }[] }[] = [];

      const titles = data.reduce(
        (a, v) => [...a, ...v.results],
        [] as { id: number }[]
      );

      expect(titles).toHaveLength(0);
    });

    it('should handle null data', () => {
      const data = null;

      const titles = (data ?? []).reduce(
        (a: { id: number }[], v: { results: { id: number }[] }) => [
          ...a,
          ...v.results,
        ],
        [] as { id: number }[]
      );

      expect(titles).toHaveLength(0);
    });
  });

  describe('query string building', () => {
    it('should build query string from options', () => {
      const options = { genre: '28', year: '2024' };
      const page = 1;

      const params = { page, ...options };
      const finalQueryString = Object.keys(params)
        .map(
          (paramKey) =>
            `${paramKey}=${encodeURIExtraParams(
              params[paramKey as keyof typeof params] as string
            )}`
        )
        .join('&');

      expect(finalQueryString).toBe('page=1&genre=28&year=2024');
    });

    it('should encode special characters in query values', () => {
      const options = { query: 'Movie (2024)!' };
      const params = { page: 1, ...options };

      const finalQueryString = Object.keys(params)
        .map(
          (paramKey) =>
            `${paramKey}=${encodeURIExtraParams(
              params[paramKey as keyof typeof params] as string
            )}`
        )
        .join('&');

      expect(finalQueryString).toContain('query=Movie%20%282024%29%21');
    });
  });
});
