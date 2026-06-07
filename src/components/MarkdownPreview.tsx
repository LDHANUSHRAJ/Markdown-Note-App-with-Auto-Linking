import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNoteStore } from '../store/noteStore';
import { renderWithLinks } from '../algorithms/autolink';
import { useNavigate } from 'react-router-dom';

interface MarkdownPreviewProps {
  content: string;
  noteId: string;
}

export function MarkdownPreview({ content, noteId }: MarkdownPreviewProps) {
  const trie = useNoteStore(s => s.trie);
  const navigate = useNavigate();

  const html = useMemo(() => {
    // First, convert [[links]] to clickable anchors
    const linkedContent = renderWithLinks(content, trie, noteId);
    // Then parse markdown
    const rawHtml = marked.parse(linkedContent, { async: false }) as string;
    // Sanitize
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['data-note-id', 'target'],
    });
  }, [content, trie, noteId]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('note-link') && target.classList.contains('resolved')) {
      e.preventDefault();
      const targetNoteId = target.getAttribute('data-note-id');
      if (targetNoteId) {
        navigate(`/note/${targetNoteId}`);
      }
    }
  };

  return (
    <div
      className="markdown-preview prose prose-neutral max-w-none px-12 py-10"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
