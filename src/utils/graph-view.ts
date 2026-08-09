import type { GraphLink, GraphNode, SerializedGraph } from '@/types/graph'

export interface GraphRelations {
  outgoing: GraphNode[]
  incoming: GraphNode[]
}

export function getConnectedNodeIds(graph: SerializedGraph): Set<string> {
  const connected = new Set<string>()
  for (const link of graph.links) {
    connected.add(link.source)
    connected.add(link.target)
  }
  return connected
}

export function withVisibleLinkCounts(graph: SerializedGraph): SerializedGraph {
  const linkCounts = new Map<string, number>()
  for (const link of graph.links) {
    linkCounts.set(link.source, (linkCounts.get(link.source) ?? 0) + 1)
    linkCounts.set(link.target, (linkCounts.get(link.target) ?? 0) + 1)
  }

  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      linkCount: linkCounts.get(node.id) ?? 0,
    })),
    links: graph.links,
  }
}

export function filterGraph(graph: SerializedGraph, nodeIds: Set<string>): SerializedGraph {
  return withVisibleLinkCounts({
    nodes: graph.nodes.filter((node) => nodeIds.has(node.id)),
    links: graph.links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target)),
  })
}

export function withoutIsolatedNodes(graph: SerializedGraph): SerializedGraph {
  return filterGraph(graph, getConnectedNodeIds(graph))
}

export function getOneHopGraph(graph: SerializedGraph, nodeId: string): SerializedGraph {
  const nodeIds = new Set<string>([nodeId])
  for (const link of graph.links) {
    if (link.source === nodeId) nodeIds.add(link.target)
    if (link.target === nodeId) nodeIds.add(link.source)
  }
  return filterGraph(graph, nodeIds)
}

export function getNodeRelations(graph: SerializedGraph, nodeId: string): GraphRelations {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const outgoing: GraphNode[] = []
  const incoming: GraphNode[] = []

  for (const link of graph.links) {
    if (link.source === nodeId) {
      const target = nodesById.get(link.target)
      if (target) outgoing.push(target)
    }
    if (link.target === nodeId) {
      const source = nodesById.get(link.source)
      if (source) incoming.push(source)
    }
  }

  const byTitle = (left: GraphNode, right: GraphNode) =>
    left.title.localeCompare(right.title, 'zh-CN')
  outgoing.sort(byTitle)
  incoming.sort(byTitle)
  return { outgoing, incoming }
}

export function searchGraphNodes(nodes: GraphNode[], query: string, limit = 8): GraphNode[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return []

  return nodes
    .filter((node) =>
      `${node.title}\n${node.category}\n${node.tags.join('\n')}`
        .toLocaleLowerCase()
        .includes(normalized)
    )
    .sort((left, right) => {
      const leftStarts = left.title.toLocaleLowerCase().startsWith(normalized)
      const rightStarts = right.title.toLocaleLowerCase().startsWith(normalized)
      if (leftStarts !== rightStarts) return leftStarts ? -1 : 1
      return left.title.localeCompare(right.title, 'zh-CN')
    })
    .slice(0, limit)
}

export function countGraph(graph: SerializedGraph) {
  const connected = getConnectedNodeIds(graph)
  return {
    total: graph.nodes.length,
    connected: connected.size,
    isolated: graph.nodes.length - connected.size,
    links: graph.links.length,
  }
}

export function hasLink(link: GraphLink, source: string, target: string): boolean {
  return link.source === source && link.target === target
}
