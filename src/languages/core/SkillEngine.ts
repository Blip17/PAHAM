// Universal Skill & Competency Engine for PAHAM Language Architecture
// Aggregates evidence, computes mastery, and tracks CEFR/GF0025 skill progression

import { SkillCompetency, SkillType, SupportedLanguageId, MasteryState } from './types';

export class SkillEngine {
  private competencies: Map<string, SkillCompetency> = new Map();

  /**
   * Register or update a competency
   */
  public registerCompetency(comp: SkillCompetency): void {
    this.competencies.set(comp.id, comp);
  }

  /**
   * Register a batch of competencies
   */
  public registerBatch(comps: SkillCompetency[]): void {
    comps.forEach(c => this.registerCompetency(c));
  }

  /**
   * Get all competencies for a given language
   */
  public getCompetenciesByLanguage(languageId: SupportedLanguageId): SkillCompetency[] {
    return Array.from(this.competencies.values()).filter(c => c.languageId === languageId);
  }

  /**
   * Get competencies for a specific level and language
   */
  public getCompetenciesByLevel(languageId: SupportedLanguageId, level: string): SkillCompetency[] {
    return Array.from(this.competencies.values()).filter(
      c => c.languageId === languageId && c.level === level
    );
  }

  /**
   * Get competencies for a specific skill type (e.g. LISTENING, CHARACTERS, GRAMMAR)
   */
  public getCompetenciesBySkillType(languageId: SupportedLanguageId, skillType: SkillType): SkillCompetency[] {
    return Array.from(this.competencies.values()).filter(
      c => c.languageId === languageId && c.skillType === skillType
    );
  }

  /**
   * Record learning evidence and recalculate mastery score and state
   */
  public recordEvidence(
    competencyId: string,
    isSuccess: boolean,
    weight: number = 1.0
  ): SkillCompetency | undefined {
    const comp = this.competencies.get(competencyId);
    if (!comp) return undefined;

    comp.evidenceCount += 1;
    comp.lastPracticedAt = new Date().toISOString();

    const change = isSuccess ? 12 * weight : -10 * weight;
    comp.masteryScore = Math.max(0, Math.min(100, Math.round(comp.masteryScore + change)));

    comp.masteryState = this.calculateMasteryState(comp.masteryScore, comp.evidenceCount);
    this.competencies.set(competencyId, comp);

    return comp;
  }

  /**
   * Calculate mastery state from score and evidence
   */
  public calculateMasteryState(score: number, evidenceCount: number): MasteryState {
    if (evidenceCount === 0 || score === 0) return 'UNSEEN';
    if (score < 40) return 'LEARNING';
    if (score < 80) return 'FAMILIAR';
    return 'MASTERED';
  }

  /**
   * Calculate overall language proficiency mastery percentage
   */
  public calculateOverallMastery(languageId: SupportedLanguageId, level?: string): number {
    const comps = level
      ? this.getCompetenciesByLevel(languageId, level)
      : this.getCompetenciesByLanguage(languageId);

    if (comps.length === 0) return 0;
    const totalScore = comps.reduce((acc, c) => acc + c.masteryScore, 0);
    return Math.round(totalScore / comps.length);
  }

  /**
   * Get radar breakdown by skill types for a language
   */
  public getSkillTypeBreakdown(languageId: SupportedLanguageId): Record<SkillType, number> {
    const comps = this.getCompetenciesByLanguage(languageId);
    const breakdown: Partial<Record<SkillType, { total: number; count: number }>> = {};

    comps.forEach(c => {
      if (!breakdown[c.skillType]) {
        breakdown[c.skillType] = { total: 0, count: 0 };
      }
      breakdown[c.skillType]!.total += c.masteryScore;
      breakdown[c.skillType]!.count += 1;
    });

    const result: Partial<Record<SkillType, number>> = {};
    for (const [skill, val] of Object.entries(breakdown)) {
      result[skill as SkillType] = Math.round(val.total / Math.max(1, val.count));
    }

    return result as Record<SkillType, number>;
  }
}

export const skillEngine = new SkillEngine();
