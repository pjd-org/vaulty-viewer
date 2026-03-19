import React from "react";

interface KnowledgeDomains {
  [domain: string]: number;
}

interface KnowledgeLearning {
  now?: string[];
  next?: string[];
}

interface Knowledge {
  domains?: KnowledgeDomains;
  learning?: KnowledgeLearning;
  gaps?: string[];
}

interface KnowledgePanelProps {
  knowledge?: Knowledge;
}

interface Capacity {
  focusCostMax?: number;
  effortScoreMax?: number;
  timeBudgetMin?: number;
}

interface CapacityPanelProps {
  capacity?: Capacity;
}

/**
 * Knowledge Panel - shows domains, learning focus, and gaps
 */
export function KnowledgePanel({ knowledge }: KnowledgePanelProps) {
  const domains = knowledge?.domains || {};
  const learning = knowledge?.learning || { now: [], next: [] };
  const gaps = knowledge?.gaps || [];

  const domainEntries = Object.entries(domains).sort((a, b) => b[1] - a[1]);

  return (
    <div className="avatar-section">
      <div className="avatar-section__header">
        <h3 className="avatar-section__title">Knowledge</h3>
      </div>

      {/* Domain Skills */}
      {domainEntries.length > 0 && (
        <div className="avatar-domains">
          <h4 className="avatar-subsection__title">Domains</h4>
          <div className="avatar-domain-list">
            {domainEntries.map(([domain, level]) => (
              <div key={domain} className="avatar-domain">
                <span className="avatar-domain__name">{domain}</span>
                <div className="avatar-domain__level">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`avatar-domain__pip ${i < level ? 'avatar-domain__pip--filled' : ''}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Focus */}
      {(learning.now?.length || 0 > 0 || learning.next?.length || 0 > 0) && (
        <>
          <div className="avatar-section__divider" />
          <div className="avatar-learning">
            {learning.now && learning.now.length > 0 && (
              <div className="avatar-learning__group">
                <span className="avatar-learning__label">📚 Learning Now</span>
                <div className="avatar-tags">
                  {learning.now.map((item) => (
                    <span key={item} className="avatar-tag avatar-tag--active">{item}</span>
                  ))}
                </div>
              </div>
            )}
            {learning.next && learning.next.length > 0 && (
              <div className="avatar-learning__group">
                <span className="avatar-learning__label">📋 Up Next</span>
                <div className="avatar-tags">
                  {learning.next.map((item) => (
                    <span key={item} className="avatar-tag">{item}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Knowledge Gaps */}
      {gaps.length > 0 && (
        <>
          <div className="avatar-section__divider" />
          <div className="avatar-gaps">
            <span className="avatar-learning__label">⚠️ Gaps</span>
            <div className="avatar-tags">
              {gaps.map((gap) => (
                <span key={gap} className="avatar-tag avatar-tag--gap">{gap}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Capacity Panel - shows current work capacity limits
 */
export function CapacityPanel({ capacity }: CapacityPanelProps) {
  return (
    <div className="avatar-section">
      <div className="avatar-section__header">
        <h3 className="avatar-section__title">Capacity</h3>
      </div>

      <div className="avatar-capacity-grid">
        <div className="avatar-capacity-item">
          <span className="avatar-capacity-item__icon">🎯</span>
          <span className="avatar-capacity-item__value">{capacity?.focusCostMax || 5}</span>
          <span className="avatar-capacity-item__label">Max Focus</span>
        </div>
        <div className="avatar-capacity-item">
          <span className="avatar-capacity-item__icon">💪</span>
          <span className="avatar-capacity-item__value">{capacity?.effortScoreMax || 5}</span>
          <span className="avatar-capacity-item__label">Max Effort</span>
        </div>
        <div className="avatar-capacity-item">
          <span className="avatar-capacity-item__icon">⏱️</span>
          <span className="avatar-capacity-item__value">{capacity?.timeBudgetMin || 120}</span>
          <span className="avatar-capacity-item__label">Time (min)</span>
        </div>
      </div>
    </div>
  );
}

export default KnowledgePanel;
