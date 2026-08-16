import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'

export interface TodoLabels {
  workspaceLabel: string
  workspaceNavLabel: string
  workspaceTitle: string
  workspaceDescription: string
  fallbackSnapshot: string
  active: string
  completed: string
  priorities: string
  tags: string
  loading: string
  offlineTitle: string
  loadError: string
  searchLabel: string
  searchPlaceholder: string
  noMatches: string
  noCompleted: string
  priorityEmpty: (priority: string) => string
  activeEmpty: string
  activeState: string
  completedState: string
  selectTask: string
  noDescription: string
  openGitHubLabel: string
  viewOnGitHub: string
  editOnGitHub: string
  items: (count: number) => string
  createdAt: (date: string) => string
  completedAt: (date: string) => string
  updatedAt: (date: string) => string
  priorityDescriptions: Record<'p0' | 'p1' | 'p2' | 'p3', string>
}

const labels: Record<Locale, TodoLabels> = {
  [DEFAULT_LOCALE]: {
    workspaceLabel: '在途工作台',
    workspaceNavLabel: '在途视图',
    workspaceTitle: '炼金',
    workspaceDescription: '把散落的想法混合熔炼',
    fallbackSnapshot: '上一份快照',
    active: '坩埚',
    completed: '结晶',
    priorities: '优先级',
    tags: '标签',
    loading: '正在整理工作台',
    offlineTitle: '工作台暂时离线',
    loadError: '在途数据暂时无法加载，请稍后再试。',
    searchLabel: '搜索在途事项',
    searchPlaceholder: '搜索',
    noMatches: '没有匹配的在途事项',
    noCompleted: '还没有结晶',
    priorityEmpty: (priority) => `${priority} 暂无待处理事项`,
    activeEmpty: '坩埚暂时是空的',
    activeState: '炼制中',
    completedState: '已结晶',
    selectTask: '选择一项查看详情',
    noDescription: '没有补充详情。',
    openGitHubLabel: '在 GitHub 中打开',
    viewOnGitHub: '在 GitHub 中查看',
    editOnGitHub: '在 GitHub 中编辑',
    items: (count) => `${count} 项`,
    createdAt: (date) => `创建于 ${date}`,
    completedAt: (date) => `结晶于 ${date}`,
    updatedAt: (date) => `更新于 ${date}`,
    priorityDescriptions: {
      p0: '立即处理',
      p1: '尽快处理',
      p2: '正常推进',
      p3: '有空再做',
    },
  },
  [ENGLISH_LOCALE]: {
    workspaceLabel: 'Underway workspace',
    workspaceNavLabel: 'Underway views',
    workspaceTitle: 'Alchemy',
    workspaceDescription: 'Turning scattered ideas into finished work',
    fallbackSnapshot: 'Previous snapshot',
    active: 'Crucible',
    completed: 'Crystals',
    priorities: 'Priority',
    tags: 'Labels',
    loading: 'Preparing the workspace',
    offlineTitle: 'Workspace temporarily offline',
    loadError: 'Underway data could not be loaded. Please try again later.',
    searchLabel: 'Search underway items',
    searchPlaceholder: 'Search',
    noMatches: 'No underway items match your search',
    noCompleted: 'Nothing has crystallized yet',
    priorityEmpty: (priority) => `No pending ${priority} items`,
    activeEmpty: 'The crucible is empty for now',
    activeState: 'Refining',
    completedState: 'Crystallized',
    selectTask: 'Select an item to view its details',
    noDescription: 'No additional details.',
    openGitHubLabel: 'Open on GitHub',
    viewOnGitHub: 'View on GitHub',
    editOnGitHub: 'Edit on GitHub',
    items: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
    createdAt: (date) => `Created ${date}`,
    completedAt: (date) => `Crystallized ${date}`,
    updatedAt: (date) => `Updated ${date}`,
    priorityDescriptions: {
      p0: 'Handle now',
      p1: 'Handle soon',
      p2: 'Move forward',
      p3: 'When time allows',
    },
  },
}

export function getTodoLabels(locale: Locale): TodoLabels {
  return labels[locale]
}

export function formatTodoDate(value: string | null, locale: Locale): string {
  if (!value) return ''

  return new Intl.DateTimeFormat(locale === ENGLISH_LOCALE ? 'en' : 'zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))
}
