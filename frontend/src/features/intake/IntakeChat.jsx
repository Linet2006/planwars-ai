import { useState } from 'react';
import { Sparkles, Send, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatINR } from '../../utils/formatters.js';

const PRESETS = [
  {
    label: 'Sharma Wedding (₹25L, 350 guests)',
    data: { title: 'Sharma Wedding (Priya & Rohan)', eventType: 'wedding', budgetTotal: 2500000, guestCount: 350, eventDate: '2026-12-15', location: 'Jaipur', priorities: 'Grand hospitality & ceremonies' }
  },
  {
    label: "Anita's 10th Birthday (₹75K, 45 guests)",
    data: { title: "Anita's 10th Milestone Birthday", eventType: 'birthday', budgetTotal: 75000, guestCount: 45, eventDate: '2026-11-20', location: 'Pune', priorities: 'Kids entertainment & dinner' }
  },
  {
    label: 'Diwali Community Mela (₹3.5L, 500 guests)',
    data: { title: 'Green Valley Diwali Community Mela', eventType: 'community', budgetTotal: 350000, guestCount: 500, eventDate: '2026-11-01', location: 'Kolkata', priorities: 'Stage sound & stalls' }
  }
];

const CHIPS = [
  '🎂 Birthday for 20 guests under ₹20,000',
  '💍 Wedding for 350 guests in Jaipur',
  '🎉 Community mela for 500 guests',
  '✨ Anything is fine, decide for me',
  '✅ Yes, generate my complete plan!'
];

export function IntakeChat({ onPlanInitialized }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      content: 'Namaste! I am PlanWars AI, your planning assistant for Indian celebrations. Tell me your occasion, budget, and guest count, or pick an option below!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [partialData, setPartialData] = useState({
    eventType: 'birthday',
    guestCount: 20,
    budgetTotal: 20000,
    eventDate: '2026-11-05',
    title: 'Milestone Birthday Dinner',
    location: 'Jaipur',
    priorities: 'Warm hospitality & delicious dinner'
  });

  async function handleInitializePlan(dataToInit) {
    const raw = dataToInit || partialData;
    const sanitized = {
      title: raw.title || `${(raw.eventType || 'Celebration').slice(0, 1).toUpperCase() + (raw.eventType || 'celebration').slice(1)} Event`,
      eventType: raw.eventType || 'birthday',
      budgetTotal: Number(raw.budgetTotal) || 20000,
      guestCount: Number(raw.guestCount) || 20,
      eventDate: raw.eventDate || '2026-11-05',
      location: raw.location || 'India',
      priorities: raw.priorities || 'Warm hospitality & celebration'
    };

    setLoading(true);
    try {
      const fullPlan = await api.intakeInitialize(sanitized);
      if (onPlanInitialized) onPlanInitialized(fullPlan);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', content: `⚠️ Notice: ${err.message || 'Server issue'}. Please click "Generate Full Plan" below to retry.` }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e, overrideText) {
    if (e) e.preventDefault();
    const userText = (overrideText || input).trim();
    if (!userText || loading) return;

    setInput('');
    const newMessages = [...messages, { sender: 'user', content: userText }];
    setMessages(newMessages);

    const isAffirmative = /^(yes|yeah|yup|sure|ok|okay|generate|create|proceed|go ahead|build plan|do it)\b/i.test(userText);
    if (isAffirmative && partialData.budgetTotal && partialData.guestCount) {
      setMessages((prev) => [...prev, { sender: 'assistant', content: '🎉 Wonderful! Generating your complete tailored plan now...' }]);
      handleInitializePlan(partialData);
      return;
    }

    setLoading(true);
    try {
      const res = await api.intakeChat({ message: userText, history: newMessages.slice(-6), partialData });
      setMessages((prev) => [...prev, { sender: 'assistant', content: res.reply, isReady: res.readyToGenerate }]);
      if (res.planPreview) setPartialData((prev) => ({ ...prev, ...res.planPreview }));
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'assistant', content: err.message || 'Connection glitch. Please try again or select a preset.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="intake-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: '#1f1f1f', margin: '0 0 0.4rem 0', fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: '#1677ff' }} aria-hidden="true" />
          PlanWars AI Event Planner
        </h1>
        <p style={{ color: '#595959', margin: 0, fontSize: '0.95rem' }}>Effortless planning for Indian weddings, birthdays, and community festivals.</p>
      </div>

      <div style={{ background: '#f5f7fa', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', border: '1px solid #e8e8e8' }}>
        <p style={{ margin: '0 0 0.35rem 0', fontWeight: 600, fontSize: '0.78rem', color: '#595959' }}>ONE-CLICK PERSONA TESTERS:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => { setPartialData(p.data); handleInitializePlan(p.data); }}
              style={{ backgroundColor: '#fff', border: '1px solid #1677ff', color: '#1677ff', padding: '0.3rem 0.65rem', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid #e8e8e8', borderRadius: '10px', padding: '0.85rem', minHeight: '220px', maxHeight: '320px', overflowY: 'auto', backgroundColor: '#fafafa', marginBottom: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: m.sender === 'user' ? '#1677ff' : '#ffffff',
              color: m.sender === 'user' ? '#ffffff' : '#262626',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              fontSize: '0.92rem',
              lineHeight: 1.4
            }}
          >
            <div>{m.content}</div>
            {m.sender === 'assistant' && m.isReady && (
              <button
                type="button"
                onClick={() => handleInitializePlan()}
                disabled={loading}
                style={{ marginTop: '0.45rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#52c41a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.82rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <CheckCircle2 size={14} />
                Build Tailored Plan ({formatINR(partialData.budgetTotal)})
              </button>
            )}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: '#8c8c8c', fontStyle: 'italic', fontSize: '0.85rem' }}>PlanWars AI is tailoring your plan...</div>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.65rem' }}>
        {CHIPS.map((chip, i) => (
          <button
            key={i}
            type="button"
            disabled={loading}
            onClick={() => handleSend(null, chip)}
            style={{ background: '#f0f5ff', border: '1px solid #adc6ff', color: '#1d39c4', borderRadius: '14px', padding: '0.2rem 0.55rem', fontSize: '0.78rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <label htmlFor="intake-chat-input" className="sr-only">Chat with planning assistant</label>
        <input
          id="intake-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Birthday dinner for 20 people with ₹20,000 budget in Jaipur..."
          style={{ flex: 1, padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #d9d9d9', fontSize: '0.92rem' }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ padding: '0 1.1rem', backgroundColor: '#1677ff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Send size={15} aria-hidden="true" />
          <span>Send</span>
        </button>
      </form>

      <div style={{ background: '#ffffff', border: '2px solid #52c41a', borderRadius: '10px', padding: '0.85rem' }}>
        <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1rem', color: '#274910', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <HeartHandshake size={17} aria-hidden="true" />
          Ready to Build Your Executable Plan
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem', marginBottom: '0.65rem' }}>
          <div><span style={{ fontSize: '0.7rem', color: '#8c8c8c', display: 'block' }}>Occasion</span><strong style={{ textTransform: 'capitalize', fontSize: '0.88rem' }}>{partialData.eventType}</strong></div>
          <div><span style={{ fontSize: '0.7rem', color: '#8c8c8c', display: 'block' }}>Sanctioned Budget</span><strong style={{ color: '#0958d9', fontSize: '0.88rem' }}>{formatINR(partialData.budgetTotal)}</strong></div>
          <div><span style={{ fontSize: '0.7rem', color: '#8c8c8c', display: 'block' }}>Guest Count</span><strong style={{ fontSize: '0.88rem' }}>{partialData.guestCount} guests</strong></div>
          <div><span style={{ fontSize: '0.7rem', color: '#8c8c8c', display: 'block' }}>Event Date</span><strong style={{ fontSize: '0.88rem' }}>{partialData.eventDate}</strong></div>
        </div>
        <button
          type="button"
          onClick={() => handleInitializePlan()}
          disabled={loading}
          style={{ width: '100%', padding: '0.7rem', backgroundColor: '#52c41a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Generating Comprehensive Plan...' : 'Generate Full Plan (Budget + Timeline + Vendors + Ideas)'}
        </button>
      </div>
    </div>
  );
}
