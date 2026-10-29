import { useEffect, useState } from 'react';
import { Plus, Sparkles, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useEventContext } from '../../context/EventContext.jsx';
import { useVendors } from '../../hooks/useVendors.js';
import { formatINR } from '../../utils/formatters.js';
import { QuoteCompareModal } from './QuoteCompareModal.jsx';
import { AddVendorModal } from './AddVendorModal.jsx';

export function VendorsTab() {
  const { currentEvent } = useEventContext();
  const eventId = currentEvent?.id;
  const {
    vendors,
    loading,
    fetchVendors,
    createVendor,
    generateCategories,
    toggleChecklist,
    compareQuote
  } = useVendors(eventId);

  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    if (vendors.length > 0 && !selectedVendorId) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [vendors, selectedVendorId]);

  const activeVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  async function handleAddVendor(data) {
    await createVendor(data);
    setIsAddVendorOpen(false);
  }

  async function handleCompareQuote(data) {
    if (!activeVendor) return;
    await compareQuote(activeVendor.id, data);
    setIsQuoteModalOpen(false);
  }

  return (
    <div className="vendors-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Coordinator Transparency Disclaimer */}
      <div
        style={{
          background: '#f9f0ff',
          border: '1px solid #d3adf7',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#531dab',
          fontSize: '0.85rem'
        }}
      >
        <AlertCircle size={18} aria-hidden="true" />
        <span>
          <strong>Coordinator Notice:</strong> PlanWars AI organizes requirements, prepares critical interview questions, and structures quotes. We never assume vendor availability or confirmed rates without your contracted sign-off.
        </span>
      </div>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f1f1f' }}>
            Vendor Checklists & Quote Comparison
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#595959', fontSize: '0.85rem' }}>
            Verify requirements, ask the right contractual questions, and compare proposals side-by-side.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={generateCategories}
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
            Generate Vendor Categories
          </button>
          <button
            type="button"
            onClick={() => setIsAddVendorOpen(true)}
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
            Add Vendor
          </button>
        </div>
      </div>

      {/* Vendor Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {vendors.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedVendorId(v.id)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: selectedVendorId === v.id ? '#1677ff' : '#d9d9d9',
              backgroundColor: selectedVendorId === v.id ? '#e6f4ff' : '#ffffff',
              color: selectedVendorId === v.id ? '#0958d9' : '#595959',
              fontWeight: selectedVendorId === v.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem'
            }}
          >
            {v.category} ({v.quotes?.length || 0} quotes)
          </button>
        ))}
      </div>

      {activeVendor ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Left Column: Requirements & Checklist */}
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1f1f1f' }}>
              {activeVendor.category} Verification Checklist
            </h3>

            {activeVendor.checklist?.length === 0 ? (
              <p style={{ color: '#8c8c8c', fontStyle: 'italic' }}>No checklist items yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {activeVendor.checklist.map((item) => {
                  const isDone = Boolean(item.is_completed);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklist(item.id, !isDone)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '0.35rem 0',
                        color: isDone ? '#8c8c8c' : '#262626'
                      }}
                    >
                      {isDone ? (
                        <CheckSquare size={18} color="#52c41a" aria-hidden="true" />
                      ) : (
                        <Square size={18} color="#8c8c8c" aria-hidden="true" />
                      )}
                      <span style={{ textDecoration: isDone ? 'line-through' : 'none', fontSize: '0.9rem' }}>
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Quotes & Structured Comparison */}
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f1f1f' }}>
                Quotes & Comparison ({activeVendor.quotes?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                style={{
                  padding: '0.4rem 0.8rem',
                  backgroundColor: '#1677ff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                + Compare New Quote
              </button>
            </div>

            {activeVendor.quotes?.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#8c8c8c', border: '1px dashed #d9d9d9', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>No quotes added for {activeVendor.category} yet.</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Paste any vendor proposal text to extract a structured comparison matrix.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeVendor.quotes.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      padding: '1rem',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#262626' }}>{q.vendor_name}</strong>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0958d9' }}>
                        {formatINR(q.total_amount)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#595959', marginBottom: '0.5rem' }}>
                      <strong>Inclusions:</strong> {(q.inclusions || []).join(', ') || 'Standard proposal items'}
                    </div>

                    {q.extraCharges && q.extraCharges.length > 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#cf1322', marginBottom: '0.5rem' }}>
                        <strong>Extra / Hidden Charges Noted:</strong> {q.extraCharges.join(', ')}
                      </div>
                    )}

                    {q.openQuestions && q.openQuestions.length > 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#d46b08' }}>
                        <strong>Clarifications to ask vendor:</strong> {q.openQuestions.join('; ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No vendor categories yet. Click &quot;Generate Vendor Categories&quot; to begin.</p>
        </div>
      )}

      {/* Quote Comparison Extraction Modal */}
      <QuoteCompareModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onCompare={handleCompareQuote}
        loading={loading}
        defaultVendorName={activeVendor?.name}
      />

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onAdd={handleAddVendor}
      />
    </div>
  );
}
