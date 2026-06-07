import { useNoteStore } from '../store/noteStore';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Link2, Zap } from 'lucide-react';

interface BacklinksPanelProps {
  noteId: string;
}

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const { graph, notes } = useNoteStore();
  const navigate = useNavigate();

  const incomingIds = graph.getIncoming(noteId);
  const outgoingIds = graph.getOutgoing(noteId);

  // BFS: notes within 2 hops
  const reachable = graph.bfsReachable(noteId, 2);
  const nearbyIds = Array.from(reachable.entries())
    .filter(([id, depth]) => depth > 0 && id !== noteId)
    .sort((a, b) => a[1] - b[1]);

  const getNoteTitle = (id: string) => notes.find(n => n.id === id)?.title || 'Untitled';
  const getNoteScore = (id: string) => notes.find(n => n.id === id)?.pageRankScore || 0;

  return (
    <div className="flex flex-col gap-6 p-5">
      {/* Backlinks */}
      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-gray-400">
          <Link2 size={12} />
          <span>Backlinks</span>
          <span className="ml-auto bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{incomingIds.length}</span>
        </h3>
        {incomingIds.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-100/40 border border-gray-100 rounded-lg p-3 text-center">No notes link to this one yet</p>
        ) : (
          <ul className="space-y-1">
            {incomingIds.map(id => (
              <li key={id}>
                <button
                  className="w-full text-left flex justify-between items-center text-xs py-1.5 px-2.5 rounded hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                  onClick={() => navigate(`/note/${id}`)}
                >
                  <span className="truncate flex-1 font-serif pr-2">{getNoteTitle(id)}</span>
                  <span className="text-[10px] text-orange-600 bg-orange-50 font-bold px-1 rounded">
                    {(getNoteScore(id) * 100).toFixed(0)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Outgoing Links */}
      <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-gray-400">
          <ArrowUpRight size={12} />
          <span>Outgoing Links</span>
          <span className="ml-auto bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{outgoingIds.length}</span>
        </h3>
        {outgoingIds.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-100/40 border border-gray-100 rounded-lg p-3 text-center">This note doesn't link to any notes</p>
        ) : (
          <ul className="space-y-1">
            {outgoingIds.map(id => (
              <li key={id}>
                <button
                  className="w-full text-left flex justify-between items-center text-xs py-1.5 px-2.5 rounded hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                  onClick={() => navigate(`/note/${id}`)}
                >
                  <span className="truncate flex-1 font-serif pr-2">{getNoteTitle(id)}</span>
                  <ArrowUpRight size={10} className="text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Nearby (BFS 2-hop) */}
      {nearbyIds.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-gray-400">
            <Zap size={12} />
            <span>Nearby Notes</span>
            <span className="ml-auto bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{nearbyIds.length}</span>
          </h3>
          <ul className="space-y-1">
            {nearbyIds.slice(0, 10).map(([id, depth]) => (
              <li key={id}>
                <button
                  className="w-full text-left flex justify-between items-center text-xs py-1.5 px-2.5 rounded hover:bg-gray-200/50 text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                  onClick={() => navigate(`/note/${id}`)}
                >
                  <span className="truncate flex-1 font-serif pr-2">{getNoteTitle(id)}</span>
                  <span className="text-[10px] text-gray-400">{depth} hop{depth > 1 ? 's' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
