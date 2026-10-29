import { useEffect, useState } from 'react';
import { Sparkles, Bookmark, BookmarkCheck, MessageSquare } from 'lucide-react';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useEventContext } from '../../context/EventContext.jsx';
import { useIdeas } from '../../hooks/useIdeas.js';

export function IdeasTab() {
  const { currentEvent } = useEventContext();
  const eventId = currentEvent?.id;
  const { ideas, loading, fetchIdeas, generateIdeas, refineIdea, toggleSave } = useIdeas(eventId);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [refiningIdea, setRefiningIdea] = useState(null);
  const [refineInstruction, setRefineInstruction] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const categories = ['all', 'Decor', 'Food', 'Activity', 'Entertainment', 'Theme'];

  const filteredIdeas = ideas.filter((idea) => {
    if (activeCategoryFilter === 'all') return true;
    return idea.category?.toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  async function handleRefineSubmit(e) {
    e.preventDefault();
    if (!refiningIdea || !refineInstruction.trim()) return;
    await refineIdea(refiningIdea.id, refineInstruction);
    setRefineInstruction('');
    setRefiningIdea(null);
  }

  return (
    <div className="ideas-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f1f1f' }}>
            Personalized Ideas & Adaptations
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#595959', fontSize: '0.85rem' }}>
            Tailored to {currentEvent?.cultural_context || 'regional'} traditions, age mix, and budget tier.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generateIdeas('all')}
          disabled={loading}
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
          <Sparkles size={16} aria-hidden="true" />
          Generate New Ideas
        </button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategoryFilter(cat)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: activeCategoryFilter === cat ? '#1677ff' : '#d9d9d9',
              backgroundColor: activeCategoryFilter === cat ? '#e6f4ff' : '#ffffff',
              color: activeCategoryFilter === cat ? '#0958d9' : '#595959',
              fontWeight: activeCategoryFilter === cat ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.85rem',
              textTransform: 'capitalize'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}
      >
        {filteredIdeas.map((idea) => {
          const isSaved = Boolean(idea.is_saved);

          return (
            <div
              key={idea.id}
              style={{
                backgroundColor: '#ffffff',
                border: isSaved ? '1px solid #91caff' : '1px solid #e8e8e8',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isSaved ? '0 2px 8px rgba(22, 119, 255, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <Badge variant="primary">{idea.category}</Badge>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#52c41a' }}>
                    Cost: {idea.estimated_cost_tier}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1f1f1f' }}>
                  {idea.title}
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#595959', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {idea.description}
                </p>

                {idea.tags && idea.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    {idea.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.75rem',
                          color: '#595959',
                          backgroundColor: '#f5f5f5',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => toggleSave(idea.id, !isSaved)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'none',
                    border: 'none',
                    color: isSaved ? '#1677ff' : '#8c8c8c',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {isSaved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
                  {isSaved ? 'Saved to Plan' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={() => setRefiningIdea(idea)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'none',
                    border: 'none',
                    color: '#722ed1',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <MessageSquare size={16} aria-hidden="true" />
                  Ask Cheaper Alternative
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refine Idea Modal */}
      <Modal isOpen={Boolean(refiningIdea)} onClose={() => setRefiningIdea(null)} title={`Refine Idea: ${refiningIdea?.title}`}>
        <form onSubmit={handleRefineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, color: '#595959', fontSize: '0.9rem' }}>
            Original: {refiningIdea?.description}
          </p>

          <div>
            <label htmlFor="refine-input" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
              How would you like to adapt this idea?
            </label>
            <textarea
              id="refine-input"
              required
              rows={3}
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="e.g. 'Propose a cheaper DIY alternative' or 'Make it suitable for both toddlers and elderly relatives'..."
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setRefiningIdea(null)}
              style={{ padding: '0.5rem 1rem', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !refineInstruction.trim()}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#1677ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? 'Refining...' : 'Generate Alternative'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
