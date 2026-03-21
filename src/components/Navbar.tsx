import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';

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
  const rawTensuraAppUrl =
    (typeof window !== 'undefined' &&
      typeof (
        window as Window & {
          VIEWER_CONFIG?: { tensuraUrl?: string; hueyChatUrl?: string };
        }
      ).VIEWER_CONFIG?.tensuraUrl === 'string' &&
      (
        window as Window & {
          VIEWER_CONFIG?: { tensuraUrl?: string; hueyChatUrl?: string };
        }
      ).VIEWER_CONFIG?.tensuraUrl) ||
    process.env.VIEWER_TENSURA_URL ||
    (typeof window !== 'undefined' &&
      typeof (
        window as Window & {
          VIEWER_CONFIG?: { tensuraUrl?: string; hueyChatUrl?: string };
        }
      ).VIEWER_CONFIG?.hueyChatUrl === 'string' &&
      (
        window as Window & {
          VIEWER_CONFIG?: { tensuraUrl?: string; hueyChatUrl?: string };
        }
      ).VIEWER_CONFIG?.hueyChatUrl) ||
    process.env.VIEWER_HUEY_CHAT_URL ||
    '/tensura/opencode';
  const tensuraAppUrl =
    rawTensuraAppUrl === '/tensura'
      ? '/tensura/opencode'
      : rawTensuraAppUrl;
  const hueyAppUrl = '/huey'

  const statusLabel =
    apiStatus === 'online'
      ? 'API online'
      : apiStatus === 'offline'
        ? 'API offline'
        : 'API';

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

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
        <Link to="/" search={{ q: undefined, collection: undefined }} onClick={closeMenu}>
          Home
        </Link>
        <Link
          to="/kanban"
          onClick={closeMenu}
        >
          Kanban
        </Link>
        <Link
          to="/avatar"
          onClick={closeMenu}
        >
          Avatar
        </Link>
        <Link
          to="/goals"
          onClick={closeMenu}
        >
          Goals
        </Link>
        <a href={hueyAppUrl} onClick={closeMenu} className="navbar__huey-link">
          Huey
        </a>
        <Link
          to="/cod-status"
          onClick={closeMenu}
        >
          COD
        </Link>
        <Link
          to="/inbox"
          onClick={closeMenu}
        >
          Inbox
        </Link>
        <Link
          to="/knowledge"
          onClick={closeMenu}
        >
          Knowledge
        </Link>
        <a
          href={tensuraAppUrl}
          onClick={closeMenu}
          className="navbar__huey-link"
          target={tensuraAppUrl.startsWith('http') ? '_blank' : undefined}
          rel={tensuraAppUrl.startsWith('http') ? 'noreferrer noopener' : undefined}
        >
          OpenCode
        </a>
      </div>

      <div className="navbar__status">
        <span className={`api-badge api-badge--${apiStatus}`}>
          {statusLabel}
        </span>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && <div className="navbar__overlay" onClick={closeMenu} />}
    </nav>
  );
}
