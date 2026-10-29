import { describe, expect, it } from 'vitest';
import {
  cascadeTaskDelay,
  detectDependencyCycles,
  getNextUrgentTasks,
  sortTasksByDependencies
} from '../../utils/timelineMath.js';

describe('Timeline Math Utility (Dependencies & Cascading Delays)', () => {
  it('detects cycles in task dependencies', () => {
    const tasksWithCycle = [
      { id: '1', depends_on_task_ids: ['2'] },
      { id: '2', depends_on_task_ids: ['1'] }
    ];
    const check = detectDependencyCycles(tasksWithCycle);
    expect(check.hasCycle).toBe(true);

    const acyclicTasks = [
      { id: '1', depends_on_task_ids: [] },
      { id: '2', depends_on_task_ids: ['1'] }
    ];
    expect(detectDependencyCycles(acyclicTasks).hasCycle).toBe(false);
  });

  it('topologically sorts tasks with dependencies', () => {
    const tasks = [
      { id: 't3', title: 'Task 3', depends_on_task_ids: ['t2'] },
      { id: 't1', title: 'Task 1', depends_on_task_ids: [] },
      { id: 't2', title: 'Task 2', depends_on_task_ids: ['t1'] }
    ];

    const sorted = sortTasksByDependencies(tasks);
    const order = sorted.map((t) => t.id);
    expect(order.indexOf('t1')).toBeLessThan(order.indexOf('t2'));
    expect(order.indexOf('t2')).toBeLessThan(order.indexOf('t3'));
  });

  it('cascades delay to downstream dependent tasks', () => {
    const allTasks = [
      { id: 't1', title: 'Lock Venue', due_date: '2026-09-01', depends_on_task_ids: [] },
      { id: 't2', title: 'Book Caterer', due_date: '2026-09-02', depends_on_task_ids: ['t1'] },
      { id: 't3', title: 'Finalize Menu', due_date: '2026-09-03', depends_on_task_ids: ['t2'] }
    ];

    // If t1 is delayed by 7 days (new date: 2026-09-08)
    const cascaded = cascadeTaskDelay('t1', 7, [
      { ...allTasks[0], due_date: '2026-09-08' },
      allTasks[1],
      allTasks[2]
    ]);

    expect(cascaded.length).toBeGreaterThan(0);
    const t2Update = cascaded.find((c) => c.id === 't2');
    expect(t2Update).toBeDefined();
    // t2 will shift to 2 days after t1 = 2026-09-10
    expect(t2Update.newDueDate).toBe('2026-09-10');
  });

  it('returns the next 3 most urgent pending tasks', () => {
    const tasks = [
      { id: '1', title: 'Completed Task', due_date: '2026-08-01', priority: 'high', status: 'completed' },
      { id: '2', title: 'Urgent Task', due_date: '2026-10-01', priority: 'high', status: 'pending' },
      { id: '3', title: 'Medium Task', due_date: '2026-10-05', priority: 'medium', status: 'pending' },
      { id: '4', title: 'Later Task', due_date: '2026-10-10', priority: 'low', status: 'pending' },
      { id: '5', title: 'Far Future', due_date: '2026-11-01', priority: 'low', status: 'pending' }
    ];

    const next3 = getNextUrgentTasks(tasks, 3);
    expect(next3.length).toBe(3);
    expect(next3.map((t) => t.id)).toEqual(['2', '3', '4']);
  });
});
