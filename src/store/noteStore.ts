import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Note, Folder, Workspace } from '../types';
import { 
  initDB, 
  getAllNotes, 
  saveNote, 
  deleteNoteFromDB, 
  getAllFolders, 
  saveFolder, 
  deleteFolderFromDB,
  getAllWorkspaces,
  saveWorkspace,
  deleteWorkspaceFromDB
} from '../db/indexeddb';
import { NoteTrie } from '../algorithms/trie';
import { NoteGraph } from '../algorithms/graph';
import { computePageRank } from '../algorithms/pagerank';
import { detectLinks, updateGraphLinks } from '../algorithms/autolink';
import type { IDBPDatabase } from 'idb';

interface NoteStore {
  notes: Note[];
  folders: Folder[];
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  trie: NoteTrie;
  graph: NoteGraph;
  db: IDBPDatabase | null;
  initialized: boolean;
  searchQuery: string;

  initialize: () => Promise<void>;
  loadWorkspaceData: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  selectWorkspace: (id: string | null) => Promise<void>;
  createNote: (title: string, folderId?: string | null) => Promise<Note>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  saveNoteContent: (id: string, content: string) => Promise<void>;
  getPageRankScores: () => Map<string, number>;
  setSearchQuery: (query: string) => void;
  getFilteredNotes: () => Note[];
  clearAllData: () => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  folders: [],
  workspaces: [],
  currentWorkspaceId: null,
  trie: new NoteTrie(),
  graph: new NoteGraph(),
  db: null,
  initialized: false,
  searchQuery: '',

  initialize: async () => {
    const db = await initDB();
    const workspaces = await getAllWorkspaces(db);
    const savedWorkspaceId = localStorage.getItem('current_workspace_id');
    const currentWorkspaceId = workspaces.find(w => w.id === savedWorkspaceId) ? savedWorkspaceId : null;

    set({ workspaces, currentWorkspaceId, db, initialized: true });

    if (currentWorkspaceId) {
      await get().loadWorkspaceData(currentWorkspaceId);
    }
  },

  loadWorkspaceData: async (workspaceId: string) => {
    const { db } = get();
    if (!db) return;

    const allNotes = await getAllNotes(db);
    const allFolders = await getAllFolders(db);

    const notes = allNotes.filter(n => n.workspaceId === workspaceId);
    const folders = allFolders.filter(f => f.workspaceId === workspaceId);

    const trie = new NoteTrie();
    const graph = new NoteGraph();

    for (const note of notes) {
      trie.insert(note.id, note.title);
      graph.addNode(note.id);
    }

    for (const note of notes) {
      const links = detectLinks(note.content, trie, note.id);
      for (const link of links) graph.addEdge(note.id, link.noteId);
    }

    const scores = computePageRank(graph, notes.map(n => n.id));
    const updatedNotes = notes.map(n => ({
      ...n,
      pageRankScore: scores.get(n.id) || 0
    }));

    set({ notes: updatedNotes, folders, trie, graph });
  },

  createWorkspace: async (name: string) => {
    const { db, workspaces } = get();
    const ws: Workspace = {
      id: nanoid(),
      name,
      createdAt: Date.now()
    };
    await saveWorkspace(db!, ws);
    set({ workspaces: [...workspaces, ws] });
    return ws;
  },

  selectWorkspace: async (id: string | null) => {
    if (id) {
      localStorage.setItem('current_workspace_id', id);
      set({ currentWorkspaceId: id });
      await get().loadWorkspaceData(id);
    } else {
      localStorage.removeItem('current_workspace_id');
      set({ currentWorkspaceId: null, notes: [], folders: [], trie: new NoteTrie(), graph: new NoteGraph() });
    }
  },

  createFolder: async (name: string, parentId: string | null = null) => {
    const { db, folders, currentWorkspaceId } = get();
    if (!currentWorkspaceId) throw new Error("No active workspace selection");

    const folder: Folder = {
      id: nanoid(),
      name,
      parentId,
      createdAt: Date.now(),
      workspaceId: currentWorkspaceId
    };
    await saveFolder(db!, folder);
    set({ folders: [...folders, folder] });
    return folder;
  },

  createNote: async (title: string, folderId: string | null = null) => {
    const { db, trie, graph, notes, currentWorkspaceId } = get();
    if (!currentWorkspaceId) throw new Error("No active workspace selection");

    const note: Note = {
      id: nanoid(),
      title,
      content: `# ${title}\n\n`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      wordCount: 0,
      pageRankScore: 0,
      folderId,
      workspaceId: currentWorkspaceId
    };

    await saveNote(db!, note);
    trie.insert(note.id, note.title);
    graph.addNode(note.id);
    set({ notes: [...notes, note] });
    return note;
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const { db, notes, trie } = get();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // If title changed, update trie
    if (updates.title && updates.title !== note.title) {
      trie.delete(note.title);
      trie.insert(note.id, updates.title);
    }

    const updated = { ...note, ...updates, updatedAt: Date.now() };
    await saveNote(db!, updated);
    set({ notes: notes.map(n => n.id === id ? updated : n) });
  },

  saveNoteContent: async (id: string, content: string) => {
    const { db, trie, graph, notes } = get();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updated: Note = {
      ...note,
      content,
      updatedAt: Date.now(),
      wordCount: content.split(/\s+/).filter(Boolean).length
    };

    const links = detectLinks(content, trie, id);
    updateGraphLinks(id, links, graph);

    const allIds = notes.map(n => n.id);
    const scores = computePageRank(graph, allIds);

    await saveNote(db!, updated);

    set({
      notes: notes.map(n => ({
        ...n,
        pageRankScore: scores.get(n.id) || 0,
        ...(n.id === id ? updated : {})
      }))
    });
  },

  deleteNote: async (id: string) => {
    const { db, trie, graph, notes } = get();
    const note = notes.find(n => n.id === id);
    if (!note) return;

    await deleteNoteFromDB(db!, id);
    trie.delete(note.title);
    graph.removeNode(id);

    const remaining = notes.filter(n => n.id !== id);
    const scores = computePageRank(graph, remaining.map(n => n.id));
    set({
      notes: remaining.map(n => ({
        ...n,
        pageRankScore: scores.get(n.id) || 0
      }))
    });
  },

  deleteFolder: async (id: string) => {
    const { db, folders, notes } = get();
    await deleteFolderFromDB(db!, id);
    
    // Also dissociate or delete notes in folder - we dissociate them to root
    const updatedNotes = notes.map(n => n.folderId === id ? { ...n, folderId: null } : n);
    for (const note of updatedNotes) {
      if (note.folderId === null) {
        await saveNote(db!, note);
      }
    }

    // Recursively handle subfolders (dissociate parentId)
    const updatedFolders = folders
      .filter(f => f.id !== id)
      .map(f => f.parentId === id ? { ...f, parentId: null } : f);
    for (const folder of updatedFolders) {
      if (folder.parentId === null) {
        await saveFolder(db!, folder);
      }
    }

    set({ folders: updatedFolders, notes: updatedNotes });
  },

  getPageRankScores: () => {
    const { graph, notes } = get();
    return computePageRank(graph, notes.map(n => n.id));
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getFilteredNotes: () => {
    const { notes, searchQuery } = get();
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  },

  clearAllData: async () => {
    const { db } = get();
    if (!db) return;
    const tx = db.transaction(['notes', 'folders', 'links'], 'readwrite');
    await tx.objectStore('notes').clear();
    await tx.objectStore('folders').clear();
    await tx.objectStore('links').clear();
    await tx.done;
    set({
      notes: [],
      folders: [],
      trie: new NoteTrie(),
      graph: new NoteGraph()
    });
  }
}));
