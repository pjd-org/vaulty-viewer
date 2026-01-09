import React, { useEffect, useState } from 'react';
import { Link, navigate } from 'gatsby';
import CODStatusPanel from '../components/CODStatusPanel';
import Navbar from '../components/Navbar';

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

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusColors = {
    'completed': 'success',
    'in-progress': 'warning',
    'todo': 'info',
    'blocked': 'danger',
    'backlog': 'muted',
  };
  const color = statusColors[status] || 'muted';
  return <span className={`note-status note-status--${color}`}>{status}</span>;
};

// Priority indicator
const PriorityBadge = ({ priority }) => {
  const level = priority >= 7 ? 'high' : priority >= 4 ? 'medium' : 'low';
  return <span className={`note-priority note-priority--${level}`}>P{priority}</span>;
};

// Action button component
const ActionButton = ({ icon, label, onClick, variant = 'default', disabled = false }) => (
  <button
    className={`note-action note-action--${variant}`}
    onClick={onClick}
    disabled={disabled}
    title={label}
  >
    <span className="note-action__icon">{icon}</span>
    <span className="note-action__label">{label}</span>
  </button>
);

const NotePage = ({ location }) => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

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

        // If it's a task, fetch additional task data
        if (notePath.startsWith('tasks/') && structured.frontmatter?.type === 'task') {
          try {
            const taskResponse = await fetch(`${apiUrl}/api/v1/tasks/${encodedPath}`);
            if (taskResponse.ok) {
              const taskResult = await taskResponse.json();
              setTaskData(taskResult.structuredContent || taskResult);
            }
          } catch (taskErr) {
            console.warn('[viewer] Could not fetch task data:', taskErr);
          }
        }
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

  // Action handlers
  const handleCopyPath = () => {
    navigator.clipboard.writeText(`${notePath}.md`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInObsidian = () => {
    // obsidian://open?vault=VAULT_NAME&file=PATH
    const vaultName = 'vault'; // Could be made configurable
    const obsidianUrl = `obsidian://open?vault=${vaultName}&file=${encodeURIComponent(notePath)}.md`;
    window.open(obsidianUrl, '_blank');
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/note?p=${encodeURIComponent(notePath)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReviewSubmit = async () => {
    if (!notePath) return;
    setReviewSubmitting(true);
    setReviewMessage(null);
    try {
      const apiUrl = getApiUrl();
      const body = {
        path: `${notePath}.md`,
        addHistoryNote: `Review (${reviewDecision}): ${reviewComment || 'No comment provided.'}`,
        frontmatterPatch: {
          review_status: reviewDecision,
          review_updated: new Date().toISOString(),
        },
      };
      const res = await fetch(`${apiUrl}/api/v1/tools/obsidian_update_task/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      setReviewMessage('Review recorded via Tasker API.');
      setReviewComment('');
    } catch (err) {
      setReviewMessage(`Failed to record review: ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Determine note type for specialized UI
  const isTask = note?.frontmatter?.type === 'task' || note?.collection === 'tasks';
  const isGoal = note?.frontmatter?.type === 'goal' || note?.collection === 'goals';
  const isSpec = note?.collection === 'specs' || note?.collection === 'projects';

  const renderReviewPanel = () => {
    if (!isTask) return null;
    return (
      <section className="note-review">
        <header className="note-review__header">
          <h3>Review</h3>
          <p>Record a review decision and optional comment back to the vault via Tasker API.</p>
        </header>
        <div className="note-review__controls">
          <label className="note-review__option">
            <input
              type="radio"
              name="review-decision"
              value="approve"
              checked={reviewDecision === 'approve'}
              onChange={() => setReviewDecision('approve')}
            />
            <span>Approve</span>
          </label>
          <label className="note-review__option">
            <input
              type="radio"
              name="review-decision"
              value="needs_changes"
              checked={reviewDecision === 'needs_changes'}
              onChange={() => setReviewDecision('needs_changes')}
            />
            <span>Needs changes</span>
          </label>
        </div>
        <textarea
          className="note-review__comment"
          placeholder="Add a short review comment (optional)"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
        <div className="note-review__actions">
          <button
            className="note-review__submit"
            onClick={handleReviewSubmit}
            disabled={reviewSubmitting}
          >
            {reviewSubmitting ? 'Submitting…' : 'Submit review'}
          </button>
          {reviewMessage && (
            <span className="note-review__message">{reviewMessage}</span>
          )}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <main className="page page--detail note-page">
        <CODStatusPanel />
        <header className="detail__header">
          <Link to="/" className="back-link">
            ← Back to vault
          </Link>
        </header>
        <div className="note-loading">
          <div className="note-loading__spinner"></div>
          <p>Loading note...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page page--detail note-page">
        <CODStatusPanel />
        <header className="detail__header">
          <Link to="/" className="back-link">
            ← Back to vault
          </Link>
        </header>
        <div className="note-error">
          <div className="note-error__icon">📄</div>
          <h2>Note Not Found</h2>
          <p>{error}</p>
          <div className="note-error__actions">
            <button onClick={() => navigate('/')} className="note-action note-action--primary">
              Return to Vault
            </button>
            <button onClick={() => window.location.reload()} className="note-action">
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`page page--detail note-page ${isTask ? 'note-page--task' : ''} ${isGoal ? 'note-page--goal' : ''}`}>
      <Navbar />
      <CODStatusPanel />
      
      {/* Breadcrumb navigation */}
      <nav className="note-breadcrumb">
        <Link to="/" className="note-breadcrumb__item">Vault</Link>
        <span className="note-breadcrumb__sep">/</span>
        <Link to={`/?collection=${note.collection}`} className="note-breadcrumb__item">
          {formatLabel(note.collection)}
        </Link>
        <span className="note-breadcrumb__sep">/</span>
        <span className="note-breadcrumb__current">{note.title}</span>
      </nav>

      {/* Header with metadata */}
      <header className="note-header">
        <div className="note-header__badges">
          <span className={`note-type note-type--${note.collection}`}>
            {note.collection}
          </span>
          {note.frontmatter?.status && (
            <StatusBadge status={note.frontmatter.status} />
          )}
          {note.frontmatter?.priority && (
            <PriorityBadge priority={note.frontmatter.priority} />
          )}
          {note.frontmatter?.delegatable && (
            <span className="note-badge note-badge--delegatable">🤖 Delegatable</span>
          )}
        </div>
        
        <h1 className="note-header__title">{note.title}</h1>
        
        {/* Meta info row */}
        <div className="note-meta">
          {note.frontmatter?.created && (
            <span className="note-meta__item">
              📅 Created {formatDate(note.frontmatter.created)}
            </span>
          )}
          {note.frontmatter?.estimatedTimeMin && (
            <span className="note-meta__item">
              ⏱️ ~{note.frontmatter.estimatedTimeMin}min
            </span>
          )}
          {note.frontmatter?.effortScore && (
            <span className="note-meta__item">
              💪 Effort: {note.frontmatter.effortScore}/10
            </span>
          )}
          {note.frontmatter?.goalId && (
            <Link to={`/note?p=goals/${note.frontmatter.goalId}`} className="note-meta__item note-meta__link">
              🎯 {formatLabel(note.frontmatter.goalId)}
            </Link>
          )}
        </div>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="note-tags">
            {note.tags.map((tag) => (
              <Link 
                key={tag} 
                to={`/?q=${encodeURIComponent(tag)}`}
                className="note-tag"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Action bar */}
      <div className="note-actions">
        <div className="note-actions__group">
          <ActionButton
            icon="📋"
            label={copied ? 'Copied!' : 'Copy Path'}
            onClick={handleCopyPath}
            variant={copied ? 'success' : 'default'}
          />
          <ActionButton
            icon="🔗"
            label="Share"
            onClick={handleShare}
          />
          <ActionButton
            icon="🗂"
            label="Open in Obsidian"
            onClick={handleOpenInObsidian}
            variant="accent"
          />
        </div>
        
        {/* Task-specific actions - only show if spec exists */}
        {isTask && note.frontmatter?.spec_path && (
          <div className="note-actions__group note-actions__group--task">
            <ActionButton
              icon="📖"
              label="View Spec"
              onClick={() => navigate(`/note?p=${note.frontmatter.spec_path.replace('.md', '')}`)}
            />
          </div>
        )}
      </div>

      {/* Task progress card if task */}
      {isTask && taskData && (
        <div className="note-task-card">
          <div className="note-task-card__header">
            <h3>Task Progress</h3>
            {taskData.metrics?.currentMilestone !== undefined && (
              <span className="note-task-card__milestone">
                {taskData.metrics.currentMilestone}% complete
              </span>
            )}
          </div>
          <div className="note-task-card__progress">
            <div 
              className="note-task-card__bar"
              style={{ width: `${taskData.metrics?.currentMilestone || 0}%` }}
            />
          </div>
          <div className="note-task-card__stats">
            {taskData.metrics?.effortRemaining && (
              <div className="note-task-card__stat">
                <span className="note-task-card__stat-value">{taskData.metrics.effortRemaining}</span>
                <span className="note-task-card__stat-label">Effort Left</span>
              </div>
            )}
            {taskData.metrics?.estimatedCompletionMin && (
              <div className="note-task-card__stat">
                <span className="note-task-card__stat-value">{taskData.metrics.estimatedCompletionMin}m</span>
                <span className="note-task-card__stat-label">Est. Time</span>
              </div>
            )}
            {taskData.metrics?.rewardPotential && (
              <div className="note-task-card__stat">
                <span className="note-task-card__stat-value">{(taskData.metrics.rewardPotential * 100).toFixed(0)}%</span>
                <span className="note-task-card__stat-label">Reward</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <article
        className="note-content"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />

      {renderReviewPanel()}

      {/* Footer with related actions */}
      <footer className="note-footer">
        <div className="note-footer__nav">
          <Link to="/" className="note-footer__link">
            ← Back to Vault
          </Link>
          {note.collection === 'tasks' && (
            <Link to="/goals" className="note-footer__link">
              View Goals →
            </Link>
          )}
        </div>
        <div className="note-footer__info">
          <span className="note-footer__path">{notePath}.md</span>
        </div>
      </footer>
    </main>
  );
};

export default NotePage;
