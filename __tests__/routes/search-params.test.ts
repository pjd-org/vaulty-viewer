import { describe, expect, it } from 'vitest'
import {
  homeSearchParams,
  inboxSearchParams,
  actionsSearchParams,
  automationSearchParams,
  workSearchParams,
  knowledgeSearchParams,
  portfolioSearchParams,
  bubbleSearchParams,
  healthSearchParams,
  graphSearchParams,
  timelineSearchParams,
  archiveSearchParams,
  projectSearchParams,
} from '../../src/lib/routes/search-params'

describe('search-param schemas — canonical validateSearch contracts', () => {
  describe('homeSearchParams (/)', () => {
    it('parses snapshot and detailId', () => {
      expect(homeSearchParams({ snapshot: 'abc', detailId: 'note-1' })).toEqual({
        snapshot: 'abc',
        detailId: 'note-1',
      })
    })
    it('returns undefined for missing fields', () => {
      expect(homeSearchParams({})).toEqual({ snapshot: undefined, detailId: undefined })
    })
  })

  describe('inboxSearchParams (/inbox)', () => {
    it('parses view as enum', () => {
      expect(inboxSearchParams({ view: 'queue' }).view).toBe('queue')
      expect(inboxSearchParams({ view: 'workbench' }).view).toBe('workbench')
      expect(inboxSearchParams({ view: 'archive' }).view).toBe('archive')
    })
    it('rejects unknown view value', () => {
      expect(inboxSearchParams({ view: 'unknown' }).view).toBeUndefined()
    })
    it('parses V3 extra fields', () => {
      const r = inboxSearchParams({ view: 'queue', sort: 'newest', severity: 'high', selectedId: 'x' })
      expect(r.sort).toBe('newest')
      expect(r.severity).toBe('high')
      expect(r.selectedId).toBe('x')
    })
  })

  describe('actionsSearchParams (/actions)', () => {
    it('parses sort enum with live values', () => {
      const SORTS = ['urgency', 'impact', 'confidence', 'source', 'reversibility'] as const
      for (const s of SORTS) {
        expect(actionsSearchParams({ sort: s }).sort).toBe(s)
      }
    })
    it('rejects unknown sort', () => {
      expect(actionsSearchParams({ sort: 'priority' }).sort).toBeUndefined()
    })
    it('parses simulatableOnly', () => {
      expect(actionsSearchParams({ simulatableOnly: 'true' }).simulatableOnly).toBe(true)
    })
  })

  describe('automationSearchParams (/automation)', () => {
    it('parses tab enum', () => {
      expect(automationSearchParams({ tab: 'pipelines' }).tab).toBe('pipelines')
      expect(automationSearchParams({ tab: 'primary-agent' }).tab).toBe('primary-agent')
    })
    it('parses autoRefresh boolean', () => {
      expect(automationSearchParams({ autoRefresh: 'true' }).autoRefresh).toBe(true)
    })
  })

  describe('workSearchParams (/work)', () => {
    it('parses tab, status, selectedId', () => {
      expect(workSearchParams({ tab: 'tasks', status: 'todo', selectedId: 'w1' })).toEqual({
        tab: 'tasks',
        status: 'todo',
        selectedId: 'w1',
      })
    })
  })

  describe('knowledgeSearchParams (/knowledge)', () => {
    it('parses tab enum', () => {
      expect(knowledgeSearchParams({ tab: 'notes' }).tab).toBe('notes')
      expect(knowledgeSearchParams({ tab: 'memories' }).tab).toBe('memories')
    })
    it('rejects unknown tab', () => {
      expect(knowledgeSearchParams({ tab: 'invalid' }).tab).toBeUndefined()
    })
  })

  describe('portfolioSearchParams (/portfolio)', () => {
    it('parses tab and selectedId', () => {
      expect(portfolioSearchParams({ tab: 'projects', selectedId: 'p1' })).toEqual({
        tab: 'projects',
        selectedId: 'p1',
      })
    })
  })

  describe('bubbleSearchParams (/bubble)', () => {
    it('parses tab and selectedId', () => {
      expect(bubbleSearchParams({ tab: 'live', selectedId: 'b1' })).toEqual({
        tab: 'live',
        selectedId: 'b1',
      })
    })
  })

  describe('healthSearchParams (/health)', () => {
    it('parses tab and selectedId', () => {
      expect(healthSearchParams({ tab: 'checks', selectedId: 'h1' })).toEqual({
        tab: 'checks',
        selectedId: 'h1',
      })
    })
  })

  describe('graphSearchParams (/graph)', () => {
    it('parses live fields', () => {
      const r = graphSearchParams({ tab: 'graph', nodeId: 'n1', pathMode: 'shortest', entityType: 'task' })
      expect(r.tab).toBe('graph')
      expect(r.nodeId).toBe('n1')
      expect(r.pathMode).toBe('shortest')
      expect(r.entityType).toBe('task')
    })
    it('parses V3 extra fields', () => {
      expect(graphSearchParams({ focus: 'area-x', selectedId: 'n2' }).focus).toBe('area-x')
    })
  })

  describe('timelineSearchParams (/timeline)', () => {
    it('parses live fields', () => {
      const r = timelineSearchParams({ tab: 'all', selectedId: 't1', live: 'true', eventType: 'run' })
      expect(r.tab).toBe('all')
      expect(r.live).toBe(true)
      expect(r.eventType).toBe('run')
    })
    it('parses V3 extra fields from/to', () => {
      const r = timelineSearchParams({ from: '2026-01-01', to: '2026-03-01' })
      expect(r.from).toBe('2026-01-01')
      expect(r.to).toBe('2026-03-01')
    })
  })

  describe('archiveSearchParams (/archive)', () => {
    it('parses live fields', () => {
      const r = archiveSearchParams({ tab: 'user', selectedId: 'a1', source: 'inbox' })
      expect(r.tab).toBe('user')
      expect(r.selectedId).toBe('a1')
      expect(r.source).toBe('inbox')
    })
    it('parses V3 extra fields', () => {
      const r = archiveSearchParams({ scope: 'project', eventType: 'run', projectId: 'proj-1' })
      expect(r.scope).toBe('project')
      expect(r.eventType).toBe('run')
      expect(r.projectId).toBe('proj-1')
    })
  })

  describe('projectSearchParams (/project/:slug)', () => {
    it('parses tab, selectedId, noteId, and lane extras', () => {
      expect(
        projectSearchParams({
          tab: 'tasks',
          selectedId: 's1',
          noteId: 'note-2',
          mode: 'edit',
          templateId: 'tmpl-1',
          memoryTab: 'recent',
        }),
      ).toEqual({
        tab: 'tasks',
        selectedId: 's1',
        noteId: 'note-2',
        mode: 'edit',
        templateId: 'tmpl-1',
        memoryTab: 'recent',
      })
    })
  })

  describe('all schemas — empty input', () => {
    const schemas = [
      homeSearchParams,
      inboxSearchParams,
      actionsSearchParams,
      automationSearchParams,
      workSearchParams,
      knowledgeSearchParams,
      portfolioSearchParams,
      bubbleSearchParams,
      healthSearchParams,
      graphSearchParams,
      timelineSearchParams,
      archiveSearchParams,
      projectSearchParams,
    ]
    it.each(schemas)('%s returns an object (does not throw) on empty input', (schema) => {
      expect(() => schema({})).not.toThrow()
      expect(typeof schema({})).toBe('object')
    })
  })
})
