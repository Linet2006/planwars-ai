import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function AlertBanner({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    info: { bg: '#e6f4ff', border: '#91caff', text: '#0958d9', icon: Info },
    success: { bg: '#f6ffed', border: '#b7eb8f', text: '#389e0d', icon: CheckCircle },
    warning: { bg: '#fffbe6', border: '#ffe58f', text: '#d46b08', icon: AlertCircle },
    error: { bg: '#fff2f0', border: '#ffccc7', text: '#cf1322', icon: AlertCircle }
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        color: style.text,
        marginBottom: '1rem',
        fontSize: '0.95rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={18} aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: style.text,
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
