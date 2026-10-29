import { IndianRupee, AlertTriangle, CheckCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { Badge } from '../../components/common/Badge.jsx';
import { useEventContext } from '../../context/EventContext.jsx';
import { formatDateDDMMYYYY, formatINR } from '../../utils/formatters.js';

export function OverviewTab({ onNavigateTab }) {
  const { fullPlan, setReplanOpen } = useEventContext();

  if (!fullPlan) return null;

  const { event, budget, tasks = [], nextTasks = [], daysRemaining } = fullPlan;
  const isOverBudget = budget?.isOverBudget;
  const remaining = budget?.remainingBudget ?? 0;

  return (
    <div className="overview-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner: Re-plan Quick Trigger Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#e6f4ff',
          border: '1px solid #91caff',
          borderRadius: '10px'
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#0958d9', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={18} aria-hidden="true" />
            Dynamic Plan Revision Available
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#595959', fontSize: '0.85rem' }}>
            Organizing changes like &quot;+50 guests, lower budget, or event 2 weeks earlier&quot;? Revise without losing work!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReplanOpen(true)}
          style={{
            padding: '0.6rem 1.2rem',
            backgroundColor: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap'
          }}
        >
          Revise Plan / Trade-offs
        </button>
      </div>

      {/* Key Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Budget Card */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e8e8e8', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#8c8c8c', fontWeight: 600 }}>TOTAL BUDGET</span>
            <IndianRupee size={18} color="#1677ff" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f1f1f', marginBottom: '0.25rem' }}>
            {formatINR(event.budget_total)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#595959' }}>
            {event.guest_count} guests ({formatINR(budget?.perGuestTotal || 0)} / guest)
          </div>
        </div>

        {/* Confirmed Expenses */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e8e8e8', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#8c8c8c', fontWeight: 600 }}>CONFIRMED ACTUALS</span>
            <CheckCircle size={18} color="#52c41a" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f1f1f', marginBottom: '0.25rem' }}>
            {formatINR(budget?.totalActual || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#595959' }}>
            {budget?.confirmedCount || 0} items confirmed • {budget?.estimateOnlyCount || 0} AI estimates
          </div>
        </div>

        {/* Remaining Budget */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: isOverBudget ? '1px solid #ffccc7' : '1px solid #e8e8e8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#8c8c8c', fontWeight: 600 }}>REMAINING BUDGET</span>
            {isOverBudget ? (
              <AlertTriangle size={18} color="#cf1322" aria-hidden="true" />
            ) : (
              <CheckCircle size={18} color="#52c41a" aria-hidden="true" />
            )}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: isOverBudget ? '#cf1322' : '#389e0d',
              marginBottom: '0.25rem'
            }}
          >
            {formatINR(remaining)}
          </div>
          <div style={{ fontSize: '0.8rem', color: isOverBudget ? '#cf1322' : '#595959', fontWeight: isOverBudget ? 600 : 400 }}>
            {isOverBudget ? `Exceeded by ${formatINR(budget?.overBudgetAmount)}` : `${budget?.percentageUsed || 0}% Allocated`}
          </div>
        </div>

        {/* Days to Event */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e8e8e8', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#8c8c8c', fontWeight: 600 }}>EVENT DATE</span>
            <Clock size={18} color="#faad14" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1f1f1f', marginBottom: '0.25rem' }}>
            {daysRemaining} Days
          </div>
          <div style={{ fontSize: '0.8rem', color: '#595959' }}>
            Target: {formatDateDDMMYYYY(event.event_date)} ({event.location || 'India'})
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Tasks & Plan Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Next 3 Urgent Tasks */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f1f1f' }}>Next 3 Urgent Tasks</h3>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('timeline')}
              style={{ background: 'none', border: 'none', color: '#1677ff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              View All ({tasks.length}) <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {nextTasks.length === 0 ? (
            <p style={{ color: '#8c8c8c', fontStyle: 'italic', margin: 0 }}>No pending tasks! All caught up.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {nextTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#262626' }}>{t.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#8c8c8c' }}>Due: {formatDateDDMMYYYY(t.due_date)}</span>
                  </div>
                  <Badge variant={t.priority === 'high' ? 'danger' : 'primary'}>{t.priority.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Health & Assumptions Transparency */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e8e8e8' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1f1f1f' }}>Transparency & Plan Health</h3>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#595959', fontSize: '0.9rem' }}>
            <li>
              <strong>AI Estimate vs Actuals:</strong> All amounts tagged with <Badge variant="estimate">AI Estimate*</Badge> are benchmark models based on {event.guest_count} guests. They become confirmed once you enter contracted quotes.
            </li>
            <li>
              <strong>Per-Plate Arithmetic:</strong> Budget allocations are mathematically bound to ₹{event.budget_total} without hallucinated prices.
            </li>
            <li>
              <strong>Dependency Tracking:</strong> Prerequisite tasks (venue, catering) automatically update downstream dates when marked delayed.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
