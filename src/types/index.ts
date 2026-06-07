export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // For nested folders
  createdAt: number;
  workspaceId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  wordCount: number;
  pageRankScore: number;
  folderId: string | null; // Folder association
  workspaceId: string;
}

export interface NoteLink {
  sourceId: string;
  targetId: string;
  mentionedTitle: string;
}

export interface GraphNode {
  id: string;
  title: string;
  pageRankScore: number;
  linkCount: number;
  type?: 'note' | 'folder';
}

export interface GraphEdge {
  source: string;
  target: string;
}
