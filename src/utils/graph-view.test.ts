import { describe, expect, test } from 'vite-plus/test'
import type { GraphNode, SerializedGraph } from '@/types/graph'
import {
  countGraph,
  getNodeRelations,
  getOneHopGraph,
  searchGraphNodes,
  withoutIsolatedNodes,
} from './graph-view'

const node = (id: string, title = id): GraphNode => ({
  id,
  title,
  description: '',
  published: '2026-01-01',
  category: id === 'lonely' ? '随笔' : '技术',
  tags: id === 'lonely' ? ['生活'] : ['图谱'],
  cover: '',
  linkCount: 0,
})

const graph: SerializedGraph = {
  nodes: [node('a', 'Alpha'), node('b', 'Beta'), node('c', 'Gamma'), node('lonely', '独立文章')],
  links: [
    { source: 'a', target: 'b' },
    { source: 'c', target: 'a' },
  ],
}

describe('graph view utilities', () => {
  test('removes isolated nodes without leaving dangling links', () => {
    expect(withoutIsolatedNodes(graph)).toEqual({
      nodes: [
        { ...graph.nodes[0], linkCount: 2 },
        { ...graph.nodes[1], linkCount: 1 },
        { ...graph.nodes[2], linkCount: 1 },
      ],
      links: graph.links,
    })
  })

  test('builds a directed one-hop neighborhood', () => {
    expect(getOneHopGraph(graph, 'a')).toEqual({
      nodes: [
        { ...graph.nodes[0], linkCount: 2 },
        { ...graph.nodes[1], linkCount: 1 },
        { ...graph.nodes[2], linkCount: 1 },
      ],
      links: graph.links,
    })
    expect(getOneHopGraph(graph, 'lonely')).toEqual({
      nodes: [graph.nodes[3]],
      links: [],
    })
  })

  test('separates incoming and outgoing relations', () => {
    const relations = getNodeRelations(graph, 'a')
    expect(relations.outgoing.map((item) => item.id)).toEqual(['b'])
    expect(relations.incoming.map((item) => item.id)).toEqual(['c'])
  })

  test('searches title, category, and tags while preferring title prefixes', () => {
    expect(searchGraphNodes(graph.nodes, 'alp').map((item) => item.id)).toEqual(['a'])
    expect(searchGraphNodes(graph.nodes, '生活').map((item) => item.id)).toEqual(['lonely'])
    expect(searchGraphNodes(graph.nodes, '图谱', 2)).toHaveLength(2)
  })

  test('reports connected and isolated totals', () => {
    expect(countGraph(graph)).toEqual({ total: 4, connected: 3, isolated: 1, links: 2 })
  })
})
