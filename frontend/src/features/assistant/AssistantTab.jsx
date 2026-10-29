import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { api } from '../../api/client.js';
import { useEventContext } from '../../context/EventContext.jsx';

export function AssistantTab() {
  const { currentEvent } = useEventContext();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      content: `Hello! I am your PlanWars AI coordinator for ${currentEvent?.title || 'your event'}. Ask me questions about budget optimizations, dietary adaptations, vendor negotiation tips, or timeline bottlenecks.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Suggest low-sugar dessert alternatives for elderly guests',
    'What should I ask the decorator regarding late-night dismantling?',
    'How do I handle 50 extra guests without expanding the banquet hall?',
    'What are essential documents to collect from the sound vendor?'
  ];

  async function handleSend(promptText) {
    const textToSend = promptText || input;
    if (!textToSend.trim() || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: textToSend }]);
    setLoading(true);

    try {
      const res = await api.intakeChat({
        eventId: currentEvent?.id,
        message: textToSend,
        partialData: currentEvent
      });
      setMessages((prev) => [...prev, { sender: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          content: 'I recommend discussing with your vendor directly for confirmed availability.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="assistant-tab" style={{ display: 'flex', flexDirection: 'column', height: '650px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f1f1f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot size={20} color="#1677ff" aria-hidden="true" />
          Event Coordinator AI
        </h3>
        <p style={{ margin: '0.2rem 0 0 0', color: '#8c8c8c', fontSize: '0.85rem' }}>
          Specialized in Indian events, vendor questions, and guest comfort.
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f0f5ff', borderBottom: '1px solid #d6e4ff', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              padding: '0.35rem 0.65rem',
              backgroundColor: '#ffffff',
              border: '1px solid #adc6ff',
              color: '#1d39c4',
              borderRadius: '16px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {m.sender === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#1677ff" aria-hidden="true" />
              </div>
            )}
            <div
              style={{
                backgroundColor: m.sender === 'user' ? '#1677ff' : '#f5f5f5',
                color: m.sender === 'user' ? '#ffffff' : '#262626',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                lineHeight: 1.5
              }}
            >
              {m.content}
            </div>
            {m.sender === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="#ffffff" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: '#8c8c8c', fontStyle: 'italic', fontSize: '0.85rem' }}>
            Thinking...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ padding: '1rem', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '0.5rem' }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask event assistant
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your plan..."
          style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #d9d9d9', fontSize: '0.95rem' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '0 1rem',
            backgroundColor: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Send size={16} aria-hidden="true" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
