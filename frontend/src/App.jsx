import { Suspense, lazy, useEffect } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  IndianRupee,
  Calendar,
  Users2,
  Lightbulb,
  Bot,
  RefreshCw
} from 'lucide-react';
import { AlertBanner } from './components/common/AlertBanner.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { Skeleton } from './components/common/Skeleton.jsx';
import { SkipLink } from './components/common/SkipLink.jsx';
import { useEventContext } from './context/EventContext.jsx';
import { IntakeChat } from './features/intake/IntakeChat.jsx';
import { ReplanModal } from './features/replan/ReplanModal.jsx';
import { useEventPlan } from './hooks/useEventPlan.js';
import { formatINR } from './utils/formatters.js';

// React.lazy for code splitting tabs to keep initial bundle tiny
const OverviewTab = lazy(() =>
  import('./features/overview/OverviewTab.jsx').then((m) => ({ default: m.OverviewTab }))
);
const BudgetTab = lazy(() =>
  import('./features/budget/BudgetTab.jsx').then((m) => ({ default: m.BudgetTab }))
);
const TimelineTab = lazy(() =>
  import('./features/timeline/TimelineTab.jsx').then((m) => ({ default: m.TimelineTab }))
);
const VendorsTab = lazy(() =>
  import('./features/vendors/VendorsTab.jsx').then((m) => ({ default: m.VendorsTab }))
);
const IdeasTab = lazy(() =>
  import('./features/ideas/IdeasTab.jsx').then((m) => ({ default: m.IdeasTab }))
);
const AssistantTab = lazy(() =>
  import('./features/assistant/AssistantTab.jsx').then((m) => ({ default: m.AssistantTab }))
);

export function AppContent() {
  const {
    currentEvent,
    activeTab,
    notification,
    clearNotification,
    setActiveTab,
    setReplanOpen
  } = useEventContext();

  const { eventsList, fetchEvents, loadEventPlan, initializePlan } = useEventPlan();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget', icon: IndianRupee },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'vendors', label: 'Vendors', icon: Users2 },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  return (
    <div className="app-layout">
      <SkipLink targetId="main-content" />

      {/* Top Application Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand" onClick={() => setActiveTab('overview')} role="button" tabIndex={0}>
            <Sparkles className="brand-icon" aria-hidden="true" />
            <span className="brand-title">PlanWars AI</span>
          </div>

          {currentEvent && (
            <div className="header-event-info">
              <span className="event-title-badge">{currentEvent.title}</span>
              <span className="event-meta">
                {currentEvent.guest_count} guests • {formatINR(currentEvent.budget_total)}
              </span>
              <button
                type="button"
                className="replan-trigger-btn"
                onClick={() => setReplanOpen(true)}
                title="Revise Plan (trade-off options)"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Revise Plan
              </button>
            </div>
          )}

          {/* Quick Event Switcher if events exist */}
          {eventsList.length > 1 && (
            <div className="event-switcher">
              <label htmlFor="event-select" className="sr-only">
                Switch Event
              </label>
              <select
                id="event-select"
                value={currentEvent?.id || ''}
                onChange={(e) => loadEventPlan(e.target.value)}
                className="event-select-dropdown"
              >
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({formatINR(ev.budget_total)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="app-main">
        {notification && (
          <AlertBanner
            type={notification.type}
            message={notification.message}
            onClose={clearNotification}
          />
        )}

        {!currentEvent ? (
          // Guided Intake onboarding view
          <IntakeChat onPlanInitialized={(plan) => initializePlan(plan.event)} />
        ) : (
          <div>
            {/* Tab Navigation List */}
            <nav className="tab-navigation" aria-label="Event planning sections">
              <div role="tablist" className="tab-list">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-controls={`tabpanel-${tab.id}`}
                      aria-selected={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-btn ${isSelected ? 'active' : ''}`}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Tab Panel Content */}
            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="tab-panel"
            >
              <Suspense fallback={<Skeleton count={4} height="3rem" />}>
                {activeTab === 'overview' && <OverviewTab onNavigateTab={setActiveTab} />}
                {activeTab === 'budget' && <BudgetTab />}
                {activeTab === 'timeline' && <TimelineTab />}
                {activeTab === 'vendors' && <VendorsTab />}
                {activeTab === 'ideas' && <IdeasTab />}
                {activeTab === 'assistant' && <AssistantTab />}
              </Suspense>
            </div>
          </div>
        )}
      </main>

      {/* Global Plan Re-plan Modal */}
      <ReplanModal />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
