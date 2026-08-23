import type { PostCategory, PostKind } from '@/utils/post-taxonomy'

export interface GraphNode {
  id: string
  title: string
  description: string
  published: string
  category: PostCategory
  kind: PostKind
  tags: string[]
  cover: string
  linkCount: number
}

export interface GraphLink {
  source: string
  target: string
}

export interface SerializedGraph {
  nodes: GraphNode[]
  links: GraphLink[]
}
