/**
 * SIMPLIFIED PAGERANK
 *
 * Original PageRank: PR(A) = (1-d)/N + d × Σ PR(B)/L(B)
 * Where:
 *   d = damping factor (0.85)
 *   N = total number of notes
 *   B = all notes that link TO A (incoming links)
 *   L(B) = number of outgoing links from B
 *
 * We run this iteratively until convergence (change < epsilon).
 *
 * COMPLEXITY: O(iterations × (V + E))
 *             Typically converges in 20–50 iterations.
 */

import type { NoteGraph } from './graph';

const DAMPING = 0.85;
const MAX_ITERATIONS = 50;
const EPSILON = 1e-6;

export function computePageRank(
  graph: NoteGraph,
  noteIds: string[]
): Map<string, number> {
  const N = noteIds.length;
  if (N === 0) return new Map();

  let scores = new Map<string, number>();
  for (const id of noteIds) scores.set(id, 1 / N);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const newScores = new Map<string, number>();
    let totalDiff = 0;

    for (const id of noteIds) {
      const incoming = graph.getIncoming(id);
      let rank = (1 - DAMPING) / N;

      for (const sourceId of incoming) {
        const sourceOutCount = graph.getOutgoing(sourceId).length;
        if (sourceOutCount > 0) {
          rank += DAMPING * (scores.get(sourceId)! / sourceOutCount);
        }
      }

      newScores.set(id, rank);
      totalDiff += Math.abs(rank - scores.get(id)!);
    }

    scores = newScores;
    if (totalDiff < EPSILON) break;
  }

  // Normalize to [0, 1] range for display
  const maxScore = Math.max(...scores.values());
  if (maxScore > 0) {
    for (const [id, score] of scores) {
      scores.set(id, score / maxScore);
    }
  }

  return scores;
}
