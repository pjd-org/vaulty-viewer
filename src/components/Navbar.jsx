import React from "react";
import { Link } from "gatsby";

/**
 * Simple top navigation shared across viewer pages.
 * Optionally shows API status via `apiStatus` prop.
 */
export default function Navbar({ apiStatus = "unknown" }) {
  const statusLabel =
    apiStatus === "online"
      ? "API online"
      : apiStatus === "offline"
      ? "API offline"
      : "API";

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Link to="/" className="navbar__logo">
          Vaulty Viewer
        </Link>
      </div>
      <div className="navbar__links">
        <Link to="/" activeClassName="navbar__link--active">
          Home
        </Link>
        <Link to="/kanban" activeClassName="navbar__link--active">
          Kanban
        </Link>
        <Link to="/avatar" activeClassName="navbar__link--active">
          Avatar
        </Link>
        <Link to="/goals" activeClassName="navbar__link--active">
          Goals
        </Link>
      </div>
      <div className="navbar__status">
        <span className={`api-badge api-badge--${apiStatus}`}>{statusLabel}</span>
      </div>
    </nav>
  );
}
