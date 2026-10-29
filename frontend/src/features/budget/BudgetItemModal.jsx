import { Modal } from '../../components/common/Modal.jsx';

export function BudgetItemModal({
  isOpen,
  onClose,
  editingItem,
  category,
  setCategory,
  estimate,
  setEstimate,
  actual,
  setActual,
  notes,
  setNotes,
  onSave
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Budget Item' : 'Add Custom Budget Category'}
    >
      <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="budget-category" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Category Name
          </label>
          <input
            id="budget-category"
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Photography, Catering, Florals"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="budget-estimate" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
              Estimated Amount (₹)
            </label>
            <input
              id="budget-estimate"
              type="number"
              min="0"
              required
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="₹ Amount"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            />
          </div>

          <div>
            <label htmlFor="budget-actual" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
              Actual Confirmed Cost (₹)
            </label>
            <input
              id="budget-actual"
              type="number"
              min="0"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="Leave blank if unconfirmed"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="budget-notes" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            Notes / Inclusions
          </label>
          <input
            id="budget-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Covers 3 meals + live counters"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
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
            Save Item
          </button>
        </div>
      </form>
    </Modal>
  );
}

