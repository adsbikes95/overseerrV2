import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import Tag from '@app/components/Common/Tag';
import ExternalLinkBlock from '@app/components/ExternalLinkBlock';
import ManageSlideOver from '@app/components/ManageSlideOver';
import RequestButton from '@app/components/RequestButton';
import StatusBadge from '@app/components/StatusBadge';
import { Permission, useUser } from '@app/hooks/useUser';
import Error from '@app/pages/_error';
import { refreshIntervalHelper } from '@app/utils/refreshIntervalHelper';
import { CogIcon } from '@heroicons/react/24/outline';
import type Media from '@server/entity/Media';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages({
  overview: 'Overview',
  overviewunavailable: 'Overview unavailable.',
  releaseDate: 'Release Date',
  primaryType: 'Type',
  artist: 'Artist',
  managealbum: 'Manage Album',
});

interface AlbumDetails {
  id: string;
  title: string;
  imageUrl?: string;
  primaryType?: string;
  secondaryTypes?: string[];
  firstReleaseDate?: string;
  disambiguation?: string;
  artistCredit?: {
    artist: { id: string; name: string };
    name?: string;
  }[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    country?: string;
  }[];
  tags?: { name: string; count: number }[];
  mediaInfo?: Media;
}

const PLACEHOLDER_IMAGE = '/images/overseerr_poster_not_found.png';

const AlbumDetails = () => {
  const { hasPermission } = useUser();
  const router = useRouter();
  const intl = useIntl();
  const [showManager, setShowManager] = useState(
    router.query.manage == '1' ? true : false
  );
  const [coverError, setCoverError] = useState(false);

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<AlbumDetails>(`/api/v1/music/album/${router.query.mbid}`, {
    refreshInterval: (currentData) =>
      refreshIntervalHelper(
        {
          downloadStatus: currentData?.mediaInfo?.downloadStatus,
          downloadStatus4k: undefined,
        },
        15000
      ),
  });

  useEffect(() => {
    setShowManager(router.query.manage == '1' ? true : false);
  }, [router.query.manage]);

  useEffect(() => {
    setCoverError(false);
  }, [data?.id, data?.imageUrl]);

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    const statusCode =
      (error as { response?: { status?: number } })?.response?.status ?? 404;
    return <Error statusCode={statusCode} />;
  }

  const artistName =
    data.artistCredit?.[0]?.name || data.artistCredit?.[0]?.artist?.name || '';

  return (
    <div className="media-page">
      <PageTitle title={data.title} />
      <ManageSlideOver
        data={data}
        mediaType="album"
        onClose={() => {
          setShowManager(false);
          router.push({
            pathname: router.pathname,
            query: { mbid: router.query.mbid },
          });
        }}
        revalidate={() => revalidate()}
        show={showManager}
      />
      <div className="media-header">
        <div className="media-poster">
          <CachedImage
            src={
              coverError
                ? PLACEHOLDER_IMAGE
                : data.imageUrl || `/api/v1/music/album/${data.id}/cover`
            }
            alt={data.title}
            layout="responsive"
            width={600}
            height={900}
            priority
            onError={() => setCoverError(true)}
          />
        </div>
        <div className="media-title">
          <div className="media-status">
            <StatusBadge
              status={data.mediaInfo?.status}
              downloadItem={data.mediaInfo?.downloadStatus}
              title={data.title}
              inProgress={(data.mediaInfo?.downloadStatus ?? []).length > 0}
              tmdbId={undefined}
              mediaType="album"
              serviceUrl={data.mediaInfo?.serviceUrl}
            />
          </div>
          <h1 data-testid="media-title">
            {data.title}
            {data.disambiguation && (
              <span className="media-year"> ({data.disambiguation})</span>
            )}
          </h1>
          {artistName && (
            <span className="media-attributes">
              <span>
                {intl.formatMessage(messages.artist)}: {artistName}
              </span>
            </span>
          )}
        </div>
        <div className="media-actions">
          <RequestButton
            mediaType="album"
            onUpdate={() => revalidate()}
            mbid={data.id}
            media={data.mediaInfo}
          />
          {hasPermission(Permission.MANAGE_REQUESTS) && data.mediaInfo && (
            <Button
              buttonType="ghost"
              onClick={() => setShowManager(true)}
              className="relative ml-2 first:ml-0"
            >
              <CogIcon className="!mr-0" />
            </Button>
          )}
        </div>
      </div>
      <div className="media-overview">
        <div className="media-overview-left min-w-0 overflow-hidden">
          <h2>{intl.formatMessage(messages.overview)}</h2>
          <p className="text-gray-400">
            {artistName
              ? `${data.title} by ${artistName}${
                  data.firstReleaseDate
                    ? `, released ${data.firstReleaseDate}`
                    : ''
                }.`
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
          {data.tags && data.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {data.tags.slice(0, 12).map((tag) => (
                <Tag key={`tag-${tag.name}`}>{tag.name}</Tag>
              ))}
            </div>
          )}
        </div>
        <div className="media-overview-right">
          <div className="media-facts">
            {data.firstReleaseDate && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.releaseDate)}</span>
                <span className="media-fact-value">
                  {data.firstReleaseDate}
                </span>
              </div>
            )}
            {data.primaryType && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.primaryType)}</span>
                <span className="media-fact-value">{data.primaryType}</span>
              </div>
            )}
            {data.secondaryTypes && data.secondaryTypes.length > 0 && (
              <div className="media-fact">
                <span>Secondary Types</span>
                <span className="media-fact-value">
                  {data.secondaryTypes.join(', ')}
                </span>
              </div>
            )}
            {artistName && (
              <div className="media-fact">
                <span>{intl.formatMessage(messages.artist)}</span>
                <span className="media-fact-value">{artistName}</span>
              </div>
            )}
            <div className="media-fact">
              <ExternalLinkBlock
                mediaType="album"
                mbid={data.id}
                serviceUrl={data.mediaInfo?.serviceUrl}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="extra-bottom-space relative" />
    </div>
  );
};

export default AlbumDetails;
