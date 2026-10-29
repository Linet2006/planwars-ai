import { useState } from 'react';
import { Sparkles, Send, HeartHandshake } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatINR } from '../../utils/formatters.js';

export function IntakeChat({ onPlanInitialized }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      content:
        'Namaste! I am PlanWars AI, your personal planning assistant for Indian weddings, birthdays, and community festivals. Which celebration are we organizing today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [partialData, setPartialData] = useState({
    eventType: 'wedding',
    guestCount: 350,
    budgetTotal: 2500000,
    eventDate: '2026-12-15',
    title: 'Sharma Wedding',
    location: 'Jaipur',
    priorities: 'Grand hospitality & traditional ceremonies'
  });

  // Quick 1-click test persona setups as required by problem statement
  const presets = [
    {
      label: 'Sharma Wedding (₹25L, 350 guests)',
      data: {
        title: 'Sharma Wedding (Priya & Rohan)',
        eventType: 'wedding',
        budgetTotal: 2500000,
        guestCount: 350,
        eventDate: '2026-12-15',
        location: 'Jaipur / Bengaluru',
        priorities: 'Grand multi-ceremony hospitality, authentic food & decor'
      }
    },
    {
      label: "Anita's 10th Birthday (₹75K, 45 guests)",
      data: {
        title: "Anita's 10th Milestone Birthday",
        eventType: 'birthday',
        budgetTotal: 75000,
        guestCount: 45,
        eventDate: '2026-11-20',
        location: 'Pune',
        priorities: 'Kid-friendly entertainment, magician, grandparent comfort'
      }
    },
    {
      label: 'Diwali Community Mela (₹3.5L, 500 guests)',
      data: {
        title: 'Green Valley Diwali Mela & Cultural Eve',
        eventType: 'community',
        budgetTotal: 350000,
        guestCount: 500,
        eventDate: '2026-11-01',
        location: 'Kolkata',
        priorities: 'Stage sound system, volunteer coordination, food stalls & security'
      }
    }
  ];

  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await api.intakeChat({
        message: userText,
        partialData
      });

      setMessages((prev) => [...prev, { sender: 'assistant', content: res.reply }]);
      if (res.planPreview) {
        setPartialData((prev) => ({ ...prev, ...res.planPreview }));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', content: 'Connection glitch. Please continue or select a preset below.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitializePlan(dataToInit) {
    setLoading(true);
    try {
      const fullPlan = await api.intakeInitialize(dataToInit || partialData);
      if (onPlanInitialized) {
        onPlanInitialized(fullPlan);
      }
    } catch (err) {
      alert(`Initialization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="intake-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#1f1f1f', margin: '0 0 0.5rem 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Sparkles style={{ color: '#1677ff' }} aria-hidden="true" />
          PlanWars AI Event Planner
        </h1>
        <p style={{ color: '#595959', margin: 0, fontSize: '1rem' }}>
          Targeted planning for Indian weddings, birthdays, and community festivals.
        </p>
      </div>

      {/* Preset Quick Start Buttons */}
      <div style={{ background: '#f5f7fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e8e8e8' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.85rem', color: '#434343' }}>
          QUICK START WITH EVALUATION PERSONAS:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPartialData(p.data);
                handleInitializePlan(p.data);
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #1677ff',
                color: '#1677ff',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          border: '1px solid #e8e8e8',
          borderRadius: '10px',
          padding: '1rem',
          minHeight: '260px',
          maxHeight: '380px',
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: m.sender === 'user' ? '#1677ff' : '#ffffff',
              color: m.sender === 'user' ? '#ffffff' : '#262626',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              fontSize: '0.95rem',
              lineHeight: 1.5
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#8c8c8c', fontStyle: 'italic', fontSize: '0.85rem' }}>
            PlanWars AI is tailoring your plan...
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <label htmlFor="intake-chat-input" className="sr-only">
          Chat with planning assistant
        </label>
        <input
          id="intake-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Budget is 25 Lakhs, 350 guests in Jaipur for a wedding in December..."
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #d9d9d9',
            fontSize: '1rem'
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0 1.25rem',
            backgroundColor: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Send size={16} aria-hidden="true" />
          <span>Send</span>
        </button>
      </form>

      {/* Plan Preview / Ready Confirmation Card */}
      <div style={{ background: '#ffffff', border: '2px solid #52c41a', borderRadius: '10px', padding: '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.15rem', color: '#274910', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HeartHandshake size={20} aria-hidden="true" />
          Ready to Build Your Executable Plan
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8c8c8c', display: 'block' }}>Occasion</span>
            <strong style={{ textTransform: 'capitalize' }}>{partialData.eventType}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8c8c8c', display: 'block' }}>Sanctioned Budget</span>
            <strong style={{ color: '#0958d9' }}>{formatINR(partialData.budgetTotal)}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8c8c8c', display: 'block' }}>Guest Count</span>
            <strong>{partialData.guestCount} guests</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8c8c8c', display: 'block' }}>Event Date</span>
            <strong>{partialData.eventDate}</strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleInitializePlan()}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.85rem',
            backgroundColor: '#52c41a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Generating Comprehensive Plan...' : 'Generate Full Plan (Budget + Timeline + Vendors + Ideas)'}
        </button>
      </div>
    </div>
  );
}
