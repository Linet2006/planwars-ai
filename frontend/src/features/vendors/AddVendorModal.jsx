import { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '../../components/common/Modal.jsx';

export function AddVendorModal({ isOpen, onClose, onAdd }) {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!category.trim() || !name.trim()) return;
    await onAdd({ category, name });
    setCategory('');
    setName('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vendor Category">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="vendor-cat" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Category
          </label>
          <input
            id="vendor-cat"
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Photography, Makeup, Stage Sound"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>
        <div>
          <label htmlFor="vendor-name-input" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Vendor / Business Name
          </label>
          <input
            id="vendor-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LensCraft Studios"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
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
            style={{ padding: '0.5rem 1rem', backgroundColor: '#1677ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Add Vendor
          </button>
        </div>
      </form>
    </Modal>
  );
}

AddVendorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired
};

