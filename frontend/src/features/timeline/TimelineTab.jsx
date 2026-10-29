import { useEffect, useState } from 'react';
import { Plus, Sparkles, CheckCircle2, Clock, ArrowDown } from 'lucide-react';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useEventContext } from '../../context/EventContext.jsx';
import { useTimeline } from '../../hooks/useTimeline.js';
import { formatDateDDMMYYYY } from '../../utils/formatters.js';

export function TimelineTab() {
  const { currentEvent } = useEventContext();
  const eventId = currentEvent?.id;
  const { timeline, loading, fetchTimeline, addTask, updateTask, generateAITimeline } = useTimeline(eventId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  async function handleSaveTask(e) {
    e.preventDefault();
    await addTask({
      title: taskTitle,
      description: taskDescription,
      dueDate: taskDueDate,
      priority: taskPriority
    });
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setIsAddModalOpen(false);
  }

  const tasks = timeline.tasks || [];

  return (
    <div className="timeline-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1f1f1f' }}>
            Dependency-Aware Timeline (Event: {formatDateDDMMYYYY(currentEvent?.event_date)})
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#595959', fontSize: '0.85rem' }}>
            Back-scheduled milestones with automatic downstream cascade when tasks are delayed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => generateAITimeline(true)}
            disabled={loading}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: '#f0f5ff',
              color: '#1d39c4',
              border: '1px solid #adc6ff',
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
            Re-generate AI Timeline
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
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
            <Plus size={16} aria-hidden="true" />
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {tasks.map((task) => {
          const isDone = task.status === 'completed';
          const isDelayed = task.status === 'delayed';

          return (
            <div
              key={task.id}
              style={{
                backgroundColor: '#ffffff',
                border: isDelayed ? '1px solid #ffa39e' : isDone ? '1px solid #d9f7be' : '1px solid #e8e8e8',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      color: isDone ? '#8c8c8c' : '#1f1f1f',
                      textDecoration: isDone ? 'line-through' : 'none'
                    }}
                  >
                    {task.title}
                  </h3>
                  <Badge variant={task.priority === 'high' ? 'danger' : 'primary'}>{task.priority.toUpperCase()}</Badge>
                  {isDelayed && <Badge variant="warning">DELAYED</Badge>}
                  {isDone && <Badge variant="success">DONE</Badge>}
                </div>
                {task.description && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#595959', fontSize: '0.85rem' }}>
                    {task.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#8c8c8c' }}>
                  <span>
                    <Clock size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Due Date: <strong>{formatDateDDMMYYYY(task.due_date)}</strong>
                  </span>
                  {task.depends_on_task_ids && task.depends_on_task_ids.length > 0 && (
                    <span>
                      <ArrowDown size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                      Prerequisite for downstream items
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!isDone ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { status: 'completed' })}
                      style={{
                        padding: '0.4rem 0.75rem',
                        backgroundColor: '#52c41a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { delayDays: 7 })}
                      style={{
                        padding: '0.4rem 0.75rem',
                        backgroundColor: '#fffbe6',
                        color: '#d46b08',
                        border: '1px solid #ffe58f',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      Delay +7 Days
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateTask(task.id, { status: 'pending' })}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: '#f5f5f5',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Task to Timeline">
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="task-title" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Confirm Sound & Light Permit"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            />
          </div>

          <div>
            <label htmlFor="task-desc" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
              Description
            </label>
            <input
              id="task-desc"
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Details on what needs to be verified"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="task-date" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Due Date
              </label>
              <input
                id="task-date"
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              />
            </div>

            <div>
              <label htmlFor="task-priority" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Priority
              </label>
              <select
                id="task-priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #d9d9d9' }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ padding: '0.5rem 1rem', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', backgroundColor: '#1677ff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
