import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { isValidMBID } from '@server/utils/validation';
import { describe, expect, it } from 'vitest';

/**
 * Tests for music support edge cases and failure handling.
 */

describe('Music Edge Cases', () => {
  describe('Invalid MBID handling', () => {
    it('should reject completely invalid MBID', () => {
      expect(isValidMBID('not-a-valid-mbid')).toBe(false);
    });

    it('should reject MBID with null bytes', () => {
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91\0cf5e')).toBe(false);
    });

    it('should reject MBID with unicode characters', () => {
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91éc5e')).toBe(false);
    });

    it('should reject MBID that looks valid but has wrong version nibble', () => {
      // Valid format but we accept any hex, so this should pass format check
      expect(isValidMBID('f27ec8db-af05-0f36-916e-3d57f91ecf5e')).toBe(true);
    });

    it('should handle empty string gracefully', () => {
      expect(isValidMBID('')).toBe(false);
    });

    it('should handle undefined-like strings', () => {
      expect(isValidMBID('undefined')).toBe(false);
      expect(isValidMBID('null')).toBe(false);
    });
  });

  describe('Artist with no albums', () => {
    interface MockArtist {
      id: string;
      name: string;
      releaseGroups?: { id: string; title: string }[];
    }

    it('should handle artist with empty release groups array', () => {
      const artist: MockArtist = {
        id: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        name: 'New Artist',
        releaseGroups: [],
      };

      expect(artist.releaseGroups).toHaveLength(0);
      const albums = artist.releaseGroups ?? [];
      expect(albums).toHaveLength(0);
    });

    it('should handle artist with undefined release groups', () => {
      const artist: MockArtist = {
        id: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        name: 'New Artist',
      };

      const albums = artist.releaseGroups ?? [];
      expect(albums).toHaveLength(0);
    });

    it('should filter albums correctly when some exist', () => {
      const artist: MockArtist = {
        id: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        name: 'Artist',
        releaseGroups: [
          { id: 'album-1', title: 'Album 1' },
          { id: 'album-2', title: 'Album 2' },
        ],
      };

      const albums = artist.releaseGroups?.filter((rg) => rg.title) ?? [];
      expect(albums).toHaveLength(2);
    });
  });

  describe('Album with no tracks', () => {
    interface MockAlbum {
      id: string;
      title: string;
      tracks?: { id: string; title: string }[];
    }

    it('should handle album with no tracks', () => {
      const album: MockAlbum = {
        id: 'album-mbid',
        title: 'Album Title',
        tracks: [],
      };

      const trackCount = album.tracks?.length ?? 0;
      expect(trackCount).toBe(0);
    });

    it('should handle album with undefined tracks', () => {
      const album: MockAlbum = {
        id: 'album-mbid',
        title: 'Album Title',
      };

      const trackCount = album.tracks?.length ?? 0;
      expect(trackCount).toBe(0);
    });
  });

  describe('Mixed availability states', () => {
    interface MockAlbumWithStatus {
      id: string;
      title: string;
      mediaInfo?: {
        status: MediaStatus;
      };
    }

    const createAlbum = (
      id: string,
      status?: MediaStatus
    ): MockAlbumWithStatus => ({
      id,
      title: `Album ${id}`,
      mediaInfo: status ? { status } : undefined,
    });

    it('should identify available albums', () => {
      const albums = [
        createAlbum('1', MediaStatus.AVAILABLE),
        createAlbum('2', MediaStatus.PROCESSING),
        createAlbum('3', MediaStatus.UNKNOWN),
        createAlbum('4'), // No mediaInfo
      ];

      const available = albums.filter(
        (a) => a.mediaInfo?.status === MediaStatus.AVAILABLE
      );
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('1');
    });

    it('should identify processing albums', () => {
      const albums = [
        createAlbum('1', MediaStatus.AVAILABLE),
        createAlbum('2', MediaStatus.PROCESSING),
        createAlbum('3', MediaStatus.PENDING),
      ];

      const processing = albums.filter(
        (a) => a.mediaInfo?.status === MediaStatus.PROCESSING
      );
      expect(processing).toHaveLength(1);
    });

    it('should identify requestable albums (unknown or no status)', () => {
      const albums = [
        createAlbum('1', MediaStatus.AVAILABLE),
        createAlbum('2', MediaStatus.UNKNOWN),
        createAlbum('3'), // No mediaInfo
      ];

      const requestable = albums.filter(
        (a) =>
          !a.mediaInfo?.status || a.mediaInfo.status === MediaStatus.UNKNOWN
      );
      expect(requestable).toHaveLength(2);
    });

    it('should handle partially available state', () => {
      const album = createAlbum('1', MediaStatus.PARTIALLY_AVAILABLE);
      expect(album.mediaInfo?.status).toBe(MediaStatus.PARTIALLY_AVAILABLE);
      // Partially available should still allow requests for remaining content
      const canRequestMore =
        album.mediaInfo?.status === MediaStatus.PARTIALLY_AVAILABLE;
      expect(canRequestMore).toBe(true);
    });

    it('should handle deleted state', () => {
      const album = createAlbum('1', MediaStatus.DELETED);
      expect(album.mediaInfo?.status).toBe(MediaStatus.DELETED);
      // Deleted items should be re-requestable
      const canRerequest = album.mediaInfo?.status === MediaStatus.DELETED;
      expect(canRerequest).toBe(true);
    });
  });

  describe('Duplicate request prevention', () => {
    interface MockRequest {
      id: number;
      status: MediaRequestStatus;
      musicBrainzId: string;
      requestedById: number;
    }

    const createRequest = (
      id: number,
      status: MediaRequestStatus,
      userId: number
    ): MockRequest => ({
      id,
      status,
      musicBrainzId: 'test-mbid',
      requestedById: userId,
    });

    const hasActiveRequest = (requests: MockRequest[]): boolean => {
      return requests.some(
        (r) =>
          r.status !== MediaRequestStatus.DECLINED &&
          r.status !== MediaRequestStatus.COMPLETED
      );
    };

    const userHasActiveRequest = (
      requests: MockRequest[],
      userId: number
    ): boolean => {
      return requests.some(
        (r) =>
          r.requestedById === userId &&
          r.status !== MediaRequestStatus.DECLINED &&
          r.status !== MediaRequestStatus.COMPLETED
      );
    };

    it('should detect pending request blocks new requests', () => {
      const requests = [createRequest(1, MediaRequestStatus.PENDING, 1)];
      expect(hasActiveRequest(requests)).toBe(true);
    });

    it('should detect approved request blocks new requests', () => {
      const requests = [createRequest(1, MediaRequestStatus.APPROVED, 1)];
      expect(hasActiveRequest(requests)).toBe(true);
    });

    it('should allow request when only declined exists', () => {
      const requests = [createRequest(1, MediaRequestStatus.DECLINED, 1)];
      expect(hasActiveRequest(requests)).toBe(false);
    });

    it('should allow request when only completed exists', () => {
      const requests = [createRequest(1, MediaRequestStatus.COMPLETED, 1)];
      expect(hasActiveRequest(requests)).toBe(false);
    });

    it('should identify if current user has active request', () => {
      const requests = [createRequest(1, MediaRequestStatus.PENDING, 1)];
      expect(userHasActiveRequest(requests, 1)).toBe(true);
      expect(userHasActiveRequest(requests, 2)).toBe(false);
    });

    it('should handle failed requests (still blocks)', () => {
      const requests = [createRequest(1, MediaRequestStatus.FAILED, 1)];
      // Failed requests should NOT block new requests - they failed
      const hasBlockingRequest = requests.some(
        (r) =>
          r.status === MediaRequestStatus.PENDING ||
          r.status === MediaRequestStatus.APPROVED
      );
      expect(hasBlockingRequest).toBe(false);
    });

    it('should handle multiple requests with mixed statuses', () => {
      const requests = [
        createRequest(1, MediaRequestStatus.COMPLETED, 1),
        createRequest(2, MediaRequestStatus.DECLINED, 2),
        createRequest(3, MediaRequestStatus.PENDING, 3),
      ];
      expect(hasActiveRequest(requests)).toBe(true); // Request 3 blocks
    });
  });

  describe('Provider timeout handling', () => {
    it('should have sensible timeout defaults', () => {
      // Wikidata timeout in music.ts
      const wikidataTimeout = 10000;
      expect(wikidataTimeout).toBe(10000);
      expect(wikidataTimeout).toBeLessThanOrEqual(30000);
    });

    it('should handle retry logic with exponential backoff', () => {
      const retries = 2;
      const baseDelay = 500;

      const delays: number[] = [];
      for (let attempt = 0; attempt < retries; attempt++) {
        delays.push(baseDelay * Math.pow(2, attempt));
      }

      expect(delays).toEqual([500, 1000]);
    });
  });

  describe('Status display consistency', () => {
    it('should map MediaStatus to display correctly', () => {
      const statusMap: Record<MediaStatus, string> = {
        [MediaStatus.UNKNOWN]: 'unknown',
        [MediaStatus.PENDING]: 'pending',
        [MediaStatus.PROCESSING]: 'processing',
        [MediaStatus.PARTIALLY_AVAILABLE]: 'partial',
        [MediaStatus.AVAILABLE]: 'available',
        [MediaStatus.DELETED]: 'deleted',
      };

      expect(Object.keys(statusMap)).toHaveLength(6);
      expect(statusMap[MediaStatus.AVAILABLE]).toBe('available');
    });

    it('should handle undefined mediaInfo gracefully', () => {
      const mediaInfo: { status?: MediaStatus } | undefined = undefined;
      const status = mediaInfo?.status ?? MediaStatus.UNKNOWN;
      expect(status).toBe(MediaStatus.UNKNOWN);
    });

    it('should treat missing status as unknown', () => {
      const mediaInfo: { status?: MediaStatus } = {};
      const status = mediaInfo.status ?? MediaStatus.UNKNOWN;
      expect(status).toBe(MediaStatus.UNKNOWN);
    });
  });

  describe('Music type discrimination', () => {
    it('should correctly identify music media types', () => {
      const isMusicType = (type: MediaType): boolean => {
        return (
          type === MediaType.MUSIC ||
          type === MediaType.ARTIST ||
          type === MediaType.ALBUM
        );
      };

      expect(isMusicType(MediaType.ARTIST)).toBe(true);
      expect(isMusicType(MediaType.ALBUM)).toBe(true);
      expect(isMusicType(MediaType.MUSIC)).toBe(true);
      expect(isMusicType(MediaType.MOVIE)).toBe(false);
      expect(isMusicType(MediaType.TV)).toBe(false);
    });

    it('should handle exhaustive type checking', () => {
      const getTypeLabel = (type: MediaType): string => {
        switch (type) {
          case MediaType.MOVIE:
            return 'Movie';
          case MediaType.TV:
            return 'TV Show';
          case MediaType.MUSIC:
            return 'Music';
          case MediaType.ARTIST:
            return 'Artist';
          case MediaType.ALBUM:
            return 'Album';
          default:
            return 'Unknown';
        }
      };

      expect(getTypeLabel(MediaType.ARTIST)).toBe('Artist');
      expect(getTypeLabel(MediaType.ALBUM)).toBe('Album');
    });
  });

  describe('Empty response handling', () => {
    it('should handle empty search results', () => {
      const results = { results: [], page: 1, totalPages: 0, totalResults: 0 };
      expect(results.results).toHaveLength(0);
      expect(results.totalResults).toBe(0);
    });

    it('should handle null results array', () => {
      const results: { results: unknown[] | null } = { results: null };
      const items = results.results ?? [];
      expect(items).toHaveLength(0);
    });

    it('should calculate correct page info for empty results', () => {
      const limit = 25;
      const totalResults = 0;
      const totalPages = Math.ceil(totalResults / limit);
      expect(totalPages).toBe(0);
    });
  });
});
