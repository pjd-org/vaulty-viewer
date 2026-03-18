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
        <Link to="/" className="navbar__logo">
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
        <Link to="/" onClick={closeMenu}>
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
