export interface ShelfItem {
  id: string
  title: string
  shelf: string
  subCategory: string[]
  blurb: string
  cover: string
  url: string
  published: string
  arxiv: string
}

export interface CurrentShelfItem {
  id: string
  title: string
  shelf: string
  cover: string
  note: string
  noteUrl: string
  progressLabel: string
  progressPercent: number | null
  lastActivity: string
}
