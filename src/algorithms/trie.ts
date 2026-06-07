/**
 * TRIE — O(L) insert and prefix search, where L = title length
 *
 * Used to detect note title mentions as the user types in the editor.
 * On every keystroke, we extract the last N words and check the trie
 * for any note title that starts with that text.
 *
 * WHY TRIE OVER REGEX:
 * With 1000+ notes, building a new regex from all titles on every keystroke
 * is O(total_title_chars) per keystroke. Trie builds once, queries in O(L).
 *
 * INTERVIEW: Trie node has children: Map<char, TrieNode> and noteId at leaf.
 * Insert: O(L). Search: O(L). Space: O(ALPHABET × total_title_chars).
 */

interface TrieNode {
  children: Map<string, TrieNode>;
  noteId: string | null;
  title: string | null;
}

export class NoteTrie {
  private root: TrieNode = { children: new Map(), noteId: null, title: null };

  insert(noteId: string, title: string): void {
    let node = this.root;
    for (const char of title.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, { children: new Map(), noteId: null, title: null });
      }
      node = node.children.get(char)!;
    }
    node.noteId = noteId;
    node.title = title;
  }

  delete(title: string): void {
    this._delete(this.root, title.toLowerCase(), 0);
  }

  private _delete(node: TrieNode, title: string, depth: number): boolean {
    if (depth === title.length) {
      node.noteId = null;
      node.title = null;
      return node.children.size === 0;
    }
    const char = title[depth];
    if (!node.children.has(char)) return false;
    const shouldDelete = this._delete(node.children.get(char)!, title, depth + 1);
    if (shouldDelete) node.children.delete(char);
    return node.children.size === 0 && !node.noteId;
  }

  searchPrefix(prefix: string): Array<{ noteId: string; title: string }> {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }
    return this._collectAll(node);
  }

  exactMatch(title: string): string | null {
    let node = this.root;
    for (const char of title.toLowerCase()) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char)!;
    }
    return node.noteId;
  }

  private _collectAll(node: TrieNode): Array<{ noteId: string; title: string }> {
    const results: Array<{ noteId: string; title: string }> = [];
    if (node.noteId && node.title) results.push({ noteId: node.noteId, title: node.title });
    for (const child of node.children.values()) {
      results.push(...this._collectAll(child));
    }
    return results;
  }

  rebuild(notes: Array<{ id: string; title: string }>): void {
    this.root = { children: new Map(), noteId: null, title: null };
    for (const note of notes) this.insert(note.id, note.title);
  }
}
