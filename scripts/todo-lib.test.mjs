import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TODO_WORKSPACE_LABEL_ID,
  createSnapshot,
  isTodoSnapshot,
  normalizeIssue,
  sortTasks,
} from './todo-lib.mjs'

function issue(overrides = {}) {
  return {
    number: 12,
    title: 'Build the Todo workspace',
    body: 'A **safe** description with [notes](https://example.com).',
    state: 'open',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-02T00:00:00.000Z',
    closed_at: null,
    user: { id: 150757813 },
    labels: [
      { id: TODO_WORKSPACE_LABEL_ID, name: 'workspace:todo', color: '0e8a16' },
      { id: 1, name: 'nyakku.moe', color: '1d76db' },
      { id: 2, name: 'P1', color: 'd93f0b' },
    ],
    ...overrides,
  }
}

test('accepts open and closed Todo Issues with multiple tags', () => {
  const active = normalizeIssue(issue())
  const completed = normalizeIssue(
    issue({ state: 'closed', closed_at: '2026-08-03T00:00:00.000Z' })
  )
  assert.equal(active?.state, 'open')
  assert.deepEqual(
    active?.tags.map((tag) => tag.name),
    ['nyakku.moe', 'P1']
  )
  assert.equal(completed?.state, 'closed')
  assert.match(active?.descriptionHtml ?? '', /rel="noopener noreferrer"/)
})

test('rejects pull requests, unknown authors, and wrong membership labels', () => {
  assert.equal(normalizeIssue(issue({ pull_request: {} })), null)
  assert.equal(normalizeIssue(issue({ user: { id: 1 } })), null)
  assert.equal(
    normalizeIssue(
      issue({ labels: issue().labels.map((label) => ({ ...label, id: label.id + 100 })) })
    ),
    null
  )
})

test('rejects malformed tags and inconsistent state dates', () => {
  assert.equal(
    normalizeIssue(issue({ labels: [...issue().labels, { id: 4, name: 'bad', color: 'red' }] })),
    null
  )
  assert.equal(normalizeIssue(issue({ state: 'closed' })), null)
  assert.equal(normalizeIssue(issue({ closed_at: '2026-08-03T00:00:00.000Z' })), null)
})

test('sorts active work before completion history and orders by activity', () => {
  const older = normalizeIssue(issue({ number: 11, updated_at: '2026-08-01T00:00:00.000Z' }))
  const newer = normalizeIssue(issue({ number: 12, updated_at: '2026-08-02T00:00:00.000Z' }))
  const completed = normalizeIssue(
    issue({ number: 13, state: 'closed', closed_at: '2026-08-04T00:00:00.000Z' })
  )
  assert.deepEqual(
    sortTasks([completed, older, newer]).map((task) => task.number),
    [12, 11, 13]
  )
})

test('builds only active and completed counts', () => {
  const active = normalizeIssue(issue())
  const completed = normalizeIssue(
    issue({ number: 13, state: 'closed', closed_at: '2026-08-04T00:00:00.000Z' })
  )
  assert.deepEqual(createSnapshot([active, completed]).counts, { active: 1, completed: 1 })
})

test('strips executable markup and unsafe links from descriptions', () => {
  const task = normalizeIssue(
    issue({
      body: '<script>alert(1)</script> [bad](javascript:alert(1)) <img src=x onerror=alert(1)>',
    })
  )
  assert.doesNotMatch(task?.descriptionHtml ?? '', /<script|href="javascript:|<img[^>]+onerror/i)
})

test('validates snapshot counts, tags, HTML, and fixed Issue URLs', () => {
  const snapshot = createSnapshot([normalizeIssue(issue())])
  assert.equal(isTodoSnapshot(snapshot), true)
  assert.equal(isTodoSnapshot({ ...snapshot, counts: { active: 4, completed: 0 } }), false)
  assert.equal(
    isTodoSnapshot({
      ...snapshot,
      tasks: [{ ...snapshot.tasks[0], issueUrl: 'https://example.com' }],
    }),
    false
  )
  assert.equal(
    isTodoSnapshot({
      ...snapshot,
      tasks: [{ ...snapshot.tasks[0], descriptionHtml: '<script>alert(1)</script>' }],
    }),
    false
  )
  assert.equal(
    isTodoSnapshot({
      ...snapshot,
      tasks: [{ ...snapshot.tasks[0], tags: [{ id: 1, name: 'bad', color: 'red' }] }],
    }),
    false
  )
})
