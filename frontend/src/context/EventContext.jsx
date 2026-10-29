import { createContext, useContext, useReducer } from 'react';

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

  const value = {
    ...state,
    setLoading: (isLoading) => dispatch({ type: 'SET_LOADING', payload: isLoading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    setCurrentEvent: (event) => dispatch({ type: 'SET_CURRENT_EVENT', payload: event }),
    setFullPlan: (plan) => dispatch({ type: 'SET_FULL_PLAN', payload: plan }),
    setActiveTab: (tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
    setReplanOpen: (isOpen) => dispatch({ type: 'SET_REPLAN_OPEN', payload: isOpen }),
    setNotification: (notif) => dispatch({ type: 'SET_NOTIFICATION', payload: notif }),
    clearNotification: () => dispatch({ type: 'CLEAR_NOTIFICATION' })
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
}
