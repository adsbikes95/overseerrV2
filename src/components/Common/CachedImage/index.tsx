import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';

const imageLoader = ({ src }: { src: string }) => src;

/**
 * The CachedImage component should be used wherever
 * we want to offer the option to locally cache images.
 *
 * Accepts legacy next/legacy/image props (layout, objectFit, objectPosition)
 * and translates them to the current next/image API.
 **/
interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  sizes?: string;
  quality?: number;
  style?: React.CSSProperties;
  layout?: 'fill' | 'responsive' | 'fixed' | 'intrinsic';
  objectFit?: React.CSSProperties['objectFit'];
  objectPosition?: string;
  fill?: boolean;
  width?: number | `${number}`;
  height?: number | `${number}`;
}

const CachedImage = ({
  src,
  alt,
  layout,
  objectFit,
  objectPosition,
  style,
  fill,
  width,
  height,
  ...props
}: CachedImageProps) => {
  const { currentSettings } = useSettings();

  let imageUrl = src;

  if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.host === 'image.tmdb.org' && currentSettings.cacheImages) {
      imageUrl = imageUrl.replace('https://image.tmdb.org', '/imageproxy');
    }
  }

  const isFill = fill || layout === 'fill';
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(objectFit ? { objectFit } : {}),
    ...(objectPosition ? { objectPosition } : {}),
  };
  const hasStyle = Object.keys(mergedStyle).length > 0;

  if (isFill) {
    return (
      <Image
        unoptimized
        loader={imageLoader}
        src={imageUrl}
        alt={alt}
        fill
        style={hasStyle ? mergedStyle : undefined}
        {...props}
      />
    );
  }

  return (
    <Image
      unoptimized
      loader={imageLoader}
      src={imageUrl}
      alt={alt}
      width={width ?? 0}
      height={height ?? 0}
      style={hasStyle ? mergedStyle : undefined}
      {...props}
    />
  );
};

export default CachedImage;
