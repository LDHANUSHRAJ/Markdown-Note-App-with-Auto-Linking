import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { useNoteStore } from '../store/noteStore';

interface MarkdownEditorProps {
  content: string;
  noteId: string;
  onChange: (content: string) => void;
}

export function MarkdownEditor({ content, noteId, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const trie = useNoteStore(s => s.trie);

  const wikiLinkCompletion = useCallback((context: CompletionContext) => {
    const before = context.matchBefore(/\[\[([^\]]*)$/);
    if (!before) return null;

    const prefix = before.text.slice(2); // remove [[
    const matches = trie.searchPrefix(prefix);

    if (matches.length === 0) return null;

    return {
      from: before.from + 2,
      options: matches
        .filter(m => m.noteId !== noteId)
        .map(m => ({
          label: m.title,
          apply: m.title + ']]',
          type: 'text'
        }))
    };
  }, [trie, noteId]);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        markdown(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        placeholder('Start writing your note... Use [[Note Title]] to link to other notes'),
        autocompletion({
          override: [wikiLinkCompletion],
          activateOnTyping: true,
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '16px',
            fontFamily: "var(--font-sans), sans-serif",
          },
          '.cm-content': {
            padding: '40px 50px',
            caretColor: '#D97757',
            color: '#111827',
            lineHeight: '1.8',
          },
          '.cm-cursor': {
            borderLeftColor: '#D97757',
            borderLeftWidth: '2px',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'rgba(217, 119, 87, 0.2) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'rgba(217, 119, 87, 0.3) !important',
          },
          '.cm-gutters': {
            backgroundColor: 'transparent',
            borderRight: 'none',
            color: '#9ca3af',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#D97757',
          },
          '.cm-activeLine': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
          '.cm-tooltip.cm-tooltip-autocomplete': {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            padding: '6px',
          },
          '.cm-tooltip-autocomplete ul li': {
            padding: '8px 12px',
            borderRadius: '8px',
            color: '#4b5563',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.95rem',
          },
          '.cm-tooltip-autocomplete ul li[aria-selected]': {
            backgroundColor: 'rgba(217, 119, 87, 0.1)',
            color: '#D97757',
          },
          '.cm-placeholder': {
            color: '#9ca3af',
            fontStyle: 'italic',
          },
        }),
        EditorView.baseTheme({
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  return (
    <div
      ref={editorRef}
      className="editor-container"
      style={{
        height: '100%',
        backgroundColor: 'transparent',
        borderRadius: '12px',
      }}
    />
  );
}
