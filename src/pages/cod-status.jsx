import React from "react";
import { Link } from "gatsby";
import CODStatusPanel from "../components/CODStatusPanel";

/**
 * Full-page COD Status view
 * Shows expanded panel with all sections visible
 */
const CODStatusPage = () => {
  return (
    <main className="page cod-status-page">
      <header className="detail__header">
        <Link to="/" className="back-link">
          {"<- Back to vault"}
        </Link>
        <h1>COD Status</h1>
        <p className="lede">
          Cognitive Operating Discipline — Real-time validation, human state, and session tracking.
        </p>
      </header>

      <section className="cod-status-content">
        <CODStatusPanel collapsed={false} />
      </section>

      <section className="cod-info">
        <h2>About COD</h2>
        <p>
          The Cognitive Operating Discipline (COD) system monitors your current state
          and ensures you're working within sustainable limits. It tracks:
        </p>
        <ul>
          <li><strong>Energy:</strong> Your current capacity for focused work</li>
          <li><strong>Focus:</strong> Your ability to concentrate on complex tasks</li>
          <li><strong>Stress:</strong> Current mental load and pressure</li>
          <li><strong>Sleep Debt:</strong> Accumulated sleep deficit affecting performance</li>
          <li><strong>Time Available:</strong> Remaining work window before HARD_STOP</li>
        </ul>

        <h3>Validation States</h3>
        <ul>
          <li><strong>✅ PASS:</strong> All systems nominal, proceed with planned work</li>
          <li><strong>⚠️ WARN:</strong> Degraded state detected, consider lighter tasks</li>
          <li><strong>❌ FAIL:</strong> Blocking condition, session should not start</li>
        </ul>

        <h3>HARD_STOP Guardrail</h3>
        <p>
          The HARD_STOP guardrail prevents work after 23:00 to protect sleep hygiene.
          This is a non-negotiable boundary enforced by the system.
        </p>
      </section>
    </main>
  );
};

export default CODStatusPage;
