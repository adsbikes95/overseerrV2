interface PlaceholderProps {
  canExpand?: boolean;
  compact?: boolean;
}

const Placeholder = ({
  canExpand = false,
  compact = false,
}: PlaceholderProps) => {
  return (
    <div
      className={`relative animate-pulse rounded-xl bg-gray-700 ${
        canExpand ? 'w-full' : 'w-36 sm:w-36 md:w-44'
      }`}
    >
      <div
        className="w-full"
        style={{ paddingBottom: compact ? '100%' : '150%' }}
      />
    </div>
  );
};

export default Placeholder;
