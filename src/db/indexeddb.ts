import { openDB, type IDBPDatabase } from 'idb';
import type { Note, NoteLink, Folder, Workspace } from '../types';

const DB_NAME = 'markdown-notes-db';
const DB_VERSION = 3;

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('updatedAt', 'updatedAt');
        noteStore.createIndex('title', 'title');
      }
      if (!db.objectStoreNames.contains('links')) {
        const linkStore = db.createObjectStore('links', {
          keyPath: 'id',
          autoIncrement: true
        });
        linkStore.createIndex('sourceId', 'sourceId');
        linkStore.createIndex('targetId', 'targetId');
      }
      if (!db.objectStoreNames.contains('folders')) {
        db.createObjectStore('folders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('workspaces')) {
        db.createObjectStore('workspaces', { keyPath: 'id' });
      }
    }
  });
}

export async function getAllNotes(db: IDBPDatabase): Promise<Note[]> {
  return db.getAll('notes');
}

export async function saveNote(db: IDBPDatabase, note: Note): Promise<void> {
  await db.put('notes', note);
}

export async function deleteNoteFromDB(db: IDBPDatabase, id: string): Promise<void> {
  await db.delete('notes', id);
}

export async function getAllFolders(db: IDBPDatabase): Promise<Folder[]> {
  return db.getAll('folders');
}

export async function saveFolder(db: IDBPDatabase, folder: Folder): Promise<void> {
  await db.put('folders', folder);
}

export async function deleteFolderFromDB(db: IDBPDatabase, id: string): Promise<void> {
  await db.delete('folders', id);
}

export async function getAllWorkspaces(db: IDBPDatabase): Promise<Workspace[]> {
  return db.getAll('workspaces');
}

export async function saveWorkspace(db: IDBPDatabase, ws: Workspace): Promise<void> {
  await db.put('workspaces', ws);
}

export async function deleteWorkspaceFromDB(db: IDBPDatabase, id: string): Promise<void> {
  await db.delete('workspaces', id);
}

export async function saveLinks(
  db: IDBPDatabase,
  sourceId: string,
  links: NoteLink[]
): Promise<void> {
  const tx = db.transaction('links', 'readwrite');
  const oldLinks = await tx.store.index('sourceId').getAllKeys(sourceId);
  for (const key of oldLinks) await tx.store.delete(key);
  for (const link of links) await tx.store.add(link);
  await tx.done;
}

export async function getBacklinks(
  db: IDBPDatabase,
  targetId: string
): Promise<NoteLink[]> {
  return db.getAllFromIndex('links', 'targetId', targetId);
}
