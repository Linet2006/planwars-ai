import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useEventContext } from '../context/EventContext.jsx';

export function useIdeas(eventId) {
  const { setNotification } = useEventContext();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIdeas = useCallback(
    async (filters = {}) => {
      if (!eventId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getIdeas(eventId, filters);
        setIdeas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  const generateIdeas = useCallback(
    async (focusArea) => {
      try {
        setLoading(true);
        const data = await api.generateIdeas(eventId, focusArea);
        setIdeas(data);
        setNotification({
          type: 'success',
          message: 'Personalized ideas generated for your celebration!'
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, setNotification]
  );

  const refineIdea = useCallback(
    async (ideaId, instruction) => {
      try {
        setLoading(true);
        const refined = await api.refineIdea(eventId, ideaId, instruction);
        await fetchIdeas();
        setNotification({
          type: 'success',
          message: 'Refined idea added to your collection!'
        });
        return refined;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [eventId, fetchIdeas, setNotification]
  );

  const toggleSave = useCallback(
    async (ideaId, isSaved) => {
      try {
        await api.toggleSaveIdea(eventId, ideaId, isSaved);
        await fetchIdeas();
      } catch (err) {
        setError(err.message);
      }
    },
    [eventId, fetchIdeas]
  );

  return {
    ideas,
    loading,
    error,
    fetchIdeas,
    generateIdeas,
    refineIdea,
    toggleSave
  };
}

