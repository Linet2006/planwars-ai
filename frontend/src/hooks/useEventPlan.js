import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useEventContext } from '../context/EventContext.jsx';

export function useEventPlan() {
  const {
    currentEvent,
    fullPlan,
    isLoading,
    error,
    setLoading,
    setError,
    setFullPlan,
    setNotification
  } = useEventContext();

  const [eventsList, setEventsList] = useState([]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getEvents();
      setEventsList(res.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const loadEventPlan = useCallback(
    async (eventId) => {
      try {
        setLoading(true);
        const plan = await api.getEvent(eventId);
        setFullPlan(plan);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setFullPlan, setError]
  );

  const initializePlan = useCallback(
    async (formData) => {
      try {
        setLoading(true);
        const res = await api.intakeInitialize(formData);
        // Reload full plan view
        if (res.event?.id) {
          const plan = await api.getEvent(res.event.id);
          setFullPlan(plan);
          setNotification({
            type: 'success',
            message: `Plan initialized successfully for ${formData.title}!`
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setFullPlan, setNotification, setError]
  );

  return {
    currentEvent,
    fullPlan,
    eventsList,
    isLoading,
    error,
    fetchEvents,
    loadEventPlan,
    initializePlan
  };
}
