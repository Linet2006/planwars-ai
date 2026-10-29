export function Skeleton({ width = '100%', height = '1.25rem', borderRadius = '4px', count = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            width,
            height,
            borderRadius,
            backgroundColor: '#f0f2f5'
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
