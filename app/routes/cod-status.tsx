import React from "react";
import { createFileRoute, Link } from '@tanstack/react-router';
import CODStatusPanel from "../../src/components/CODStatusPanel";
import { codPageStyle } from "../../src/lib/cod-status-logic";

export const Route = createFileRoute('/cod-status')({
  component: CODStatusRoute,
})

function CODStatusRoute() {
  return (
    <main className="page cod-status-page" style={codPageStyle()}>
      <header className="detail__header" style={{ paddingBottom: '24px' }}>
        <Link to="/" search={{ q: undefined, collection: undefined }} className="back-link">
          ← Back to vault
        </Link>
        <h1>COD Status</h1>
        <p className="lede">Execution readiness and constraints.</p>
      </header>

      <section className="cod-status-content">
        <CODStatusPanel collapsed={false} />
      </section>
    </main>
  );
}
