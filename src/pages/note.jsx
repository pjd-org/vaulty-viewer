import React, { useEffect, useState } from 'react';
import { Link, navigate } from 'gatsby';
import CODStatusPanel from '../components/CODStatusPanel';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.TASKER_API_URL) {
    return window.TASKER_API_URL;
  }
  return '';
};

const formatLabel = (value) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const NotePage = ({ location }) => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract path from query string: /note?p=tasks/viewer-goal-progress
  const params = typeof window !== 'undefined' ? new URLSearchParams(location?.search) : null;
  const notePath = params?.get('p') || '';

  useEffect(() => {
    const fetchNote = async () => {
      if (!notePath) {
        setError('No note path specified. Use ?p=folder/note-name');
        setLoading(false);
        return;
      }

      const apiUrl = getApiUrl();
      // Encode the path for the API call - replace slashes with %2F
      const encodedPath = encodeURIComponent(`${notePath}.md`);

      try {
        const response = await fetch(`${apiUrl}/api/v1/notes/${encodedPath}`);
        if (!response.ok) {
          throw new Error(`Note not found: ${notePath}`);
        }

        const result = await response.json();
        const structured = result.structuredContent || {};
        
        // Parse content into HTML (basic markdown rendering)
        const rawContent = structured.content || result.content?.[0]?.text || '';
        const html = simpleMarkdownToHtml(rawContent);

        setNote({
          path: structured.path || notePath,
          title: structured.frontmatter?.title || formatLabel(notePath.split('/').pop()),
          tags: structured.frontmatter?.tags || [],
          collection: notePath.split('/')[0] || 'notes',
          content: rawContent,
          html,
          frontmatter: structured.frontmatter || {},
        });
      } catch (err) {
        console.error('[viewer] Failed to fetch note:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [notePath]);

  // Simple markdown to HTML conversion
  const simpleMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Checkboxes
      .replace(/^\s*- \[x\] (.+)$/gm, '<li class="task-item task-done"><input type="checkbox" checked disabled /> $1</li>')
      .replace(/^\s*- \[ \] (.+)$/gm, '<li class="task-item"><input type="checkbox" disabled /> $1</li>')
      // Unordered lists
      .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
      // Ordered lists  
      .replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Horizontal rules
      .replace(/^---+$/gm, '<hr />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Wikilinks [[note]]
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="/note/$1" class="wikilink">$2</a>')
      .replace(/\[\[([^\]]+)\]\]/g, '<a href="/note/$1" class="wikilink">$1</a>')
      // Paragraphs (double newlines)
      .replace(/\n\n+/g, '</p><p>')
      // Single newlines become <br>
      .replace(/\n/g, '<br />');

    // Wrap in paragraph tags
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    // Fix list wrapping
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return html;
  };

  if (loading) {
    return (
      <main className="page page--detail">
        <CODStatusPanel />
        <header className="detail__header">
          <Link to="/" className="back-link">
            {'<- Back to vault'}
          </Link>
        </header>
        <div className="loading-state">Loading note...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page page--detail">
        <CODStatusPanel />
        <header className="detail__header">
          <Link to="/" className="back-link">
            {'<- Back to vault'}
          </Link>
        </header>
        <div className="error-state">
          <h2>Error Loading Note</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Return to Index</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--detail">
      <CODStatusPanel />
      <header className="detail__header">
        <Link to="/" className="back-link">
          {'<- Back to vault'}
        </Link>
        <div className="card__meta">
          <span className="pill">{note.collection}</span>
          {note.frontmatter?.status && (
            <span className="pill pill--status">{note.frontmatter.status}</span>
          )}
          {note.frontmatter?.priority && (
            <span className="pill pill--priority">P{note.frontmatter.priority}</span>
          )}
        </div>
        <h1>{note.title}</h1>
        {note.tags?.length > 0 && (
          <div className="tag-list">
            {note.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <article
        className="content"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
    </main>
  );
};

export default NotePage;
