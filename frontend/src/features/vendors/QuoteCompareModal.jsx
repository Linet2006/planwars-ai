import { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '../../components/common/Modal.jsx';

export function QuoteCompareModal({ isOpen, onClose, onCompare, loading, defaultVendorName }) {
  const [vendorName, setVendorName] = useState('');
  const [rawQuoteText, setRawQuoteText] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawQuoteText.trim()) return;
    await onCompare({
      vendorName: vendorName || defaultVendorName,
      rawQuoteText
    });
    setVendorName('');
    setRawQuoteText('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Paste & Compare Vendor Quote">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="quote-vendor-name" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Vendor Name
          </label>
          <input
            id="quote-vendor-name"
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder={`e.g. ${defaultVendorName || 'Royal Spice Caterers'}`}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>

        <div>
          <label htmlFor="quote-text" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Paste Proposal / Quotation Text
          </label>
          <textarea
            id="quote-text"
            required
            rows={6}
            value={rawQuoteText}
            onChange={(e) => setRawQuoteText(e.target.value)}
            placeholder="Paste email, WhatsApp proposal, or itemized rate sheet here... AI will extract inclusions, extra charges, and missing questions."
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !rawQuoteText.trim()}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#1677ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Analyzing Quote...' : 'Extract & Compare'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

QuoteCompareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCompare: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  defaultVendorName: PropTypes.string
};
