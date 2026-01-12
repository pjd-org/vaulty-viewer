import { useEffect, useCallback } from 'react';
import { navigate } from 'gatsby';

/**
 * Keyboard shortcuts for power users.
 *
 * Available shortcuts:
 * - g h: Go to Home
 * - g k: Go to Kanban
 * - g a: Go to Avatar
 * - g g: Go to Goals
 * - g c: Go to COD Status
 * - /: Focus search
 * - ?: Show help
 */
export function useKeyboardShortcuts({ onSearch, onHelp } = {}) {
  const handleKeyDown = useCallback(
    (e) => {
      // Skip if in input/textarea/contenteditable
      const target = e.target;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle slash for search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        } else {
          // Try to focus search input
          const searchInput = document.querySelector(
            "#vault-search, [type='search']"
          );
          if (searchInput) {
            searchInput.focus();
          }
        }
        return;
      }

      // Handle ? for help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        if (onHelp) {
          onHelp();
        }
        return;
      }

      // Handle 'g' prefix for navigation (like GitHub)
      if (e.key === 'g' && !window.__goPrefixActive) {
        window.__goPrefixActive = true;
        window.__goPrefixTimeout = setTimeout(() => {
          window.__goPrefixActive = false;
        }, 1500);
        return;
      }

      if (window.__goPrefixActive) {
        clearTimeout(window.__goPrefixTimeout);
        window.__goPrefixActive = false;

        const routes = {
          h: '/',
          k: '/kanban',
          a: '/avatar',
          g: '/goals',
          c: '/cod-status',
        };

        if (routes[e.key]) {
          e.preventDefault();
          navigate(routes[e.key]);
        }
      }

      // Escape to clear focus
      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active && active !== document.body) {
          active.blur();
        }
      }
    },
    [onSearch, onHelp]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(window.__goPrefixTimeout);
    };
  }, [handleKeyDown]);
}

/**
 * Component to display keyboard shortcut hints
 */
export function KeyboardShortcutsHelp({ onClose }) {
  const shortcuts = [
    { keys: ['g', 'h'], description: 'Go to Home' },
    { keys: ['g', 'k'], description: 'Go to Kanban' },
    { keys: ['g', 'a'], description: 'Go to Avatar' },
    { keys: ['g', 'g'], description: 'Go to Goals' },
    { keys: ['g', 'c'], description: 'Go to COD Status' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Clear focus / close modal' },
  ];

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="keyboard-help" onClick={(e) => e.stopPropagation()}>
        <div className="keyboard-help__header">
          <h3>Keyboard Shortcuts</h3>
          <button className="keyboard-help__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="keyboard-help__list">
          {shortcuts.map(({ keys, description }) => (
            <div key={description} className="keyboard-help__item">
              <span className="keyboard-help__keys">
                {keys.map((key, i) => (
                  <span key={i}>
                    <kbd className="keyboard-help__kbd">{key}</kbd>
                    {i < keys.length - 1 && ' then '}
                  </span>
                ))}
              </span>
              <span className="keyboard-help__desc">{description}</span>
            </div>
          ))}
        </div>
        <div className="keyboard-help__footer">
          Press <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

export default useKeyboardShortcuts;
