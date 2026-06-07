import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import { NoteList } from '../components/NoteList';
import { Plus, Search, Network, FileText, TrendingUp, Link2 } from 'lucide-react';

export function Home() {
  const { notes, initialized, initialize, createNote, searchQuery, setSearchQuery, getFilteredNotes } = useNoteStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const note = await createNote(newTitle.trim());
    setNewTitle('');
    setShowCreateModal(false);
    navigate(`/note/${note.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') setShowCreateModal(false);
  };

  const filteredNotes = getFilteredNotes();
  const totalWords = notes.reduce((sum, n) => sum + n.wordCount, 0);
  const totalLinks = notes.reduce((sum, n) => sum + useNoteStore.getState().graph.getOutgoing(n.id).length, 0);
  const topNote = [...notes].sort((a, b) => b.pageRankScore - a.pageRankScore)[0];

  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="home-page max-w-4xl mx-auto px-8 py-12 flex flex-col gap-8 overflow-y-auto h-full">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Dhanush Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">Interconnected notes & thoughts, managed with PageRank & autocomplete</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Note
        </button>
      </header>

      {/* Stats */}
      {notes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 transition-all hover:bg-gray-100/60">
            <span className="text-2xl font-semibold text-gray-900">{notes.length}</span>
            <span className="text-xs text-gray-500 font-medium">Total Notes</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 transition-all hover:bg-gray-100/60">
            <span className="text-2xl font-semibold text-gray-900">{totalLinks}</span>
            <span className="text-xs text-gray-500 font-medium">Inter-links</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 transition-all hover:bg-gray-100/60">
            <span className="text-2xl font-semibold text-gray-900">{totalWords.toLocaleString()}</span>
            <span className="text-xs text-gray-500 font-medium">Words Written</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 transition-all hover:bg-gray-100/60">
            <span className="text-lg font-semibold text-gray-900 truncate" title={topNote?.title}>{topNote?.title || '—'}</span>
            <span className="text-xs text-gray-500 font-medium">Hub Note (PageRank)</span>
          </div>
        </div>
      )}

      {/* Note List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">All Active Notes</h2>
          {searchQuery && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {filteredNotes.length} search result{filteredNotes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <NoteList notes={filteredNotes} />
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Note</h2>
            <input
              type="text"
              placeholder="Note title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={!newTitle.trim()}>
                <Plus size={16} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
