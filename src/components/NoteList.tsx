import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import { PageRankBadge } from './PageRankBadge';
import { FileText, Clock, Link2 } from 'lucide-react';
import type { Note } from '../types';

interface NoteListProps {
  notes: Note[];
}

export function NoteList({ notes }: NoteListProps) {
  const navigate = useNavigate();
  const { graph } = useNoteStore();

  const sortedNotes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    return lines.slice(0, 2).join(' ').slice(0, 120) || 'Empty note...';
  };

  if (sortedNotes.length === 0) {
    return (
      <div className="note-list-empty">
        <FileText size={48} strokeWidth={1} />
        <p>No notes yet</p>
        <p className="note-list-empty-sub">Create your first note to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedNotes.map(note => {
        const linkCount = graph.getLinkCount(note.id);
        return (
          <button
            key={note.id}
            className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-orange-200 bg-white hover:bg-orange-50/20 transition-all flex flex-col gap-2 group cursor-pointer"
            onClick={() => navigate(`/note/${note.id}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 group-hover:text-orange-700 transition-colors">{note.title}</h3>
              <PageRankBadge score={note.pageRankScore} size="sm" />
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{getPreview(note.content)}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium pt-1">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDate(note.updatedAt)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {note.wordCount} words
              </span>
              {linkCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-orange-600">
                    <Link2 size={12} />
                    {linkCount} links
                  </span>
                </>
              )}
              {note.tags.map(tag => (
                <span key={tag} className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded text-[10px]">#{tag}</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
