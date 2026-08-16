import { describe, expect, test } from 'vite-plus/test'
import { DEFAULT_LOCALE, ENGLISH_LOCALE } from '../i18n/locales'
import { formatTodoDate, getTodoLabels } from './todo-locale'

describe('Todo localization', () => {
  test('localizes workspace copy and priority descriptions', () => {
    expect(getTodoLabels(DEFAULT_LOCALE).active).toBe('坩埚')
    expect(getTodoLabels(ENGLISH_LOCALE).active).toBe('Crucible')
    expect(getTodoLabels(DEFAULT_LOCALE).priorityDescriptions.p0).toBe('立即处理')
    expect(getTodoLabels(ENGLISH_LOCALE).priorityDescriptions.p0).toBe('Handle now')
  })

  test('pluralizes item counts and builds state-aware labels', () => {
    const english = getTodoLabels(ENGLISH_LOCALE)
    expect(english.items(1)).toBe('1 item')
    expect(english.items(2)).toBe('2 items')
    expect(english.priorityEmpty('P1')).toBe('No pending P1 items')
    expect(english.completedAt('Aug 15, 2026')).toBe('Crystallized Aug 15, 2026')
  })

  test('formats dates for each locale in the shared workspace timezone', () => {
    const timestamp = '2026-08-15T01:30:00.000Z'
    expect(formatTodoDate(timestamp, DEFAULT_LOCALE)).toBe('2026年8月15日')
    expect(formatTodoDate(timestamp, ENGLISH_LOCALE)).toBe('Aug 15, 2026')
    expect(formatTodoDate(null, ENGLISH_LOCALE)).toBe('')
  })
})
