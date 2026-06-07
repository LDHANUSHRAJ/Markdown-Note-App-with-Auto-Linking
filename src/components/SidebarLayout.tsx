import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import { 
  Folder, 
  FolderPlus,
  Plus, 
  Search, 
  Network, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  ChevronLeft,
  LogOut,
  Database
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { 
    notes, 
    folders,
    workspaces,
    currentWorkspaceId,
    initialized, 
    initialize, 
    createNote, 
    createFolder,
    deleteFolder,
    createWorkspace,
    selectWorkspace,
    searchQuery, 
    setSearchQuery, 
    clearAllData
  } = useNoteStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Portal local states
  const [newWsName, setNewWsName] = useState('');

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    const note = await createNote(newNoteTitle.trim(), targetFolderId);
    setNewNoteTitle('');
    setTargetFolderId(null);
    setShowCreateNoteModal(false);
    navigate(`/note/${note.id}`);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folder = await createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreateFolderModal(false);
    setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));
  };

  const handleCreateWorkspacePortal = async () => {
    if (!newWsName.trim()) return;
    const ws = await createWorkspace(newWsName.trim());
    setNewWsName('');
    await selectWorkspace(ws.id);
    navigate('/');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const isGraphActive = location.pathname === '/graph';

  // Loading Screen
  if (!initialized) {
    return (
      <div className="loading-screen flex flex-col items-center justify-center h-screen w-screen bg-white">
        <div className="loading-spinner mb-2 border-t-orange-600" />
        <p className="text-sm text-gray-500 font-medium">Opening Knowledge Base Portal...</p>
      </div>
    );
  }

  // Workspace Gateway Portal Screen
  if (!currentWorkspaceId) {
    return (
      <div className="flex h-screen w-screen bg-gray-50/50 justify-center items-center font-sans p-6 select-none">
        <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 animate-fadeIn">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">NoteGraph Vaults</h1>
            <p className="text-xs text-gray-500 font-medium">Select or create an isolated knowledge base</p>
          </div>

          {/* List of existing workspaces */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Vaults</h2>
            {workspaces.length === 0 ? (
              <div className="text-xs text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No vaults created yet.
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws.id)}
                  className="w-full flex items-center justify-between p-3.5 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/20 text-gray-700 hover:text-orange-950 font-medium rounded-xl text-xs text-left transition-all cursor-pointer group"
                >
                  <span className="truncate flex-1 font-serif pr-2">{ws.name}</span>
                  <Database size={12} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Create New Vault</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Vault name (e.g. CS Prep)..."
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspacePortal()}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition"
              />
              <button
                onClick={handleCreateWorkspacePortal}
                disabled={!newWsName.trim()}
                className="btn-primary text-xs shrink-0 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                <Plus size={14} />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Organize notes and folders dynamically
  const rootNotes = notes.filter(n => !n.folderId);
  const activeWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-800 font-sans">
      {/* Left Sidebar */}
      <aside 
        className={`flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 select-none ${
          isCollapsed ? 'w-12' : 'w-64'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 p-2 h-11 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 pl-1.5 w-full">
              <button 
                onClick={() => {
                  setTargetFolderId(null);
                  setShowCreateNoteModal(true);
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                title="New Note"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => setShowCreateFolderModal(true)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                title="New Folder"
              >
                <FolderPlus size={16} />
              </button>
              <button 
                onClick={() => navigate('/graph')}
                className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                  isGraphActive ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Graph View"
              >
                <Network size={16} />
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors ml-auto"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {/* Active Vault Label */}
            <div className="px-1.5 flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider shrink-0 border-b border-gray-100 pb-2">
              <span className="truncate">{activeWorkspace?.name || 'Vault'}</span>
            </div>

            {/* Quick Search */}
            <div className="relative flex items-center mb-3 px-1">
              <Search size={14} className="absolute left-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-8 pr-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition"
              />
            </div>

            {/* Folder list */}
            <div className="space-y-1 text-[13px]">
              {folders.map(folder => {
                const isExpanded = !!expandedFolders[folder.id];
                const folderNotes = notes.filter(n => n.folderId === folder.id);
                return (
                  <div key={folder.id} className="space-y-0.5">
                    {/* Folder Header */}
                    <div 
                      className="flex items-center gap-1 py-1 px-1.5 hover:bg-gray-200/60 rounded cursor-pointer text-gray-600 font-medium transition-colors group relative"
                    >
                      <div onClick={() => toggleFolder(folder.id)} className="flex items-center gap-1 flex-1 min-w-0">
                        {isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                        <Folder size={14} className="text-amber-500/80 fill-amber-500/10 shrink-0" />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      
                      {/* Action buttons on hover */}
                      <div className="hidden group-hover:flex items-center gap-1 absolute right-1.5 bg-gray-50/90 pl-1 rounded">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetFolderId(folder.id);
                            setShowCreateNoteModal(true);
                          }}
                          className="p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                          title="Add note to folder"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete folder "${folder.name}"? Notes inside will be moved to root.`)) {
                              deleteFolder(folder.id);
                            }
                          }}
                          className="p-0.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                          title="Delete folder"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Folder Contents */}
                    {isExpanded && (
                      <div className="pl-4 border-l border-gray-200/60 ml-3 space-y-0.5 animate-fadeIn">
                        {folderNotes.length === 0 ? (
                          <div className="text-gray-400 py-1 px-1.5 italic text-xs">No notes</div>
                        ) : (
                          folderNotes.map(n => {
                            const isActive = n.id === id;
                            return (
                              <div 
                                key={n.id}
                                onClick={() => navigate(`/note/${n.id}`)}
                                className={`flex items-center justify-between group py-1 px-2 rounded cursor-pointer transition-colors ${
                                  isActive 
                                    ? 'bg-orange-50 text-orange-700 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                                }`}
                              >
                                <span className="truncate flex-1">{n.title}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Root Notes */}
              {rootNotes.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-0.5">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1.5 py-1">Root Notes</div>
                  {rootNotes.map(n => {
                    const isActive = n.id === id;
                    return (
                      <div 
                        key={n.id}
                        onClick={() => navigate(`/note/${n.id}`)}
                        className={`flex items-center justify-between group py-1 px-2 rounded cursor-pointer transition-colors ${
                          isActive 
                            ? 'bg-orange-50 text-orange-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                        }`}
                      >
                        <span className="truncate flex-1">{n.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-2 shrink-0 flex items-center justify-between text-xs text-gray-500">
            <span className="truncate font-medium">Knowledge Base</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => navigate('/')}
                className="p-1 hover:bg-gray-200 rounded font-medium text-gray-500 hover:text-gray-700" 
                title="Go to Home"
              >
                <BookOpen size={14} />
              </button>
              <button 
                onClick={async () => {
                  if (confirm('Are you sure you want to delete all notes and folders in this vault? This cannot be undone.')) {
                    await clearAllData();
                    navigate('/');
                  }
                }}
                className="p-1 hover:bg-red-50 hover:text-red-600 rounded" 
                title="Reset Vault"
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={() => selectWorkspace(null)}
                className="p-1 hover:bg-orange-50 hover:text-orange-600 rounded" 
                title="Switch Vault / Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {children}
      </main>

      {/* Create Note Modal */}
      {showCreateNoteModal && (
        <div className="modal-overlay" onClick={() => setShowCreateNoteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Note</h2>
            <input
              type="text"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateNoteModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
                <Plus size={16} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="modal-overlay" onClick={() => setShowCreateFolderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="modal-input"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateFolderModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
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
