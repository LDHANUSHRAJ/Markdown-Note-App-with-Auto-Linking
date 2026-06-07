/**
 * AUTO-LINKING PIPELINE
 *
 * On every note save:
 * 1. Scan content for mentions of other note titles (using Trie)
 * 2. Compare new links vs old links
 * 3. Update graph edges (remove old, add new)
 * 4. Re-run PageRank for all affected notes
 * 5. Return rendered HTML with [[title]] converted to clickable links
 *
 * TRIE USAGE:
 * We match [[Note Title]] syntax and check trie for exact matches.
 * Trie.exactMatch(phrase) → O(L) per attempt.
 */

import { NoteTrie } from './trie';
import { NoteGraph } from './graph';

export function detectLinks(
  content: string,
  trie: NoteTrie,
  currentNoteId: string
): Array<{ noteId: string; title: string; startIndex: number; endIndex: number }> {
  const links: Array<{ noteId: string; title: string; startIndex: number; endIndex: number }> = [];

  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const mentionedTitle = match[1].trim();
    const noteId = trie.exactMatch(mentionedTitle);

    if (noteId && noteId !== currentNoteId) {
      links.push({
        noteId,
        title: mentionedTitle,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  return links;
}

export function renderWithLinks(
  content: string,
  trie: NoteTrie,
  _currentNoteId: string
): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_match, title) => {
    const noteId = trie.exactMatch(title.trim());
    if (noteId) {
      return `<a class="note-link resolved" data-note-id="${noteId}">${title}</a>`;
    }
    return `<a class="note-link unresolved" title="Note not found">${title}</a>`;
  });
}

export function updateGraphLinks(
  noteId: string,
  newLinks: Array<{ noteId: string }>,
  graph: NoteGraph
): void {
  graph.removeEdgesFrom(noteId);
  for (const link of newLinks) {
    graph.addEdge(noteId, link.noteId);
  }
}
