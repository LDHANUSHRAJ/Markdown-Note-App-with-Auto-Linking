import { useEffect, useState, useRef } from 'react';
import { useNoteStore } from '../store/noteStore';
import { GraphCanvas } from '../components/GraphCanvas';

export function GraphView() {
  const { notes, initialized, initialize } = useNoteStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading graph data...</p>
      </div>
    );
  }

  return (
    <div className="graph-page flex flex-col h-full bg-white select-none">
      <header className="h-11 border-b border-gray-200 bg-white flex justify-between items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Graph view</span>
        </div>
        <div className="text-[11px] text-gray-400 font-medium">
          {notes.length} nodes
        </div>
      </header>

      <div className="graph-container flex-1 bg-white relative" ref={containerRef}>
        <GraphCanvas width={dimensions.width} height={dimensions.height} />
        
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
          <div className="flex gap-4 bg-white/95 border border-gray-200/80 shadow-sm rounded-lg px-3 py-2 text-xs text-gray-500 font-medium pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Active Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span>Note</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
