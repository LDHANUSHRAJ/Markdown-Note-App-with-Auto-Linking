import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { BacklinksPanel } from '../components/BacklinksPanel';
import { PageRankBadge } from '../components/PageRankBadge';
import {
  ArrowLeft,
  Eye,
  Edit3,
  Columns,
  Trash2,
  Network,
  Save,
  FileText,
} from 'lucide-react';

type ViewMode = 'edit' | 'preview' | 'split';

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, folders, initialized, initialize, saveNoteContent, deleteNote, graph } = useNoteStore();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showBacklinks, setShowBacklinks] = useState(true);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const note = notes.find(n => n.id === id);
  const folder = note ? folders.find(f => f.id === note.folderId) : null;

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note?.id]); // Only reset when note ID changes

  const debouncedSave = useCallback(
    (newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (id) {
          setSaving(true);
          await saveNoteContent(id, newContent);
          setTimeout(() => setSaving(false), 500);
        }
      }, 1000);
    },
    [id, saveNoteContent]
  );

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave(newContent);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      await deleteNote(id);
      navigate('/');
    }
  };

  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="editor-not-found">
        <FileText size={48} strokeWidth={1} />
        <h2>Note not found</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Back to Notes
        </button>
      </div>
    );
  }

  const linkCount = graph.getLinkCount(note.id);

  return (
    <div className="editor-page flex flex-col h-full bg-white">
      {/* Top Bar */}
      <header className="h-11 border-b border-gray-200 bg-white flex justify-between items-center px-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">
            {folder ? folder.name : 'Root'} / {note.title}
          </span>
          <PageRankBadge score={note.pageRankScore} size="sm" />
          {saving && <span className="text-[11px] text-gray-400 animate-pulse">Saving...</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-gray-400 font-medium flex gap-2">
            <span>{note.wordCount} words</span>
            <span>·</span>
            <span>{linkCount} links</span>
          </div>
          <div className="flex items-center bg-gray-100 rounded p-0.5">
            <button
              className={`px-2 py-0.5 rounded text-xs transition-colors ${viewMode === 'edit' ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setViewMode('edit')}
              title="Edit mode"
            >
              Edit
            </button>
            <button
              className={`px-2 py-0.5 rounded text-xs transition-colors ${viewMode === 'split' ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setViewMode('split')}
              title="Split mode"
            >
              Split
            </button>
            <button
              className={`px-2 py-0.5 rounded text-xs transition-colors ${viewMode === 'preview' ? 'bg-white text-gray-800 font-medium shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => setViewMode('preview')}
              title="Preview mode"
            >
              Preview
            </button>
          </div>
          <button
            className={`p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors ${showBacklinks ? 'bg-gray-100 text-gray-800' : ''}`}
            onClick={() => setShowBacklinks(!showBacklinks)}
            title="Toggle backlinks"
          >
            <Network size={14} />
          </button>
          <button className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors" onClick={handleDelete} title="Delete note">
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="editor-content">
        <div className="flex h-full w-full overflow-hidden">
          {/* Editor / Preview */}
          <div className="flex-1 flex overflow-hidden">
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`flex flex-col h-full bg-white ${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5 text-xs text-gray-400 font-semibold select-none shrink-0">
                  <Edit3 size={12} />
                  <span>Editor</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <MarkdownEditor
                    content={content}
                    noteId={note.id}
                    onChange={handleContentChange}
                  />
                </div>
              </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={`flex flex-col h-full bg-white ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5 text-xs text-gray-400 font-semibold select-none shrink-0">
                  <Eye size={12} />
                  <span>Preview</span>
                </div>
                <div className="flex-1 overflow-auto bg-white">
                  <MarkdownPreview content={content} noteId={note.id} />
                </div>
              </div>
            )}
          </div>

          {/* Backlinks Panel */}
          {showBacklinks && (
            <aside className="w-80 border-l border-gray-200 bg-gray-50/50 overflow-y-auto select-none">
              <BacklinksPanel noteId={note.id} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
