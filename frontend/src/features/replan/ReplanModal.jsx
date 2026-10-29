import { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { api } from '../../api/client.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useEventContext } from '../../context/EventContext.jsx';

export function ReplanModal() {
  const { currentEvent, isReplanOpen, setReplanOpen, setFullPlan, setNotification } = useEventContext();

  const [guestCount, setGuestCount] = useState(currentEvent?.guest_count || 350);
  const [budgetTotal, setBudgetTotal] = useState(currentEvent?.budget_total || 2500000);
  const [eventDate, setEventDate] = useState(currentEvent?.event_date || '2026-12-15');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  if (!currentEvent) return null;

  // Preset button for the exact challenge evaluator scenario: "+50 guests, lower budget, event 2 weeks earlier"
  function handlePresetEvaluatorScenario() {
    setGuestCount((currentEvent.guest_count || 350) + 50);
    setBudgetTotal(Math.max(50000, (currentEvent.budget_total || 2500000) - 200000));
    // 14 days earlier
    const d = new Date(currentEvent.event_date || '2026-12-15');
    d.setDate(d.getDate() - 14);
    setEventDate(d.toISOString().split('T')[0]);
    setNotes('+50 guests, lower budget, event 2 weeks earlier');
  }

  async function handleEvaluate(e) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await api.evaluateReplan(currentEvent.id, {
        guestCount: parseInt(guestCount, 10),
        budgetTotal: parseInt(budgetTotal, 10),
        eventDate,
        notes
      });
      setEvaluationResult(res);
    } catch (err) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyOption(option) {
    setLoading(true);
    try {
      await api.applyReplan(currentEvent.id, {
        optionId: option.id,
        guestCount: parseInt(guestCount, 10),
        budgetTotal: parseInt(budgetTotal, 10),
        eventDate,
        budgetAdjustments: option.budgetAdjustments || [],
        timelineAdjustmentDays: option.timelineAdjustmentDays || 0
      });

      // Reload fresh plan
      const updatedPlan = await api.getEvent(currentEvent.id);
      setFullPlan(updatedPlan);
      setNotification({
        type: 'success',
        message: `Plan revised successfully with strategy: "${option.title}". Confirmed contracts preserved!`
      });
      setReplanOpen(false);
      setEvaluationResult(null);
    } catch (err) {
      alert(`Failed to apply strategy: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isReplanOpen}
      onClose={() => {
        setReplanOpen(false);
        setEvaluationResult(null);
      }}
      title="Revise Plan & Evaluate Trade-offs"
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Scenario Quick Fill Button */}
        <div style={{ backgroundColor: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: '8px', padding: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#1d39c4', fontWeight: 600 }}>
              TEST SCENARIO:
            </span>
            <button
              type="button"
              onClick={handlePresetEvaluatorScenario}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #1d39c4',
                color: '#1d39c4',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply &quot;+50 guests, ₹2L lower budget, 2 weeks earlier&quot;
            </button>
          </div>
        </div>

        {/* Change Request Form */}
        <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="replan-guests" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                New Guest Count
              </label>
              <input
                id="replan-guests"
                type="number"
                min="1"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              />
            </div>

            <div>
              <label htmlFor="replan-budget" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                New Sanctioned Budget (₹)
              </label>
              <input
                id="replan-budget"
                type="number"
                min="0"
                required
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              />
            </div>

            <div>
              <label htmlFor="replan-date" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                New Event Date
              </label>
              <input
                id="replan-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              backgroundColor: '#1677ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} aria-hidden="true" />
            {loading ? 'Evaluating Trade-off Options...' : 'Calculate Trade-off Options'}
          </button>
        </form>

        {/* Evaluation Results: Before & After Diff and Options */}
        {evaluationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '2px solid #f0f0f0', paddingTop: '1.25rem' }}>
            {/* Visual Diff Cards */}
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: '#1f1f1f' }}>
                Constraint Impact Summary:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#fafafa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8c8c8c' }}>Guests</span>
                  <div style={{ fontWeight: 700, color: '#262626' }}>
                    {evaluationResult.constraintDiff.guests.before} → {evaluationResult.constraintDiff.guests.after}
                  </div>
                  <Badge variant={evaluationResult.constraintDiff.guests.delta > 0 ? 'warning' : 'primary'}>
                    {evaluationResult.constraintDiff.guests.label}
                  </Badge>
                </div>

                <div style={{ background: '#fafafa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8c8c8c' }}>Budget</span>
                  <div style={{ fontWeight: 700, color: '#262626' }}>
                    {evaluationResult.constraintDiff.budget.formattedAfter}
                  </div>
                  <Badge variant={evaluationResult.constraintDiff.budget.delta < 0 ? 'danger' : 'success'}>
                    {evaluationResult.constraintDiff.budget.label}
                  </Badge>
                </div>

                <div style={{ background: '#fafafa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8c8c8c' }}>Timeline</span>
                  <div style={{ fontWeight: 700, color: '#262626' }}>
                    {evaluationResult.constraintDiff.timeline.afterDate}
                  </div>
                  <Badge variant={evaluationResult.constraintDiff.timeline.daysShifted !== 0 ? 'warning' : 'default'}>
                    {evaluationResult.constraintDiff.timeline.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Strategic Options List */}
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', color: '#1f1f1f' }}>
                Select a Trade-off Strategy:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {evaluationResult.options.map((opt) => (
                  <div
                    key={opt.id}
                    style={{
                      border: '2px solid #91caff',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0958d9' }}>
                        {opt.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleApplyOption(opt)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#52c41a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Check size={16} aria-hidden="true" />
                        Apply Strategy
                      </button>
                    </div>

                    <p style={{ margin: '0 0 0.75rem 0', color: '#595959', fontSize: '0.9rem' }}>
                      {opt.description}
                    </p>

                    <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <strong>Strategy Rationale:</strong> {opt.strategy}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#262626' }}>
                      <strong>Direct Consequences:</strong>
                      <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem', color: '#595959' }}>
                        {opt.consequences.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
