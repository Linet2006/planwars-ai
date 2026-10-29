import { useEffect, useState } from 'react';
import { Plus, Sparkles, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge.jsx';
import { useEventContext } from '../../context/EventContext.jsx';
import { useBudget } from '../../hooks/useBudget.js';
import { formatINR } from '../../utils/formatters.js';
import { BudgetItemModal } from './BudgetItemModal.jsx';

export function BudgetTab() {
  const { currentEvent, setReplanOpen } = useEventContext();
  const eventId = currentEvent?.id;
  const { budget, loading, fetchBudget, addItem, updateItem, deleteItem, generateAIBudget } = useBudget(eventId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newEstimate, setNewEstimate] = useState('');
  const [newActual, setNewActual] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  function handleOpenAdd() {
    setEditingItem(null);
    setNewCategory('');
    setNewEstimate('');
    setNewActual('');
    setNewNotes('');
    setIsAddModalOpen(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setNewCategory(item.category);
    setNewEstimate(item.estimated_amount);
    setNewActual(item.actual_amount !== null ? item.actual_amount : '');
    setNewNotes(item.notes || '');
    setIsAddModalOpen(true);
  }

  async function handleSaveItem(e) {
    e.preventDefault();
    const est = parseInt(newEstimate, 10) || 0;
    const act = newActual !== '' ? parseInt(newActual, 10) : null;

    if (editingItem) {
      await updateItem(editingItem.id, {
        category: newCategory,
        estimatedAmount: est,
        actualAmount: act,
        isConfirmed: act !== null,
        notes: newNotes
      });
    } else {
      await addItem({
        category: newCategory,
        estimatedAmount: est,
        actualAmount: act,
        isConfirmed: act !== null,
        notes: newNotes
      });
    }
    setIsAddModalOpen(false);
  }

  if (!budget) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading budget data...</div>;

  const isOver = budget.isOverBudget;
  const percentage = Math.min(100, budget.percentageUsed || 0);

  return (
    <div className="budget-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Over Budget Alert */}
      {isOver && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cf1322' }}>
            <AlertTriangle size={20} aria-hidden="true" />
            <span>
              <strong>Budget Overshoot Alert:</strong> Current commitments exceed sanctioned budget by{' '}
              <strong>{formatINR(budget.overBudgetAmount)}</strong> ({budget.percentageUsed}% allocated).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplanOpen(true)}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: '#cf1322',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Explore AI Trade-offs
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f1f1f' }}>Budget Breakdown & Tracking</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#595959', fontSize: '0.85rem' }}>
            Clearly separates <Badge variant="estimate">AI Estimate*</Badge> from confirmed actual contracted fees.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => generateAIBudget(true)}
            disabled={loading}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: '#f0f5ff',
              color: '#1d39c4',
              border: '1px solid #adc6ff',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            Re-generate AI Allocation
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1677ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Add Custom Category
          </button>
        </div>
      </div>

      {/* Allocation Progress Bar */}
      <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <span>Allocated: {formatINR(budget.totalAllocated)} of {formatINR(budget.budgetTotal)}</span>
          <span style={{ color: isOver ? '#cf1322' : '#389e0d' }}>
            {isOver ? `Over Budget by ${formatINR(budget.overBudgetAmount)}` : `Remaining: ${formatINR(budget.remainingBudget)}`}
          </span>
        </div>
        <div style={{ height: '10px', backgroundColor: '#f0f2f5', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: isOver ? '#cf1322' : percentage > 90 ? '#faad14' : '#52c41a',
              transition: 'width 0.3s'
            }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Budget allocation percentage"
          />
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e8e8e8', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e8e8e8', color: '#595959' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>AI Estimate*</th>
              <th style={{ padding: '0.75rem 1rem' }}>Confirmed Actual</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Share %</th>
              <th style={{ padding: '0.75rem 1rem' }}>Per Guest</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budget.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#262626' }}>
                  {item.category}
                  {item.notes && <div style={{ fontSize: '0.75rem', color: '#8c8c8c', fontWeight: 400 }}>{item.notes}</div>}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#595959' }}>
                  {formatINR(item.estimated_amount)}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: item.is_confirmed ? 600 : 400, color: item.is_confirmed ? '#0958d9' : '#8c8c8c' }}>
                  {item.actual_amount !== null ? formatINR(item.actual_amount) : '--'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {item.is_confirmed ? (
                    <Badge variant="success">Confirmed</Badge>
                  ) : (
                    <Badge variant="estimate">AI Estimate*</Badge>
                  )}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#595959' }}>
                  {item.percentageOfTotal}%
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#595959' }}>
                  {formatINR(item.perGuest)}
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    aria-label={`Edit ${item.category}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1677ff', marginRight: '0.5rem' }}
                  >
                    <Edit3 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    aria-label={`Delete ${item.category}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BudgetItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        editingItem={editingItem}
        category={newCategory}
        setCategory={setNewCategory}
        estimate={newEstimate}
        setEstimate={setNewEstimate}
        actual={newActual}
        setActual={setNewActual}
        notes={newNotes}
        setNotes={setNewNotes}
        onSave={handleSaveItem}
      />
    </div>
  );
}
