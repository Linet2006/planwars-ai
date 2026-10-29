import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useEventContext } from '../context/EventContext.jsx';

export function useTimeline(eventId) {
  const { setNotification } = useEventContext();
  const [timeline, setTimeline] = useState({ tasks: [], nextTasks: [], daysRemaining: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTimeline(eventId);
      setTimeline(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const addTask = useCallback(
    async (taskData) => {
      try {
        setLoading(true);
        await api.addTimelineTask(eventId, taskData);
        await fetchTimeline();
        setNotification({ type: 'success', message: 'Task added to timeline' });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, fetchTimeline, setNotification]
  );

  const updateTask = useCallback(
    async (taskId, updateData) => {
      try {
        const res = await api.updateTimelineTask(eventId, taskId, updateData);
        await fetchTimeline();
        if (res.cascadedUpdates && res.cascadedUpdates.length > 0) {
          setNotification({
            type: 'warning',
            message: `Task delayed. Auto-shifted ${res.cascadedUpdates.length} downstream dependent tasks!`
          });
        } else {
          setNotification({ type: 'success', message: 'Task status updated' });
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [eventId, fetchTimeline, setNotification]
  );

  const generateAITimeline = useCallback(
    async (overwrite = false) => {
      try {
        setLoading(true);
        const data = await api.generateTimeline(eventId, overwrite);
        setTimeline(data);
        setNotification({
          type: 'success',
          message: 'Backward timeline generated from event date!'
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId, setNotification]
  );

  return {
    timeline,
    loading,
    error,
    fetchTimeline,
    addTask,
    updateTask,
    generateAITimeline
  };
}
