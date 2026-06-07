/**
 * BIDIRECTIONAL ADJACENCY LIST GRAPH
 *
 * Nodes = notes (by ID)
 * Edges = auto-detected links (note A mentions note B's title)
 *
 * Stores BOTH directions:
 * - outgoing[A] = [B, C]   → A links to B and C
 * - incoming[B] = [A]      → B is mentioned by A (backlinks)
 *
 * Operations:
 * - addEdge(from, to): O(1)
 * - removeEdgesFrom(noteId): O(degree) — when note content changes
 * - getBacklinks(noteId): O(1) — for backlinks panel
 * - BFS/DFS for reachability
 *
 * INTERVIEW: Adjacency list vs matrix — list is O(V+E) space vs O(V²).
 * For sparse note graphs (most notes link to <10 others), list wins.
 */

export class NoteGraph {
  private outgoing: Map<string, Set<string>> = new Map();
  private incoming: Map<string, Set<string>> = new Map();

  addNode(id: string): void {
    if (!this.outgoing.has(id)) this.outgoing.set(id, new Set());
    if (!this.incoming.has(id)) this.incoming.set(id, new Set());
  }

  removeNode(id: string): void {
    const outs = this.outgoing.get(id) || new Set();
    for (const target of outs) this.incoming.get(target)?.delete(id);
    this.outgoing.delete(id);

    const ins = this.incoming.get(id) || new Set();
    for (const source of ins) this.outgoing.get(source)?.delete(id);
    this.incoming.delete(id);
  }

  addEdge(from: string, to: string): void {
    if (from === to) return;
    this.outgoing.get(from)?.add(to);
    this.incoming.get(to)?.add(from);
  }

  removeEdgesFrom(noteId: string): void {
    const outs = this.outgoing.get(noteId) || new Set();
    for (const target of outs) this.incoming.get(target)?.delete(noteId);
    this.outgoing.set(noteId, new Set());
  }

  getOutgoing(id: string): string[] {
    return Array.from(this.outgoing.get(id) || []);
  }

  getIncoming(id: string): string[] {
    return Array.from(this.incoming.get(id) || []);
  }

  getLinkCount(id: string): number {
    return (this.outgoing.get(id)?.size || 0) + (this.incoming.get(id)?.size || 0);
  }

  bfsReachable(startId: string, maxDepth: number = 3): Map<string, number> {
    const visited = new Map<string, number>();
    const queue: Array<[string, number]> = [[startId, 0]];
    visited.set(startId, 0);

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = [
        ...this.getOutgoing(current),
        ...this.getIncoming(current)
      ];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, depth + 1);
          queue.push([neighbor, depth + 1]);
        }
      }
    }
    return visited;
  }

  toForceGraphData(): { nodes: Array<{ id: string }>; links: Array<{ source: string; target: string }> } {
    const nodes: Array<{ id: string }> = [];
    const links: Array<{ source: string; target: string }> = [];
    const seen = new Set<string>();

    for (const [from, tos] of this.outgoing) {
      if (!seen.has(from)) { nodes.push({ id: from }); seen.add(from); }
      for (const to of tos) {
        if (!seen.has(to)) { nodes.push({ id: to }); seen.add(to); }
        links.push({ source: from, target: to });
      }
    }

    // Add isolated nodes
    for (const id of this.outgoing.keys()) {
      if (!seen.has(id)) { nodes.push({ id }); seen.add(id); }
    }

    return { nodes, links };
  }

  getAllNodeIds(): string[] {
    return Array.from(this.outgoing.keys());
  }
}
