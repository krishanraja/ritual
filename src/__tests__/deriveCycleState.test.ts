/**
 * Unit tests for deriveCycleState
 * 
 * Tests the cycle state derivation logic that determines UI flow.
 * 
 * Run with: npx vitest run src/__tests__/deriveCycleState.test.ts
 * 
 * @created 2025-12-22
 */

import { describe, it, expect } from 'vitest';
import { deriveCycleState, canRetrySynthesis, type CycleState, type WeeklyCycle } from '../types/database';

// Mock base cycle data
const createMockCycle = (overrides: Partial<WeeklyCycle> = {}): WeeklyCycle => ({
  id: 'test-cycle-id',
  couple_id: 'test-couple-id',
  week_start_date: '2025-12-22',
  partner_one_input: null,
  partner_two_input: null,
  synthesized_output: null,
  generated_at: null,
  agreement_reached: false,
  agreed_ritual: null,
  agreed_at: null,
  completed_at: null,
  partner_one_submitted_at: null,
  partner_two_submitted_at: null,
  partner_one_ranking: null,
  partner_two_ranking: null,
  nudged_at: null,
  scheduled_for: null,
  ritual_index: null,
  surprise_mode: false,
  surprise_ritual: null,
  completion_note: null,
  completion_photo_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('deriveCycleState', () => {
  const userId = 'test-user-id';

  describe('edge cases', () => {
    it('returns "no_cycle" when cycle is null', () => {
      expect(deriveCycleState(null, userId, true)).toBe('no_cycle');
    });

    it('returns "no_cycle" when userId is undefined', () => {
      expect(deriveCycleState(createMockCycle(), undefined, true)).toBe('no_cycle');
    });

    it('returns "no_cycle" when both are null/undefined', () => {
      expect(deriveCycleState(null, undefined, true)).toBe('no_cycle');
    });
  });

  describe('waiting states', () => {
    it('returns "waiting_for_self" when partner_one has not submitted (as partner_one)', () => {
      const cycle = createMockCycle({
        partner_one_input: null,
        partner_two_input: { cards: ['relaxation'] },
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('waiting_for_self');
    });

    it('returns "waiting_for_self" when partner_two has not submitted (as partner_two)', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: null,
      });
      expect(deriveCycleState(cycle, userId, false)).toBe('waiting_for_self');
    });

    it('returns "waiting_for_partner" when partner_one submitted but partner_two has not (as partner_one)', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: null,
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('waiting_for_partner');
    });

    it('returns "waiting_for_partner" when partner_two submitted but partner_one has not (as partner_two)', () => {
      const cycle = createMockCycle({
        partner_one_input: null,
        partner_two_input: { cards: ['relaxation'] },
      });
      expect(deriveCycleState(cycle, userId, false)).toBe('waiting_for_partner');
    });
  });

  describe('both complete state', () => {
    it('returns "both_complete" when both submitted and no generated_at', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: { cards: ['relaxation'] },
        generated_at: null,
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('both_complete');
    });
  });

  describe('generating state', () => {
    it('returns "generating" when generated_at is recent', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: { cards: ['relaxation'] },
        generated_at: new Date().toISOString(), // Just now
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('generating');
    });
  });

  describe('failed state', () => {
    it('returns "failed" when generated_at is more than 2 minutes ago without output', () => {
      const twoMinutesAgo = new Date(Date.now() - 130000).toISOString();
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: { cards: ['relaxation'] },
        generated_at: twoMinutesAgo,
        synthesized_output: null,
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('failed');
    });
  });

  describe('ready state', () => {
    it('returns "ready" when synthesized_output exists', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: { cards: ['relaxation'] },
        synthesized_output: { rituals: [{ title: 'Date Night' }] },
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('ready');
    });
  });

  describe('agreed state', () => {
    it('returns "agreed" when agreement_reached and agreed_ritual exist', () => {
      const cycle = createMockCycle({
        partner_one_input: { cards: ['adventure'] },
        partner_two_input: { cards: ['relaxation'] },
        synthesized_output: { rituals: [{ title: 'Date Night' }] },
        agreement_reached: true,
        agreed_ritual: { title: 'Date Night' },
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('agreed');
    });

    it('agreed state takes precedence over ready state', () => {
      const cycle = createMockCycle({
        synthesized_output: { rituals: [] },
        agreement_reached: true,
        agreed_ritual: { title: 'Test' },
      });
      expect(deriveCycleState(cycle, userId, true)).toBe('agreed');
    });
  });
});

describe('canRetrySynthesis', () => {
  it('returns false when cycle is null', () => {
    expect(canRetrySynthesis(null)).toBe(false);
  });

  it('returns falsy when only partner_one has input', () => {
    const cycle = createMockCycle({
      partner_one_input: { cards: [] },
      partner_two_input: null,
    });
    expect(canRetrySynthesis(cycle)).toBeFalsy();
  });

  it('returns falsy when only partner_two has input', () => {
    const cycle = createMockCycle({
      partner_one_input: null,
      partner_two_input: { cards: [] },
    });
    expect(canRetrySynthesis(cycle)).toBeFalsy();
  });

  it('returns true when both have input but no output', () => {
    const cycle = createMockCycle({
      partner_one_input: { cards: [] },
      partner_two_input: { cards: [] },
      synthesized_output: null,
    });
    expect(canRetrySynthesis(cycle)).toBe(true);
  });

  it('returns false when output already exists', () => {
    const cycle = createMockCycle({
      partner_one_input: { cards: [] },
      partner_two_input: { cards: [] },
      synthesized_output: { rituals: [] },
    });
    expect(canRetrySynthesis(cycle)).toBe(false);
  });
});


