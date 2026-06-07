import { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNoteStore } from '../store/noteStore';
import { useNavigate } from 'react-router-dom';

interface GraphCanvasProps {
  width?: number;
  height?: number;
  focusNoteId?: string;
}

export function GraphCanvas({ width = 800, height = 600, focusNoteId }: GraphCanvasProps) {
  const { notes, folders, graph } = useNoteStore();
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);

  // Dynamic graph data including both Notes and Folders
  const noteNodes = notes.map(n => ({
    id: n.id,
    label: n.title,
    val: Math.max(n.pageRankScore * 15 + 3, 3),
    score: n.pageRankScore,
    isFocused: n.id === focusNoteId,
    type: 'note' as const
  }));

  const folderNodes = folders.map(f => ({
    id: f.id,
    label: f.name,
    val: 6, // Slightly larger base size
    score: 0.5,
    isFocused: false,
    type: 'folder' as const
  }));

  const autoLinks = graph.toForceGraphData().links;
  const folderLinks: any[] = [];
  
  // Link notes to their parent folders
  notes.forEach(n => {
    if (n.folderId) {
      folderLinks.push({
        source: n.id,
        target: n.folderId,
        type: 'containment'
      });
    }
  });

  // Link nested folders to their parent folders
  folders.forEach(f => {
    if (f.parentId) {
      folderLinks.push({
        source: f.id,
        target: f.parentId,
        type: 'containment'
      });
    }
  });

  const graphData = {
    nodes: [...noteNodes, ...folderNodes],
    links: [...autoLinks, ...folderLinks]
  };

  const handleNodeClick = useCallback((node: any) => {
    if (node.type === 'note') {
      navigate(`/note/${node.id}`);
    }
  }, [navigate]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || '';
    const fontSize = Math.max(12 / globalScale, 3);
    const nodeSize = node.val || 3;

    // Node glow
    if (node.isFocused) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 3, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(217, 119, 87, 0.2)'; // rusty orange tint for focus
      ctx.fill();
    }

    if (node.type === 'folder') {
      // Draw folder node as a rounded rectangle
      const w = nodeSize * 2.2;
      const h = nodeSize * 1.6;
      ctx.fillStyle = '#f59e0b'; // Amber for folder
      ctx.beginPath();
      ctx.roundRect?.(node.x - w/2, node.y - h/2, w, h, 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    } else {
      // Node circle for note
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
      // Dark gray to black nodes as seen in the screenshots
      ctx.fillStyle = node.isFocused
        ? '#D97757' // Focused node is rust orange
        : '#4b5563'; // Normal nodes are slate gray
      ctx.fill();

      ctx.strokeStyle = node.isFocused
        ? '#D97757'
        : '#94a3b8';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }

    // Label
    if (globalScale > 0.5 || node.isFocused) {
      ctx.font = `${node.isFocused ? '600' : '400'} ${fontSize}px var(--font-sans), sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = node.isFocused ? '#111827' : '#374151'; // Dark gray/black text
      ctx.fillText(label, node.x, node.y + nodeSize + 3);
    }
  }, []);

  useEffect(() => {
    if (fgRef.current && focusNoteId) {
      const node = graphData.nodes.find(n => n.id === focusNoteId);
      if (node) {
        setTimeout(() => {
          fgRef.current?.centerAt((node as any).x, (node as any).y, 500);
          fgRef.current?.zoom(2.5, 500);
        }, 300);
      }
    }
  }, [focusNoteId, graphData.nodes]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeLabel="label"
      nodeVal="val"
      nodeCanvasObject={nodeCanvasObject}
      linkColor={(link: any) => link.type === 'containment' ? '#fde047' : '#e2e8f0'}
      linkWidth={(link: any) => link.type === 'containment' ? 1.2 : 1.0}
      linkDirectionalArrowLength={(link: any) => link.type === 'containment' ? 0 : 3}
      linkDirectionalArrowRelPos={0.95}
      linkDirectionalArrowColor={() => '#cbd5e1'}
      onNodeClick={handleNodeClick}
      backgroundColor="#ffffff"
      width={width}
      height={height}
      cooldownTicks={100}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
    />
  );
}
