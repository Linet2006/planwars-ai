import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useEventContext } from '../context/EventContext.jsx';

export function useBudget(eventId) {
  const { setNotification } = useEventContext();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudget = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBudget(eventId);
      setBudget(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const addItem = useCallback(
    async (itemData) => {
      try {
        setLoading(true);
        await api.addBudgetItem(eventId, itemData);
        await fetchBudget();
        setNotification({ type: 'success', message: 'Budget item added successfully' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, fetchBudget, setNotification]
  );

  const updateItem = useCallback(
    async (itemId, itemData) => {
      try {
        await api.updateBudgetItem(eventId, itemId, itemData);
        await fetchBudget();
        setNotification({ type: 'success', message: 'Budget item updated' });
      } catch (err) {
        setError(err.message);
      }
    },
    [eventId, fetchBudget, setNotification]
  );

  const deleteItem = useCallback(
    async (itemId) => {
      try {
        await api.deleteBudgetItem(eventId, itemId);
        await fetchBudget();
        setNotification({ type: 'info', message: 'Budget item removed' });
      } catch (err) {
        setError(err.message);
      }
    },
    [eventId, fetchBudget, setNotification]
  );

  const generateAIBudget = useCallback(
    async (overwrite = false) => {
      try {
        setLoading(true);
        const res = await api.generateBudget(eventId, overwrite);
        if (res.summary) {
          setBudget(res.summary);
          setNotification({
            type: 'success',
            message: 'AI budget allocation generated based on event type and priorities!'
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, setNotification]
  );

  return {
    budget,
    loading,
    error,
    fetchBudget,
    addItem,
    updateItem,
    deleteItem,
    generateAIBudget
  };
}

