import { DEFAULT_LOCALE, ENGLISH_LOCALE, type Locale } from '../i18n/locales'

export interface GraphLabels {
  unavailableDate: string
  loadError: string
  noLinkedPosts: string
  miniGraphAria: string
  title: string
  description: string
  posts: string
  connected: string
  isolated: string
  references: string
  searchPlaceholder: string
  searchAria: string
  searchResultsAria: string
  relationshipCount: (count: number) => string
  noRelationships: string
  noMatches: string
  showIsolated: string
  loading: string
  retry: string
  emptyTitle: string
  emptyDescription: string
  backToGraph: string
  categoryLegendAria: string
  controlsAria: string
  zoomIn: string
  zoomOut: string
  fit: string
  reset: string
  enterFullscreen: string
  exitFullscreen: string
  focusedHint: string
  graphHint: string
  graphAria: string
  nodeAria: (title: string, count: number) => string
  detailsAria: string
  outbound: string
  outboundCaption: string
  noOutbound: string
  inbound: string
  inboundCaption: string
  noInbound: string
  readPost: string
  selectPost: string
  selectPostDescription: string
}

const labels: Record<Locale, GraphLabels> = {
  [DEFAULT_LOCALE]: {
    unavailableDate: '发布日期未知',
    loadError: '关系图谱暂时无法加载，请稍后再试。',
    noLinkedPosts: '暂无引用关系',
    miniGraphAria: '本文关系图谱',
    title: '顺着引用，探索文章之间的关系',
    description: '搜索一篇文章，查看它引用了谁、又被谁继续引用。箭头从引用者指向被引用者。',
    posts: '文章',
    connected: '已关联',
    isolated: '未关联',
    references: '引用',
    searchPlaceholder: '搜索文章标题、分类或标签',
    searchAria: '搜索图谱文章',
    searchResultsAria: '图谱搜索结果',
    relationshipCount: (count) => `${count} 条关系`,
    noRelationships: '暂未关联',
    noMatches: '没有匹配的文章',
    showIsolated: '显示未关联文章',
    loading: '正在整理文章关系',
    retry: '重新加载',
    emptyTitle: '当前没有可显示的引用关系',
    emptyDescription: '可通过搜索查看暂未关联的文章。',
    backToGraph: '返回全图',
    categoryLegendAria: '文章分类图例',
    controlsAria: '图谱视角控制',
    zoomIn: '放大图谱',
    zoomOut: '缩小图谱',
    fit: '适应画布',
    reset: '重置视角',
    enterFullscreen: '全屏查看',
    exitFullscreen: '退出全屏',
    focusedHint: '点击相邻节点继续探索 · Esc 返回全图',
    graphHint: '点击节点查看一跳关系 · 滚轮缩放 · 拖动画布',
    graphAria: '文章引用关系图',
    nodeAria: (title, count) => `${title}，${count ? `${count} 条关系` : '暂未关联'}`,
    detailsAria: '文章关系详情',
    outbound: '引用了',
    outboundCaption: '从这篇文章出发',
    noOutbound: '没有指向其他文章的引用',
    inbound: '被引用',
    inboundCaption: '从其他文章汇入',
    noInbound: '还没有其他文章引用它',
    readPost: '阅读全文',
    selectPost: '选择一篇文章',
    selectPostDescription: '点击节点或使用搜索，查看引用方向与文章预览。',
  },
  [ENGLISH_LOCALE]: {
    unavailableDate: 'Publication date unavailable',
    loadError: 'The relationship graph is temporarily unavailable. Please try again later.',
    noLinkedPosts: 'No linked posts yet',
    miniGraphAria: 'Post relationship graph',
    title: 'Explore how posts connect through references',
    description:
      'Search for a post to see what it references and which posts refer back to it. Arrows point from the referring post to the referenced post.',
    posts: 'Posts',
    connected: 'Connected',
    isolated: 'Isolated',
    references: 'References',
    searchPlaceholder: 'Search titles, categories, or tags',
    searchAria: 'Search graph posts',
    searchResultsAria: 'Graph search results',
    relationshipCount: (count) => `${count} ${count === 1 ? 'relationship' : 'relationships'}`,
    noRelationships: 'No relationships yet',
    noMatches: 'No matching posts',
    showIsolated: 'Show isolated posts',
    loading: 'Arranging post relationships',
    retry: 'Try again',
    emptyTitle: 'No relationships to display yet',
    emptyDescription: 'Use search to inspect posts without connections.',
    backToGraph: 'Back to full graph',
    categoryLegendAria: 'Post category legend',
    controlsAria: 'Graph view controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit graph',
    reset: 'Reset view',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    focusedHint: 'Select a neighbor to keep exploring · Esc returns to full graph',
    graphHint: 'Select a node for one-hop relationships · Scroll to zoom · Drag to pan',
    graphAria: 'Post reference graph',
    nodeAria: (title, count) =>
      `${title}, ${count ? `${count} ${count === 1 ? 'relationship' : 'relationships'}` : 'no relationships yet'}`,
    detailsAria: 'Post relationship details',
    outbound: 'References',
    outboundCaption: 'Leaving this post',
    noOutbound: 'This post does not reference another post',
    inbound: 'Referenced by',
    inboundCaption: 'Arriving from other posts',
    noInbound: 'No other posts reference this one yet',
    readPost: 'Read post',
    selectPost: 'Select a post',
    selectPostDescription:
      'Select a node or use search to inspect reference directions and preview the post.',
  },
}

export function getGraphLabels(locale: Locale): GraphLabels {
  return labels[locale]
}

export function getGraphCategoryOrder(): string[] {
  return ['technology', 'culture', 'thought', 'life']
}
