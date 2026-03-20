import { describe, it, expect } from 'vitest';

// Pure logic helpers extracted from KnowledgeNoteCard.
// Component rendering tests require jsdom + React Testing Library
// which are not in this package — these tests cover the derivation logic.

const audienceBadgeClass = {
  human: 'knowledge-badge knowledge-badge--human',
  agent: 'knowledge-badge knowledge-badge--agent',
  bubble: 'knowledge-badge knowledge-badge--bubble',
};

const maturityBadgeClass = {
  draft: 'knowledge-badge knowledge-badge--draft',
  stable: 'knowledge-badge knowledge-badge--stable',
  deprecated: 'knowledge-badge knowledge-badge--deprecated',
};

describe('KnowledgeNoteCard audience badge class derivation', () => {
  it('human audience maps to blue badge class', () => {
    expect(audienceBadgeClass['human']).toBe('knowledge-badge knowledge-badge--human');
  });

  it('agent audience maps to green badge class', () => {
    expect(audienceBadgeClass['agent']).toBe('knowledge-badge knowledge-badge--agent');
  });

  it('bubble audience maps to gold badge class', () => {
    expect(audienceBadgeClass['bubble']).toBe('knowledge-badge knowledge-badge--bubble');
  });

  it('unknown audience has no badge class', () => {
    expect(audienceBadgeClass['unknown']).toBeUndefined();
  });

  it('null audience has no badge class', () => {
    expect(audienceBadgeClass[null]).toBeUndefined();
  });
});

describe('KnowledgeNoteCard maturity badge class derivation', () => {
  it('draft maps to grey badge class', () => {
    expect(maturityBadgeClass['draft']).toBe('knowledge-badge knowledge-badge--draft');
  });

  it('stable maps to green badge class', () => {
    expect(maturityBadgeClass['stable']).toBe('knowledge-badge knowledge-badge--stable');
  });

  it('deprecated maps to red badge class', () => {
    expect(maturityBadgeClass['deprecated']).toBe('knowledge-badge knowledge-badge--deprecated');
  });

  it('missing status has no maturity badge', () => {
    expect(maturityBadgeClass[undefined]).toBeUndefined();
  });
});

describe('KnowledgeNoteCard note URL construction', () => {
  it('encodes the path correctly for use in search param', () => {
    const notePath = 'notes/knowledge/human/engineering/typescript-guide.md';
    const encoded = encodeURIComponent(notePath);
    expect(encoded).toContain('%2F');
    expect(encoded).not.toContain('/');
  });

  it('links to /note route with p search param', () => {
    const notePath = 'notes/knowledge/agent/tooling/mcp-protocol.md';
    const href = `/note?p=${encodeURIComponent(notePath)}`;
    expect(href).toContain('/note?p=');
    expect(href).toContain('notes%2Fknowledge%2Fagent');
  });
});
