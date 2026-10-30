import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

const initialState = {
  currentEvent: null,
  fullPlan: null,
  activeTab: 'overview',
  isLoading: false,
  error: null,
  isReplanOpen: false,
  notification: null
};

function eventReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload, isLoading: false, error: null };
    case 'SET_FULL_PLAN':
      return {
        ...state,
        fullPlan: action.payload,
        currentEvent: action.payload?.event || state.currentEvent,
        isLoading: false,
        error: null
      };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_REPLAN_OPEN':
      return { ...state, isReplanOpen: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    default:
      return state;
  }
}

const EventContext = createContext(null);

export function EventProvider({ children, initialEvent = null }) {
  const [state, dispatch] = useReducer(eventReducer, {
    ...initialState,
    currentEvent: initialEvent
  });

  const setLoading = useCallback((isLoading) => dispatch({ type: 'SET_LOADING', payload: isLoading }), []);
  const setError = useCallback((error) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const setCurrentEvent = useCallback((event) => dispatch({ type: 'SET_CURRENT_EVENT', payload: event }), []);
  const setFullPlan = useCallback((plan) => dispatch({ type: 'SET_FULL_PLAN', payload: plan }), []);
  const setActiveTab = useCallback((tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), []);
  const setReplanOpen = useCallback((isOpen) => dispatch({ type: 'SET_REPLAN_OPEN', payload: isOpen }), []);
  const setNotification = useCallback((notif) => dispatch({ type: 'SET_NOTIFICATION', payload: notif }), []);
  const clearNotification = useCallback(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), []);

  const value = useMemo(
    () => ({
      ...state,
      setLoading,
      setError,
      setCurrentEvent,
      setFullPlan,
      setActiveTab,
      setReplanOpen,
      setNotification,
      clearNotification
    }),
    [
      state,
      setLoading,
      setError,
      setCurrentEvent,
      setFullPlan,
      setActiveTab,
      setReplanOpen,
      setNotification,
      clearNotification
    ]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
}
