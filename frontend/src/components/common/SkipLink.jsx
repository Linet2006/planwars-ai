export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100px',
        left: '16px',
        background: '#1d39c4',
        color: '#ffffff',
        padding: '8px 16px',
        zIndex: 9999,
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 600,
        transition: 'top 0.2s'
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '16px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
      }}
    >
      {children}
    </a>
  );
}
