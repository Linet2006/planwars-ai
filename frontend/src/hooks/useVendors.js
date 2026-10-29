import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useEventContext } from '../context/EventContext.jsx';

export function useVendors(eventId) {
  const { setNotification } = useEventContext();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getVendors(eventId);
      setVendors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const createVendor = useCallback(
    async (vendorData) => {
      try {
        setLoading(true);
        await api.createVendor(eventId, vendorData);
        await fetchVendors();
        setNotification({ type: 'success', message: 'Vendor added' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, fetchVendors, setNotification]
  );

  const generateCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.generateVendorCategories(eventId);
      setVendors(data);
      setNotification({
        type: 'success',
        message: 'Vendor categories & checklists generated!'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, setNotification]);

  const toggleChecklist = useCallback(
    async (itemId, isCompleted) => {
      try {
        await api.toggleVendorChecklistItem(eventId, itemId, isCompleted);
        await fetchVendors();
      } catch (err) {
        setError(err.message);
      }
    },
    [eventId, fetchVendors]
  );

  const compareQuote = useCallback(
    async (vendorId, quoteData) => {
      try {
        setLoading(true);
        const res = await api.compareVendorQuote(eventId, vendorId, quoteData);
        await fetchVendors();
        setNotification({
          type: 'success',
          message: 'Quotation analyzed and structured comparison created!'
        });
        return res;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [eventId, fetchVendors, setNotification]
  );

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    generateCategories,
    toggleChecklist,
    compareQuote
  };
}
