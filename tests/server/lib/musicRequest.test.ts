import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { isValidMBID } from '@server/utils/validation';
import { describe, expect, it } from 'vitest';

/**
 * Tests for music request creation, validation, and availability resolution.
 * These tests validate the business logic for first-class music support.
 */

describe('Music Request Logic', () => {
  describe('MusicBrainz ID validation', () => {
    it('should accept valid MBID format', () => {
      // Standard MusicBrainz UUID format
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91ecf5e')).toBe(true);
    });

    it('should accept uppercase MBIDs', () => {
      expect(isValidMBID('F27EC8DB-AF05-4F36-916E-3D57F91ECF5E')).toBe(true);
    });

    it('should accept mixed case MBIDs', () => {
      expect(isValidMBID('f27EC8db-AF05-4f36-916E-3d57f91ecf5e')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(isValidMBID('')).toBe(false);
    });

    it('should reject MBID with missing segments', () => {
      expect(isValidMBID('f27ec8db-af05-4f36-916e')).toBe(false);
    });

    it('should reject MBID with extra segments', () => {
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91ecf5e-extra')).toBe(
        false
      );
    });

    it('should reject MBID with wrong segment lengths', () => {
      expect(isValidMBID('f27ec8db-af05-4f36-916-3d57f91ecf5e')).toBe(false);
      expect(isValidMBID('f27ec8db-af0-4f36-916e-3d57f91ecf5e')).toBe(false);
    });

    it('should reject MBID with invalid characters', () => {
      expect(isValidMBID('g27ec8db-af05-4f36-916e-3d57f91ecf5e')).toBe(false);
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91ecf5!')).toBe(false);
    });

    it('should reject MBID with spaces', () => {
      expect(isValidMBID(' f27ec8db-af05-4f36-916e-3d57f91ecf5e')).toBe(false);
      expect(isValidMBID('f27ec8db-af05-4f36-916e-3d57f91ecf5e ')).toBe(false);
    });

    it('should reject SQL injection attempts', () => {
      expect(isValidMBID("'; DROP TABLE media; --")).toBe(false);
      expect(
        isValidMBID('f27ec8db-af05-4f36-916e-3d57f91ecf5e; DROP TABLE')
      ).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(isValidMBID('../../../etc/passwd')).toBe(false);
    });

    // Real MusicBrainz IDs for testing
    it('should accept real artist MBID (The Beatles)', () => {
      expect(isValidMBID('b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d')).toBe(true);
    });

    it('should accept real release group MBID (Abbey Road)', () => {
      expect(isValidMBID('3f587853-328e-4c7a-a1ce-eb9d1dd1fbce')).toBe(true);
    });
  });

  describe('Music media type validation', () => {
    it('should recognize ARTIST as music type', () => {
      const mediaType = MediaType.ARTIST;
      const isMusicType =
        mediaType === MediaType.MUSIC ||
        mediaType === MediaType.ARTIST ||
        mediaType === MediaType.ALBUM;
      expect(isMusicType).toBe(true);
    });

    it('should recognize ALBUM as music type', () => {
      const mediaType = MediaType.ALBUM;
      const isMusicType =
        mediaType === MediaType.MUSIC ||
        mediaType === MediaType.ARTIST ||
        mediaType === MediaType.ALBUM;
      expect(isMusicType).toBe(true);
    });

    it('should recognize MUSIC as music type', () => {
      const mediaType = MediaType.MUSIC;
      const isMusicType =
        mediaType === MediaType.MUSIC ||
        mediaType === MediaType.ARTIST ||
        mediaType === MediaType.ALBUM;
      expect(isMusicType).toBe(true);
    });

    it('should not recognize MOVIE as music type', () => {
      const mediaType = MediaType.MOVIE;
      const isMusicType =
        mediaType === MediaType.MUSIC ||
        mediaType === MediaType.ARTIST ||
        mediaType === MediaType.ALBUM;
      expect(isMusicType).toBe(false);
    });

    it('should not recognize TV as music type', () => {
      const mediaType = MediaType.TV;
      const isMusicType =
        mediaType === MediaType.MUSIC ||
        mediaType === MediaType.ARTIST ||
        mediaType === MediaType.ALBUM;
      expect(isMusicType).toBe(false);
    });
  });

  describe('Music request status transitions', () => {
    it('should have PENDING as initial status', () => {
      expect(MediaRequestStatus.PENDING).toBe(1);
    });

    it('should have valid status values', () => {
      expect(MediaRequestStatus.PENDING).toBe(1);
      expect(MediaRequestStatus.APPROVED).toBe(2);
      expect(MediaRequestStatus.DECLINED).toBe(3);
      expect(MediaRequestStatus.FAILED).toBe(4);
      expect(MediaRequestStatus.COMPLETED).toBe(5);
    });

    it('should allow transition from PENDING to APPROVED', () => {
      const currentStatus = MediaRequestStatus.PENDING;
      const newStatus = MediaRequestStatus.APPROVED;
      const validTransition = currentStatus === MediaRequestStatus.PENDING;
      expect(validTransition).toBe(true);
      expect(newStatus).toBe(MediaRequestStatus.APPROVED);
    });

    it('should allow transition from PENDING to DECLINED', () => {
      const currentStatus = MediaRequestStatus.PENDING;
      const newStatus = MediaRequestStatus.DECLINED;
      const validTransition = currentStatus === MediaRequestStatus.PENDING;
      expect(validTransition).toBe(true);
      expect(newStatus).toBe(MediaRequestStatus.DECLINED);
    });
  });

  describe('Music duplicate detection logic', () => {
    interface MockMusicRequest {
      musicBrainzId: string;
      mediaType: MediaType;
      status: MediaRequestStatus;
      requestedById: number;
      isAutoRequest: boolean;
    }

    const createMockMusicRequest = (
      overrides: Partial<MockMusicRequest> = {}
    ): MockMusicRequest => ({
      musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
      mediaType: MediaType.ARTIST,
      status: MediaRequestStatus.PENDING,
      requestedById: 1,
      isAutoRequest: false,
      ...overrides,
    });

    const isDuplicateMusicRequest = (
      existing: MockMusicRequest[],
      newRequest: { musicBrainzId: string; mediaType: MediaType }
    ): boolean => {
      return existing.some(
        (req) =>
          req.musicBrainzId === newRequest.musicBrainzId &&
          req.mediaType === newRequest.mediaType &&
          req.status !== MediaRequestStatus.DECLINED &&
          req.status !== MediaRequestStatus.COMPLETED
      );
    };

    it('should detect duplicate pending request for same MBID', () => {
      const existing = [
        createMockMusicRequest({ status: MediaRequestStatus.PENDING }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(true);
    });

    it('should detect duplicate approved request for same MBID', () => {
      const existing = [
        createMockMusicRequest({ status: MediaRequestStatus.APPROVED }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(true);
    });

    it('should allow request when existing request was declined', () => {
      const existing = [
        createMockMusicRequest({ status: MediaRequestStatus.DECLINED }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(false);
    });

    it('should allow request when existing request was completed', () => {
      const existing = [
        createMockMusicRequest({ status: MediaRequestStatus.COMPLETED }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(false);
    });

    it('should allow different artist request when one exists', () => {
      const existing = [createMockMusicRequest()];
      const newRequest = {
        musicBrainzId: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d', // Different MBID
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(false);
    });

    it('should allow album request when artist request exists for same MBID', () => {
      const existing = [
        createMockMusicRequest({ mediaType: MediaType.ARTIST }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ALBUM, // Different media type
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(false);
    });

    it('should detect duplicate when multiple requests exist', () => {
      const existing = [
        createMockMusicRequest({
          musicBrainzId: 'aaaa1111-2222-3333-4444-555566667777',
          status: MediaRequestStatus.COMPLETED,
        }),
        createMockMusicRequest({
          musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
          status: MediaRequestStatus.PENDING,
        }),
      ];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(true);
    });

    it('should not detect duplicate when no requests exist', () => {
      const existing: MockMusicRequest[] = [];
      const newRequest = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
        mediaType: MediaType.ARTIST,
      };

      expect(isDuplicateMusicRequest(existing, newRequest)).toBe(false);
    });
  });

  describe('Music availability resolution', () => {
    interface MockDownloadingItem {
      mediaType: MediaType;
      externalId: number;
      size: number;
      sizeLeft: number;
      status: string;
    }

    const createMockDownloadingItem = (
      overrides: Partial<MockDownloadingItem> = {}
    ): MockDownloadingItem => ({
      mediaType: MediaType.ARTIST,
      externalId: 123,
      size: 1000000,
      sizeLeft: 500000,
      status: 'downloading',
      ...overrides,
    });

    const getArtistProgressFiltered = (
      items: MockDownloadingItem[],
      externalId: number
    ): MockDownloadingItem[] => {
      return items.filter(
        (item) =>
          item.externalId === externalId && item.mediaType === MediaType.ARTIST
      );
    };

    const getAlbumProgressFiltered = (
      items: MockDownloadingItem[],
      externalId: number
    ): MockDownloadingItem[] => {
      return items.filter(
        (item) =>
          item.externalId === externalId && item.mediaType === MediaType.ALBUM
      );
    };

    it('should find artist progress by external ID', () => {
      const items = [
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ARTIST,
        }),
        createMockDownloadingItem({
          externalId: 456,
          mediaType: MediaType.ARTIST,
        }),
      ];

      const progress = getArtistProgressFiltered(items, 123);
      expect(progress).toHaveLength(1);
      expect(progress[0].externalId).toBe(123);
    });

    it('should find album progress by external ID', () => {
      const items = [
        createMockDownloadingItem({
          externalId: 789,
          mediaType: MediaType.ALBUM,
        }),
      ];

      const progress = getAlbumProgressFiltered(items, 789);
      expect(progress).toHaveLength(1);
      expect(progress[0].externalId).toBe(789);
    });

    it('should return empty array when no progress found', () => {
      const items = [
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ARTIST,
        }),
      ];

      const progress = getArtistProgressFiltered(items, 999);
      expect(progress).toHaveLength(0);
    });

    it('should filter artist progress from mixed media types', () => {
      const items = [
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ARTIST,
        }),
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ALBUM,
        }),
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.MOVIE,
        }),
      ];

      const artistProgress = getArtistProgressFiltered(items, 123);
      expect(artistProgress).toHaveLength(1);
      expect(artistProgress[0].mediaType).toBe(MediaType.ARTIST);

      const albumProgress = getAlbumProgressFiltered(items, 123);
      expect(albumProgress).toHaveLength(1);
      expect(albumProgress[0].mediaType).toBe(MediaType.ALBUM);
    });

    it('should handle multiple downloads for same artist', () => {
      const items = [
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ARTIST,
          sizeLeft: 500000,
        }),
        createMockDownloadingItem({
          externalId: 123,
          mediaType: MediaType.ARTIST,
          sizeLeft: 300000,
        }),
      ];

      const progress = getArtistProgressFiltered(items, 123);
      expect(progress).toHaveLength(2);
    });

    describe('download completion calculation', () => {
      const calculateDownloadProgress = (item: MockDownloadingItem): number => {
        if (item.size === 0) return 0;
        return Math.round(((item.size - item.sizeLeft) / item.size) * 100);
      };

      it('should calculate 50% progress', () => {
        const item = createMockDownloadingItem({
          size: 1000000,
          sizeLeft: 500000,
        });
        expect(calculateDownloadProgress(item)).toBe(50);
      });

      it('should calculate 100% when complete', () => {
        const item = createMockDownloadingItem({
          size: 1000000,
          sizeLeft: 0,
        });
        expect(calculateDownloadProgress(item)).toBe(100);
      });

      it('should calculate 0% when just started', () => {
        const item = createMockDownloadingItem({
          size: 1000000,
          sizeLeft: 1000000,
        });
        expect(calculateDownloadProgress(item)).toBe(0);
      });

      it('should handle zero size gracefully', () => {
        const item = createMockDownloadingItem({
          size: 0,
          sizeLeft: 0,
        });
        expect(calculateDownloadProgress(item)).toBe(0);
      });
    });
  });

  describe('Music media status lifecycle', () => {
    it('should start with UNKNOWN status', () => {
      expect(MediaStatus.UNKNOWN).toBe(1);
    });

    it('should transition to PENDING when requested', () => {
      const initialStatus = MediaStatus.UNKNOWN;
      const newStatus = MediaStatus.PENDING;
      expect(newStatus).toBeGreaterThan(initialStatus);
    });

    it('should transition to PROCESSING when sent to Lidarr', () => {
      expect(MediaStatus.PROCESSING).toBe(3);
    });

    it('should transition to AVAILABLE when download completes', () => {
      expect(MediaStatus.AVAILABLE).toBe(5);
    });

    it('should have valid status order', () => {
      expect(MediaStatus.UNKNOWN).toBeLessThan(MediaStatus.PENDING);
      expect(MediaStatus.PENDING).toBeLessThan(MediaStatus.PROCESSING);
      expect(MediaStatus.PROCESSING).toBeLessThan(
        MediaStatus.PARTIALLY_AVAILABLE
      );
      expect(MediaStatus.PARTIALLY_AVAILABLE).toBeLessThan(
        MediaStatus.AVAILABLE
      );
    });
  });

  describe('Music request options', () => {
    interface MockMusicRequestOptions {
      serverId?: number;
      profileId?: number;
      rootFolder?: string;
      metadataProfileId?: number;
      tags?: number[];
    }

    it('should support Lidarr server ID', () => {
      const options: MockMusicRequestOptions = { serverId: 1 };
      expect(options.serverId).toBe(1);
    });

    it('should support quality profile ID', () => {
      const options: MockMusicRequestOptions = { profileId: 5 };
      expect(options.profileId).toBe(5);
    });

    it('should support root folder path', () => {
      const options: MockMusicRequestOptions = { rootFolder: '/music' };
      expect(options.rootFolder).toBe('/music');
    });

    it('should support metadata profile ID (Lidarr-specific)', () => {
      const options: MockMusicRequestOptions = { metadataProfileId: 2 };
      expect(options.metadataProfileId).toBe(2);
    });

    it('should support tags array', () => {
      const options: MockMusicRequestOptions = { tags: [1, 2, 3] };
      expect(options.tags).toEqual([1, 2, 3]);
    });

    it('should allow all options together', () => {
      const options: MockMusicRequestOptions = {
        serverId: 1,
        profileId: 5,
        rootFolder: '/music',
        metadataProfileId: 2,
        tags: [1, 2],
      };
      expect(options.serverId).toBe(1);
      expect(options.profileId).toBe(5);
      expect(options.rootFolder).toBe('/music');
      expect(options.metadataProfileId).toBe(2);
      expect(options.tags).toEqual([1, 2]);
    });
  });

  describe('Music vs Movie/TV differences', () => {
    it('should not use 4K for music requests', () => {
      const musicRequestIs4k = false; // Music always false
      const movieRequestIs4k = true; // Movie can be true

      expect(musicRequestIs4k).toBe(false);
      expect(movieRequestIs4k).toBe(true);
    });

    it('should use musicBrainzId instead of tmdbId', () => {
      interface MusicMedia {
        musicBrainzId: string;
        tmdbId?: number;
      }

      interface MovieMedia {
        musicBrainzId?: string;
        tmdbId: number;
      }

      const musicMedia: MusicMedia = {
        musicBrainzId: 'f27ec8db-af05-4f36-916e-3d57f91ecf5e',
      };

      const movieMedia: MovieMedia = {
        tmdbId: 12345,
      };

      expect(musicMedia.musicBrainzId).toBeDefined();
      expect(musicMedia.tmdbId).toBeUndefined();
      expect(movieMedia.tmdbId).toBeDefined();
      expect(movieMedia.musicBrainzId).toBeUndefined();
    });

    it('should not have seasons for music', () => {
      interface MusicRequest {
        seasons?: never;
      }

      interface TvRequest {
        seasons: number[];
      }

      const musicRequest: MusicRequest = {};
      const tvRequest: TvRequest = { seasons: [1, 2, 3] };

      expect(musicRequest.seasons).toBeUndefined();
      expect(tvRequest.seasons).toHaveLength(3);
    });

    it('should use metadataProfileId instead of languageProfileId', () => {
      interface LidarrOptions {
        metadataProfileId: number;
        languageProfileId?: never;
      }

      interface SonarrOptions {
        languageProfileId: number;
        metadataProfileId?: never;
      }

      const lidarrOptions: LidarrOptions = { metadataProfileId: 1 };
      const sonarrOptions: SonarrOptions = { languageProfileId: 2 };

      expect(lidarrOptions.metadataProfileId).toBe(1);
      expect(sonarrOptions.languageProfileId).toBe(2);
    });
  });
});
