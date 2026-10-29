/**
 * Pure deterministic timeline & dependency calculation functions.
 * Rule: Timeline back-schedules from the event date with priorities and deadlines.
 * Marking a task done or delayed flags and re-dates downstream tasks.
 */

import { shiftDate, getDaysDifference } from './date.js';

/**
 * Validates dependencies to ensure no cycles exist.
 * @param {Array<{ id: string, depends_on_task_ids?: string[] }>} tasks
 * @returns {{ hasCycle: boolean, cycleTasks?: string[] }}
 */
export function detectDependencyCycles(tasks = []) {
  const adj = new Map();
  tasks.forEach((t) => adj.set(t.id, t.depends_on_task_ids || []));

  const visited = new Set();
  const recStack = new Set();
  const cycleList = [];

  function dfs(taskId) {
    visited.add(taskId);
    recStack.add(taskId);

    const deps = adj.get(taskId) || [];
    for (const depId of deps) {
      if (!visited.has(depId)) {
        if (dfs(depId)) return true;
      } else if (recStack.has(depId)) {
        cycleList.push(taskId, depId);
        return true;
      }
    }

    recStack.delete(taskId);
    return false;
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) {
      if (dfs(t.id)) {
        return { hasCycle: true, cycleTasks: cycleList };
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Topologically sorts tasks based on dependency requirements.
 * Independent tasks come first, downstream dependent tasks follow.
 * @param {Array<object>} tasks
 * @returns {Array<object>} Sorted tasks
 */
export function sortTasksByDependencies(tasks = []) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const adj = new Map();
  const inDegree = new Map();

  tasks.forEach((t) => {
    adj.set(t.id, []);
    inDegree.set(t.id, 0);
  });

  tasks.forEach((t) => {
    const deps = t.depends_on_task_ids || [];
    deps.forEach((depId) => {
      if (adj.has(depId)) {
        adj.get(depId).push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    });
  });

  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sortedIds = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    sortedIds.push(curr);
    const neighbors = adj.get(curr) || [];
    for (const n of neighbors) {
      inDegree.set(n, inDegree.get(n) - 1);
      if (inDegree.get(n) === 0) queue.push(n);
    }
  }

  // Any remaining tasks (e.g. if cycle or detached) appended
  const seen = new Set(sortedIds);
  tasks.forEach((t) => {
    if (!seen.has(t.id)) sortedIds.push(t.id);
  });

  return sortedIds.map((id) => taskMap.get(id));
}

/**
 * Cascades date shifts when a task is delayed by X days.
 * Downstream tasks that depend on it are shifted so their due dates do not precede the dependency.
 * @param {string} delayedTaskId - Task that was shifted
 * @param {number} delayDays - Number of days delayed (e.g. +7)
 * @param {Array<{ id: string, due_date: string, depends_on_task_ids?: string[], title: string }>} allTasks
 * @returns {Array<{ id: string, title: string, oldDueDate: string, newDueDate: string, reason: string }>}
 */
export function cascadeTaskDelay(delayedTaskId, delayDays, allTasks = []) {
  if (delayDays <= 0) return [];

  const taskMap = new Map(allTasks.map((t) => [t.id, { ...t }]));
  const parent = taskMap.get(delayedTaskId);
  if (!parent) return [];

  const cascadedUpdates = [];
  const queue = [delayedTaskId];
  const processed = new Set([delayedTaskId]);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentTask = taskMap.get(currentId);

    // Find all tasks that depend on currentId
    const dependents = allTasks.filter(
      (t) => (t.depends_on_task_ids || []).includes(currentId) && !processed.has(t.id)
    );

    for (const dep of dependents) {
      const depTask = taskMap.get(dep.id);
      const diff = getDaysDifference(currentTask.due_date, depTask.due_date);

      // If dependent task due date is on or before currentTask due date, it must be shifted
      if (diff <= 1) {
        const oldDueDate = depTask.due_date;
        const newDueDate = shiftDate(currentTask.due_date, 2); // buffer of 2 days after dependency
        depTask.due_date = newDueDate;

        cascadedUpdates.push({
          id: dep.id,
          title: dep.title,
          oldDueDate,
          newDueDate,
          reason: `Auto-shifted due to delay in prerequisite task "${currentTask.title}"`
        });

        processed.add(dep.id);
        queue.push(dep.id);
      }
    }
  }

  return cascadedUpdates;
}

/**
 * Selects the next 3 most urgent pending or in-progress tasks,
 * ordered by nearest due date and priority.
 * @param {Array<object>} tasks
 * @returns {Array<object>}
 */
export function getNextUrgentTasks(tasks = [], limit = 3) {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...pendingTasks]
    .sort((a, b) => {
      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const weightA = priorityWeight[a.priority] || 1;
      const weightB = priorityWeight[b.priority] || 1;
      return weightB - weightA;
    })
    .slice(0, limit);
}
