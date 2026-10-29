export function Badge({ children, variant = 'default', title }) {
  const variants = {
    default: { bg: '#f0f2f5', color: '#595959', border: '#d9d9d9' },
    primary: { bg: '#e6f4ff', color: '#0958d9', border: '#91caff' },
    success: { bg: '#f6ffed', color: '#389e0d', border: '#b7eb8f' },
    warning: { bg: '#fffbe6', color: '#d46b08', border: '#ffe58f' },
    danger: { bg: '#fff2f0', color: '#cf1322', border: '#ffccc7' },
    estimate: { bg: '#f9f0ff', color: '#722ed1', border: '#d3adf7' }
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: style.text || style.color,
        border: `1px solid ${style.border}`,
        lineHeight: 1.4,
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  );
}
