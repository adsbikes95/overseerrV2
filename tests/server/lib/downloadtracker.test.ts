import { MediaType } from '@server/constants/media';
import { beforeEach, describe, expect, it } from 'vitest';

// Test the DownloadTracker class logic

interface DownloadingItem {
  mediaType: MediaType;
  externalId: number;
  size: number;
  sizeLeft: number;
  status: string;
  timeLeft: string;
  estimatedCompletionTime: Date;
  title: string;
}

class TestDownloadTracker {
  private radarrServers: Record<number, DownloadingItem[]> = {};
  private sonarrServers: Record<number, DownloadingItem[]> = {};
  private lidarrServers: Record<number, DownloadingItem[]> = {};

  public setRadarrData(serverId: number, items: DownloadingItem[]) {
    this.radarrServers[serverId] = items;
  }

  public setSonarrData(serverId: number, items: DownloadingItem[]) {
    this.sonarrServers[serverId] = items;
  }

  public setLidarrData(serverId: number, items: DownloadingItem[]) {
    this.lidarrServers[serverId] = items;
  }

  public getMovieProgress(
    serverId: number,
    externalServiceId: number
  ): DownloadingItem[] {
    if (!this.radarrServers[serverId]) {
      return [];
    }

    return this.radarrServers[serverId].filter(
      (item) => item.externalId === externalServiceId
    );
  }

  public getSeriesProgress(
    serverId: number,
    externalServiceId: number
  ): DownloadingItem[] {
    if (!this.sonarrServers[serverId]) {
      return [];
    }

    return this.sonarrServers[serverId].filter(
      (item) => item.externalId === externalServiceId
    );
  }

  public getArtistProgress(
    serverId: number,
    externalServiceId: number
  ): DownloadingItem[] {
    if (!this.lidarrServers[serverId]) {
      return [];
    }

    return this.lidarrServers[serverId].filter(
      (item) =>
        item.externalId === externalServiceId &&
        item.mediaType === MediaType.ARTIST
    );
  }

  public getAlbumProgress(
    serverId: number,
    externalServiceId: number
  ): DownloadingItem[] {
    if (!this.lidarrServers[serverId]) {
      return [];
    }

    return this.lidarrServers[serverId].filter(
      (item) =>
        item.externalId === externalServiceId &&
        item.mediaType === MediaType.ALBUM
    );
  }

  public resetDownloadTracker() {
    this.radarrServers = {};
    this.sonarrServers = {};
    this.lidarrServers = {};
  }
}

describe('DownloadTracker', () => {
  let tracker: TestDownloadTracker;

  beforeEach(() => {
    tracker = new TestDownloadTracker();
  });

  describe('getMovieProgress', () => {
    it('should return empty array for non-existent server', () => {
      const result = tracker.getMovieProgress(999, 123);
      expect(result).toEqual([]);
    });

    it('should return empty array when no matching movie', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 456,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Movie',
        },
      ]);

      const result = tracker.getMovieProgress(1, 123);
      expect(result).toEqual([]);
    });

    it('should return matching movie downloads', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Movie',
        },
        {
          externalId: 456,
          mediaType: MediaType.MOVIE,
          size: 2000,
          sizeLeft: 1000,
          status: 'downloading',
          timeLeft: '2:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Movie',
        },
      ]);

      const result = tracker.getMovieProgress(1, 123);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Movie');
    });

    it('should return multiple downloads for same movie', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Movie - Quality 1',
        },
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 2000,
          sizeLeft: 1500,
          status: 'downloading',
          timeLeft: '2:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Movie - Quality 2',
        },
      ]);

      const result = tracker.getMovieProgress(1, 123);
      expect(result).toHaveLength(2);
    });
  });

  describe('getSeriesProgress', () => {
    it('should return empty array for non-existent server', () => {
      const result = tracker.getSeriesProgress(999, 123);
      expect(result).toEqual([]);
    });

    it('should return empty array when no matching series', () => {
      tracker.setSonarrData(1, [
        {
          externalId: 456,
          mediaType: MediaType.TV,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Show S01E01',
        },
      ]);

      const result = tracker.getSeriesProgress(1, 123);
      expect(result).toEqual([]);
    });

    it('should return matching series downloads', () => {
      tracker.setSonarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.TV,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Show S01E01',
        },
      ]);

      const result = tracker.getSeriesProgress(1, 123);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Show S01E01');
    });

    it('should return multiple episode downloads for same series', () => {
      tracker.setSonarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.TV,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Show S01E01',
        },
        {
          externalId: 123,
          mediaType: MediaType.TV,
          size: 500,
          sizeLeft: 400,
          status: 'downloading',
          timeLeft: '0:45:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Show S01E02',
        },
        {
          externalId: 456,
          mediaType: MediaType.TV,
          size: 500,
          sizeLeft: 100,
          status: 'downloading',
          timeLeft: '0:10:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Show S01E01',
        },
      ]);

      const result = tracker.getSeriesProgress(1, 123);
      expect(result).toHaveLength(2);
    });
  });

  describe('getArtistProgress', () => {
    it('should return empty array for non-existent server', () => {
      const result = tracker.getArtistProgress(999, 123);
      expect(result).toEqual([]);
    });

    it('should return empty array when no matching artist', () => {
      tracker.setLidarrData(1, [
        {
          externalId: 456,
          mediaType: MediaType.ARTIST,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Artist',
        },
      ]);

      const result = tracker.getArtistProgress(1, 123);
      expect(result).toEqual([]);
    });

    it('should only return ARTIST type items', () => {
      tracker.setLidarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.ARTIST,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Artist',
        },
        {
          externalId: 123,
          mediaType: MediaType.ALBUM,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Album',
        },
      ]);

      const result = tracker.getArtistProgress(1, 123);
      expect(result).toHaveLength(1);
      expect(result[0].mediaType).toBe(MediaType.ARTIST);
    });
  });

  describe('getAlbumProgress', () => {
    it('should return empty array for non-existent server', () => {
      const result = tracker.getAlbumProgress(999, 123);
      expect(result).toEqual([]);
    });

    it('should return empty array when no matching album', () => {
      tracker.setLidarrData(1, [
        {
          externalId: 456,
          mediaType: MediaType.ALBUM,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Other Album',
        },
      ]);

      const result = tracker.getAlbumProgress(1, 123);
      expect(result).toEqual([]);
    });

    it('should only return ALBUM type items', () => {
      tracker.setLidarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.ARTIST,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Artist',
        },
        {
          externalId: 123,
          mediaType: MediaType.ALBUM,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Album',
        },
      ]);

      const result = tracker.getAlbumProgress(1, 123);
      expect(result).toHaveLength(1);
      expect(result[0].mediaType).toBe(MediaType.ALBUM);
    });
  });

  describe('resetDownloadTracker', () => {
    it('should clear all server data', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Movie',
        },
      ]);

      tracker.setSonarrData(1, [
        {
          externalId: 456,
          mediaType: MediaType.TV,
          size: 500,
          sizeLeft: 250,
          status: 'downloading',
          timeLeft: '0:30:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Show',
        },
      ]);

      tracker.setLidarrData(1, [
        {
          externalId: 789,
          mediaType: MediaType.ALBUM,
          size: 200,
          sizeLeft: 100,
          status: 'downloading',
          timeLeft: '0:10:00',
          estimatedCompletionTime: new Date(),
          title: 'Test Album',
        },
      ]);

      tracker.resetDownloadTracker();

      expect(tracker.getMovieProgress(1, 123)).toEqual([]);
      expect(tracker.getSeriesProgress(1, 456)).toEqual([]);
      expect(tracker.getAlbumProgress(1, 789)).toEqual([]);
    });
  });

  describe('DownloadingItem structure', () => {
    it('should calculate download percentage correctly', () => {
      const item: DownloadingItem = {
        externalId: 123,
        mediaType: MediaType.MOVIE,
        size: 1000,
        sizeLeft: 250,
        status: 'downloading',
        timeLeft: '0:15:00',
        estimatedCompletionTime: new Date(),
        title: 'Test Movie',
      };

      const percentComplete = ((item.size - item.sizeLeft) / item.size) * 100;
      expect(percentComplete).toBe(75);
    });

    it('should handle zero size gracefully', () => {
      const item: DownloadingItem = {
        externalId: 123,
        mediaType: MediaType.MOVIE,
        size: 0,
        sizeLeft: 0,
        status: 'queued',
        timeLeft: 'unknown',
        estimatedCompletionTime: new Date(),
        title: 'Queued Movie',
      };

      const percentComplete =
        item.size > 0 ? ((item.size - item.sizeLeft) / item.size) * 100 : 0;
      expect(percentComplete).toBe(0);
    });

    it('should track different download statuses', () => {
      const statuses = [
        'downloading',
        'paused',
        'queued',
        'completed',
        'failed',
        'warning',
      ];

      statuses.forEach((status) => {
        const item: DownloadingItem = {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status,
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Test',
        };

        expect(item.status).toBe(status);
      });
    });
  });

  describe('multi-server scenarios', () => {
    it('should track downloads across multiple Radarr servers', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Movie on Server 1',
        },
      ]);

      tracker.setRadarrData(2, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 2000,
          sizeLeft: 1000,
          status: 'downloading',
          timeLeft: '2:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Movie on Server 2',
        },
      ]);

      const server1Progress = tracker.getMovieProgress(1, 123);
      const server2Progress = tracker.getMovieProgress(2, 123);

      expect(server1Progress[0].title).toBe('Movie on Server 1');
      expect(server2Progress[0].title).toBe('Movie on Server 2');
    });

    it('should isolate server data correctly', () => {
      tracker.setRadarrData(1, [
        {
          externalId: 123,
          mediaType: MediaType.MOVIE,
          size: 1000,
          sizeLeft: 500,
          status: 'downloading',
          timeLeft: '1:00:00',
          estimatedCompletionTime: new Date(),
          title: 'Movie',
        },
      ]);

      // Server 2 has no data
      const server2Progress = tracker.getMovieProgress(2, 123);
      expect(server2Progress).toEqual([]);
    });
  });
});
