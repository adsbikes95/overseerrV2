import cacheManager from '@server/lib/cache';
import logger from '@server/logger';
import axios from 'axios';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_CACHE_KEY = 'spotify-token';
const TOKEN_CACHE_TTL = 55 * 60; // 55 minutes (tokens last 1 hour)

export const getSpotifyClientId = () => process.env.SPOTIFY_CLIENT_ID ?? '';
export const getSpotifyClientSecret = () =>
  process.env.SPOTIFY_CLIENT_SECRET ?? '';

export const isSpotifyConfigured = (): boolean => {
  const id = getSpotifyClientId();
  const secret = getSpotifyClientSecret();
  return Boolean(id && secret);
};

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
}

interface SpotifySearchResponse {
  artists?: {
    items: SpotifyArtist[];
  };
}

const getAccessToken = async (): Promise<string | null> => {
  const clientId = getSpotifyClientId();
  const clientSecret = getSpotifyClientSecret();
  if (!clientId || !clientSecret) return null;

  const cache = cacheManager.getCache('musicbrainz');
  const cached = cache?.get<string>(TOKEN_CACHE_KEY);
  if (cached) return cached;

  try {
    const { data } = await axios.post<SpotifyTokenResponse>(
      SPOTIFY_AUTH_URL,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString('base64')}`,
        },
        timeout: 10000,
      }
    );
    const token = data.access_token;
    if (token) {
      cache?.set(TOKEN_CACHE_KEY, token, TOKEN_CACHE_TTL);
      return token;
    }
  } catch (e) {
    logger.debug('Failed to get Spotify token', {
      label: 'Spotify API',
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });
  }
  return null;
};

/**
 * Fetch artist image URL from Spotify by artist name.
 * Returns the largest available image, or undefined if not found.
 */
export const getArtistImageByName = async (
  artistName: string
): Promise<string | undefined> => {
  if (!isSpotifyConfigured() || !artistName?.trim()) return undefined;

  const token = await getAccessToken();
  if (!token) return undefined;

  const cacheKey = `spotify-artist-${artistName
    .toLowerCase()
    .replace(/\s+/g, '-')}`;
  const cache = cacheManager.getCache('musicbrainz');
  const cached = cache?.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get<SpotifySearchResponse>(
      `${SPOTIFY_API_URL}/search`,
      {
        params: {
          q: `artist:${encodeURIComponent(artistName)}`,
          type: 'artist',
          limit: 1,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 8000,
      }
    );

    const artist = data.artists?.items?.[0];
    const images = artist?.images;
    if (!images || images.length === 0) return undefined;

    // Prefer largest image (Spotify returns sorted by size desc)
    const imageUrl = images[0].url;
    if (imageUrl) {
      cache?.set(cacheKey, imageUrl, 3600);
      return imageUrl;
    }
  } catch (e) {
    logger.debug('Failed to get Spotify artist image', {
      label: 'Spotify API',
      artistName,
      errorMessage: e instanceof Error ? e.message : 'Unknown error',
    });
  }
  return undefined;
};
