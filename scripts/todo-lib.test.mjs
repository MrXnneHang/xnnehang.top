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
    body_html:
      '<p dir="auto">A <strong>safe</strong> description with <a href="https://example.com">notes</a>.</p>',
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

test('preserves GitHub Flavored Markdown structures and hardens their attributes', () => {
  const task = normalizeIssue(
    issue({
      body: '# H1\n\n- [x] Done\n\n| A | B |\n| - | - |\n| 1 | 2 |',
      body_html: `<h1 dir="auto">H1</h1>
<h6 dir="auto">H6</h6>
<p><strong>bold</strong> <em>em</em> <del>strike</del> <code class="notranslate">inline</code></p>
<ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked disabled class="task-list-item-checkbox" aria-label="Completed task"> Done</li></ul>
<markdown-accessiblity-table><table role="table"><thead><tr><th align="left">A</th><th align="center">B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></markdown-accessiblity-table>
<blockquote><p>quote</p></blockquote><hr>
<div class="highlight highlight-source-ts position-relative"><pre class="notranslate"><span class="pl-k">const</span> value</pre></div>
<p><img src="https://example.com/image.png" alt="image" title="title"></p>
<p><math-renderer class="js-inline-math" aria-label="math">$x^2$</math-renderer></p>
<section data-footnotes class="footnotes"><ol><li id="user-content-fn-1"><p>note <a href="#user-content-fnref-1" data-footnote-backref aria-label="Back">↩</a></p></li></ol></section>`,
    })
  )

  const html = task?.descriptionHtml ?? ''
  assert.match(html, /<h1 dir="auto">H1<\/h1>/)
  assert.match(html, /<h6 dir="auto">H6<\/h6>/)
  assert.match(html, /class="contains-task-list"/)
  assert.match(
    html,
    /<input checked type="checkbox" disabled class="task-list-item-checkbox" aria-label="Completed task" \/>/
  )
  assert.match(html, /<markdown-accessiblity-table><table role="table">/)
  assert.match(html, /class="highlight highlight-source-ts"/)
  assert.doesNotMatch(html, /position-relative/)
  assert.match(html, /<span class="pl-k">const<\/span>/)
  assert.match(html, /loading="lazy" decoding="async"/)
  assert.match(html, /data-footnote-backref/)
  assert.match(
    html,
    /<math-renderer class="js-inline-math" aria-label="math">\$x\^2\$<\/math-renderer>/
  )
  assert.equal(isTodoSnapshot(createSnapshot([task])), true)
})

test('keeps alerts and safe links while resolving repository-relative URLs', () => {
  const task = normalizeIssue(
    issue({
      body: '> [!NOTE]\n> Read [docs](./docs/guide.md).',
      body_html: `<div class="markdown-alert markdown-alert-note" dir="auto">
<p class="markdown-alert-title" dir="auto"><svg onload="alert(1)"><path></path></svg>Note</p>
<p><a href="./docs/guide.md">docs</a> <a href="#section">section</a> <a href="mailto:test@example.com">mail</a></p>
<p><img src="./assets/diagram.png" alt="diagram"></p>
</div>`,
    })
  )

  const html = task?.descriptionHtml ?? ''
  assert.match(html, /class="markdown-alert markdown-alert-note"/)
  assert.doesNotMatch(html, /<svg|<path/)
  assert.match(
    html,
    /href="https:\/\/github\.com\/MrXnneHang\/xnnehang\.top\/blob\/HEAD\/docs\/guide\.md" target="_blank" rel="noopener noreferrer"/
  )
  assert.match(html, /href="#section"/)
  assert.doesNotMatch(html, /href="#section"[^>]+target=/)
  assert.match(html, /href="mailto:test@example\.com"/)
  assert.match(
    html,
    /src="https:\/\/raw\.githubusercontent\.com\/MrXnneHang\/xnnehang\.top\/HEAD\/assets\/diagram\.png"/
  )
})

test('keeps GitHub themed pictures while filtering unsafe sources', () => {
  const task = normalizeIssue(
    issue({
      body: '<picture>theme image</picture>',
      body_html: `<themed-picture data-catalyst-inline="true"><picture>
<source media="(prefers-color-scheme: light)" srcset="https://example.com/light.svg 1x, https://example.com/light@2x.svg 2x" data-canonical-src="https://origin.example/light.svg">
<source media="(prefers-color-scheme: dark)" srcset="javascript:alert(1)">
<img src="https://example.com/fallback.svg" alt="Logo" width="160">
</picture></themed-picture>`,
    })
  )

  const html = task?.descriptionHtml ?? ''
  assert.match(html, /<themed-picture data-catalyst-inline="true"><picture>/)
  assert.match(
    html,
    /<source media="\(prefers-color-scheme: light\)" srcset="https:\/\/example\.com\/light\.svg 1x, https:\/\/example\.com\/light@2x\.svg 2x"/
  )
  assert.doesNotMatch(html, /javascript:/)
  assert.match(html, /<img alt="Logo" width="160" src="https:\/\/example\.com\/fallback\.svg"/)
  assert.equal(isTodoSnapshot(createSnapshot([task])), true)
})

test('rejects dangerous Markdown URLs and forces inert task inputs', () => {
  const task = normalizeIssue(
    issue({
      body: 'unsafe markup',
      body_html: `<p>
<a href="javascript:alert(1)">script</a>
<a href="//evil.example/path">protocol relative</a>
<a href="../../secrets.txt">escape</a>
<img src="data:image/svg+xml,evil" alt="data">
<img src="//evil.example/image.png" alt="protocol relative">
<input type="text" value="editable" onclick="alert(1)">
</p>`,
    })
  )

  const html = task?.descriptionHtml ?? ''
  assert.doesNotMatch(
    html,
    /javascript:|\/\/evil\.example|secrets\.txt|data:image|onclick|type="text"|value=/
  )
  assert.match(html, /<input type="checkbox" disabled class="task-list-item-checkbox"/)
  assert.doesNotMatch(html, /<img/)
  assert.match(html, /\nscript\n/)
})

test('normalizes rendered HTML idempotently and rejects post-sanitize mutations', () => {
  const task = normalizeIssue(
    issue({
      body: '[safe](https://example.com)',
      body_html: '<p><a href="https://example.com">safe</a></p>',
    })
  )
  const snapshot = createSnapshot([task])
  assert.equal(isTodoSnapshot(snapshot), true)
  assert.equal(isTodoSnapshot(JSON.parse(JSON.stringify(snapshot))), true)
  assert.equal(
    isTodoSnapshot({
      ...snapshot,
      tasks: [
        {
          ...snapshot.tasks[0],
          descriptionHtml: `${snapshot.tasks[0].descriptionHtml}<style>x</style>`,
        },
      ],
    }),
    false
  )
})

test('strips executable markup and unsafe links from descriptions', () => {
  const task = normalizeIssue(
    issue({
      body: '<script>alert(1)</script> [bad](javascript:alert(1)) <img src=x onerror=alert(1)>',
      body_html:
        '<script>alert(1)</script><p onclick="alert(1)"><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)"></p>',
    })
  )
  assert.doesNotMatch(task?.descriptionHtml ?? '', /<script|href="javascript:|<img[^>]+onerror/i)
})

test('accepts an existing version-one snapshot with the previous safe HTML shape', () => {
  const snapshot = createSnapshot([normalizeIssue(issue())])
  const previousHtml =
    '<p>Legacy <a href="https://example.com" target="_blank" rel="noopener noreferrer">notes</a>.</p>'
  assert.equal(
    isTodoSnapshot({
      ...snapshot,
      tasks: [{ ...snapshot.tasks[0], descriptionHtml: previousHtml }],
    }),
    true
  )
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
