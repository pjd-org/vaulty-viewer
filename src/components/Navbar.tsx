import React, { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { dispatchNavOverlay, type NavOverlay } from '../lib/nav-overlays';

interface NavbarProps {
  apiStatus?: 'online' | 'offline' | 'unknown';
}

/**
 * Simple top navigation shared across viewer pages.
 * Optionally shows API status via `apiStatus` prop.
 * Mobile-responsive with hamburger menu.
 */
export default function Navbar({ apiStatus = 'unknown' }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const statusLabel =
    apiStatus === 'online'
      ? 'API online'
      : apiStatus === 'offline'
        ? 'API offline'
        : 'API';

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const navLinkClass = (to: string) => {
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
    return isActive ? 'navbar__link--active' : undefined;
  };
  const openOverlay = (type: NavOverlay) => {
    dispatchNavOverlay(type);
    closeMenu();
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Link to="/" search={{ q: undefined, collection: undefined }} className="navbar__logo">
          Vaulty Viewer
        </Link>
      </div>

      {/* Mobile hamburger button */}
      <button
        className="navbar__hamburger"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span
          className={`navbar__hamburger-line ${menuOpen ? 'navbar__hamburger-line--open' : ''}`}
        />
        <span
          className={`navbar__hamburger-line ${menuOpen ? 'navbar__hamburger-line--open' : ''}`}
        />
        <span
          className={`navbar__hamburger-line ${menuOpen ? 'navbar__hamburger-line--open' : ''}`}
        />
      </button>

      {/* Navigation links - toggleable on mobile */}
      <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
        <Link
          to="/"
          search={{ q: undefined, collection: undefined }}
          onClick={closeMenu}
          className={navLinkClass('/')}
        >
          Home
        </Link>
        <Link to="/work" onClick={closeMenu} className={navLinkClass('/work')}>
          Work
        </Link>
        <button
          type="button"
          className={`navbar__link-button ${pathname === '/avatar' ? 'navbar__link--active' : ''}`.trim()}
          onClick={() => openOverlay('avatar')}
        >
          Avatar
        </button>
        <Link to="/huey" onClick={closeMenu} className={`navbar__huey-link ${navLinkClass('/huey') ?? ''}`.trim()}>
          Huey
        </Link>
        <button
          type="button"
          className={`navbar__link-button ${pathname === '/cod-status' ? 'navbar__link--active' : ''}`.trim()}
          onClick={() => openOverlay('cod')}
        >
          COD
        </button>
        <Link
          to="/inbox"
          search={{ view: undefined }}
          onClick={closeMenu}
          className={navLinkClass('/inbox')}
        >
          Inbox
        </Link>
        <Link to="/knowledge" onClick={closeMenu} className={navLinkClass('/knowledge')}>
          Knowledge
        </Link>
      </div>

      <div className="navbar__status">
        <span className={`api-badge api-badge--${apiStatus}`}>
          {statusLabel}
        </span>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="navbar__overlay"
          onClick={closeMenu}
          onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') closeMenu(); }}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}
    </nav>
  );
}
