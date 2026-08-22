// PAHAM Language Learning Architecture — Comprehensive Test Suite
// Validates Language Registry, Competencies, Vocab, Grammar, Decoupled Hanzi, Tones, FSRS, AI Tutor, and School Linking

import { describe, it, expect, beforeEach } from 'vitest';
import { languageLearningEngine } from './core/LanguageLearningEngine';
import { PlacementQuestionValidator } from './placement/PlacementQuestionValidator';
import './core/bootstrapData';

describe('PAHAM First-Class Foreign Language Architecture Suite', () => {

  describe('1. Centralized Language Registry', () => {
    it('initializes default English (CEFR) and Mandarin (GF0025) languages', () => {
      const allLangs = languageLearningEngine.registry.getAllLanguages();
      expect(allLangs.length).toBeGreaterThanOrEqual(2);

      const en = languageLearningEngine.registry.getLanguage('en');
      expect(en).toBeDefined();
      expect(en?.proficiencyFramework).toBe('CEFR');
      expect(en?.levelIds).toContain('A1');
      expect(en?.levelIds).toContain('C2');

      const zh = languageLearningEngine.registry.getLanguage('zh-CN');
      expect(zh).toBeDefined();
      expect(zh?.proficiencyFramework).toBe('GF0025');
      expect(zh?.hasCharacterSystem).toBe(true);
      expect(zh?.hasTonalSystem).toBe(true);
    });

    it('allows dynamic registration of future languages without engine modification', () => {
      languageLearningEngine.registry.registerLanguage({
        id: 'es',
        name: 'Bahasa Spanyol (Español)',
        nativeName: 'Español',
        flagEmoji: '🇪🇸',
        locale: 'es-ES',
        script: 'Latin',
        writingSystem: 'ALPHABETIC',
        proficiencyFramework: 'CEFR',
        levelIds: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        levelLabels: { 'A1': 'A1 Acceso', 'B2': 'B2 Avanzado' },
        supportedSkills: ['LISTENING', 'READING', 'SPEAKING', 'WRITING', 'VOCABULARY', 'GRAMMAR'],
        hasCharacterSystem: false,
        hasTonalSystem: false,
        colorTheme: {
          primary: '#eab308',
          secondary: '#ca8a04',
          accent: '#facc15',
          bgBadge: 'bg-yellow-950 text-yellow-300 border-yellow-800',
          border: 'border-yellow-700/50',
        },
      });

      expect(languageLearningEngine.registry.isLanguageSupported('es')).toBe(true);
      const es = languageLearningEngine.registry.getLanguage('es');
      expect(es?.name).toContain('Español');
    });
  });

  describe('2. Universal Skill & Competency Engine', () => {
    it('aggregates evidence and updates mastery score and state correctly', () => {
      const compId = 'en_comp_a1_present_simple';
      const initial = languageLearningEngine.skills.getCompetenciesByLanguage('en').find(c => c.id === compId);
      expect(initial).toBeDefined();

      const updated = languageLearningEngine.skills.recordEvidence(compId, true, 1.5);
      expect(updated).toBeDefined();
      expect(updated!.evidenceCount).toBeGreaterThan(0);
      expect(updated!.masteryScore).toBeGreaterThanOrEqual(70);
    });

    it('calculates skill breakdown across competency domains', () => {
      const breakdown = languageLearningEngine.skills.getSkillTypeBreakdown('zh-CN');
      expect(breakdown).toBeDefined();
      expect(typeof breakdown.TONES).toBe('number');
      expect(typeof breakdown.CHARACTERS).toBe('number');
    });
  });

  describe('3. Vocabulary Engine with IPA and Collocations', () => {
    it('retrieves English words with IPA, definitions, and collocations', () => {
      const vocab = languageLearningEngine.vocabulary.getItem('en_vocab_accomplish');
      expect(vocab).toBeDefined();
      expect(vocab?.ipa).toBe('/əˈkʌm.plɪʃ/');
      expect(vocab?.collocations).toContain('accomplish a goal');
      expect(vocab?.exampleSentences.length).toBeGreaterThan(0);
    });

    it('searches across Hanzi, Pinyin, and translations seamlessly', () => {
      const resultsZh = languageLearningEngine.vocabulary.search('zh-CN', 'nǐ hǎo');
      expect(resultsZh.length).toBeGreaterThan(0);
      expect(resultsZh[0].hanzi).toBe('你好');

      const resultsEn = languageLearningEngine.vocabulary.search('en', 'mencapai');
      expect(resultsEn.length).toBeGreaterThan(0);
      expect(resultsEn[0].word).toBe('accomplish');
    });
  });

  describe('4. Grammar Engine with Structural Formulas & Error Analysis', () => {
    it('stores structural formulas and common mistake diagnostics', () => {
      const gramEn = languageLearningEngine.grammar.getGrammar('en_gram_conditionals_type2');
      expect(gramEn).toBeDefined();
      expect(gramEn?.patternFormula).toContain('If + Subject + Past Simple');
      expect(gramEn?.commonMistakes.length).toBeGreaterThan(0);

      const gramZh = languageLearningEngine.grammar.getGrammar('zh_gram_word_order');
      expect(gramZh).toBeDefined();
      expect(gramZh?.patternFormula).toContain('时间 (Waktu)');
    });
  });

  describe('5. Mandarin Pronunciation & Tone Subsystems', () => {
    it('provides 4 tones, tone contours, and initials metadata', () => {
      const tones = languageLearningEngine.pronunciation.getMandarinTones();
      expect(tones.length).toBe(5); // 4 tones + neutral
      expect(tones[0].pitchContour).toBe('55');
      expect(tones[2].pitchContour).toBe('214');

      const initials = languageLearningEngine.pronunciation.getMandarinInitials();
      expect(initials.length).toBe(21);
      expect(initials.map(i => i.letter)).toContain('zh');
      expect(initials.map(i => i.letter)).toContain('q');
    });

    it('manages 2-syllable Tone Pair combinations', () => {
      const pairs = languageLearningEngine.pronunciation.getAllTonePairs();
      expect(pairs.length).toBeGreaterThanOrEqual(15);
      const tone1Pairs = languageLearningEngine.pronunciation.getTonePairsByCombination(1, 1);
      expect(tone1Pairs.length).toBeGreaterThan(0);
      expect(tone1Pairs[0].word).toBe('飞机');
    });
  });

  describe('6. Decoupled Chinese Character (Hanzi) Engine', () => {
    it('tracks Character Recognition separately from Character Production (Writing)', () => {
      const char = languageLearningEngine.characters.getCharacter('好');
      expect(char).toBeDefined();
      expect(char?.radical).toContain('女');
      expect(char?.strokeCount).toBe(6);

      // Record recognition success
      const updatedRec = languageLearningEngine.characters.recordMastery('好', 'RECOGNITION', true);
      expect(updatedRec?.recognitionMastery).toBeGreaterThanOrEqual(85);

      // Record writing failure (e.g. stroke order mistake)
      const updatedWrite = languageLearningEngine.characters.recordMastery('好', 'WRITING', false);
      expect(updatedWrite?.writingMastery).toBeLessThan(updatedRec!.recognitionMastery);
    });

    it('identifies characters with high recognition-writing mastery gap', () => {
      const gapList = languageLearningEngine.characters.getRecognitionWritingGap();
      expect(Array.isArray(gapList)).toBe(true);
    });
  });

  describe('7. Universal Exercise Engine & Evaluator', () => {
    it('evaluates multiple choice and fill-in-the-blank answers with adaptive difficulty scoring', () => {
      const ex = languageLearningEngine.exercises.getExercise('en_ex_01_present_simple');
      expect(ex).toBeDefined();

      const correctAttempt = languageLearningEngine.exercises.evaluateAttempt(ex!.id, 'studies', 3);
      expect(correctAttempt.isCorrect).toBe(true);
      expect(correctAttempt.difficultyRated).toBe('VERY_EASY'); // Fast response < 4s

      const wrongAttempt = languageLearningEngine.exercises.evaluateAttempt(ex!.id, 'study', 25);
      expect(wrongAttempt.isCorrect).toBe(false);
      expect(wrongAttempt.difficultyRated).toBe('TOO_HARD'); // Slow failed response > 20s
    });
  });

  describe('8. FSRS v4 Spaced Repetition Review Integration', () => {
    it('schedules language items into FSRS memory intervals', () => {
      const userId = 'student_test_1';
      const res = languageLearningEngine.reviews.recordReview(
        userId,
        'en',
        'VOCABULARY',
        'en_vocab_accomplish',
        3 // Good rating
      );

      expect(res.updatedState.masteryScore).toBeGreaterThan(0);
      expect(res.nextReviewDue).toBeDefined();
      expect(res.intervalDays).toBeGreaterThanOrEqual(0);

      const summary = languageLearningEngine.reviews.getReviewQueueSummary(userId, 'en');
      expect(summary.totalTrackedItems).toBe(1);
    });
  });

  describe('9. Diagnostic Placement Assessment Engine', () => {
    it('generates multi-level diagnostic test and recommends appropriate starting level', () => {
      const diagQuestions = languageLearningEngine.assessments.generateDiagnosticTest('en');
      expect(diagQuestions.length).toBeGreaterThan(0);

      const mockAnswers = diagQuestions.map((q, idx) => ({
        exerciseId: q.id,
        userAnswer: idx % 2 === 0 ? (Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer) : 'wrong',
        isCorrect: idx % 2 === 0,
      }));

      const result = languageLearningEngine.assessments.evaluateDiagnostic('en', 'test_user', mockAnswers);
      expect(result.recommendedLevel).toBeDefined();
      expect(result.studyPathRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('10. School-First Curriculum Linking', () => {
    it('links school syllabus chapters to language vocabulary and grammar', () => {
      const enLinks = languageLearningEngine.school.getLinksByLanguage('en');
      expect(enLinks.length).toBeGreaterThan(0);

      const chapterObjects = languageLearningEngine.school.getChapterLearningObjects('sub-bing', 'ch-eng-narrative');
      expect(chapterObjects.vocabulary.length).toBeGreaterThan(0);
      expect(chapterObjects.grammar.length).toBeGreaterThan(0);
    });
  });

  describe('11. Pedagogical Language AI Tutor Engine', () => {
    it('provides scaffolded guidance with hint progression', async () => {
      const responseEn = await languageLearningEngine.tutor.respondToLearner(
        'Why do we say "She works" but "They work"?',
        'en',
        'A1',
        { stage: 'EXPLAIN' }
      );

      expect(responseEn.tutorResponse).toBeDefined();
      expect(responseEn.suggestedFollowUp?.length).toBeGreaterThan(0);
    });
  });

  describe('12. Redesigned Multi-Dimensional Adaptive Placement Suite', () => {
    it('validates placement questions with PlacementQuestionValidator and rejects malformed items', () => {
      const validQ: import('./placement/types').PlacementQuestion = {
        id: 'test_q_valid',
        languageId: 'en',
        testedSkill: 'GRAMMAR',
        targetLevel: 'A1',
        difficultyIndex: 0.25,
        discriminationIndex: 0.8,
        questionType: 'GRAMMAR_COMPLETION',
        instruction: 'Choose the correct word:',
        prompt: 'She _____ to school.',
        options: ['goes', 'go', 'going'],
        correctAnswer: 'goes',
        explanation: 'Subject She requires verb with -s.',
        diagnosticTags: ['present_simple'],
      };

      const validResult = PlacementQuestionValidator.validate(validQ);
      expect(validResult.isValid).toBe(true);

      const invalidQ: import('./placement/types').PlacementQuestion = {
        ...validQ,
        options: ['goes', 'goes'], // duplicate option & missing distinct choices
      };
      const invalidResult = PlacementQuestionValidator.validate(invalidQ);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('creates adaptive placement session and dynamically selects next question by skill uncertainty', () => {
      const session = languageLearningEngine.assessments.adaptive.createSession('test_user_adaptive', 'en');
      expect(session.sessionId).toBeDefined();
      expect(session.targetSkills).toContain('GRAMMAR');
      expect(session.targetSkills).toContain('VOCABULARY');
      expect(session.status).toBe('IN_PROGRESS');

      const firstQ = languageLearningEngine.assessments.adaptive.selectNextQuestion(session);
      expect(firstQ).toBeDefined();
      expect(firstQ?.languageId).toBe('en');

      // Record first answer with high confidence
      const { attempt, updatedEstimate } = languageLearningEngine.assessments.adaptive.recordAnswer(
        session,
        firstQ!.id,
        firstQ!.correctAnswer,
        5, // VERY_CONFIDENT
        4
      );

      expect(attempt.isCorrect).toBe(true);
      expect(attempt.diagnosticCategory).toBe('VERIFIED_MASTERY');
      expect(updatedEstimate.abilityScore).toBeGreaterThan(30);
      expect(updatedEstimate.uncertainty).toBeLessThan(0.85);
    });

    it('detects critical misconceptions when high confidence meets incorrect answer', () => {
      const session = languageLearningEngine.assessments.adaptive.createSession('test_user_misc', 'zh-CN');
      const q = languageLearningEngine.assessments.adaptive.selectNextQuestion(session);
      expect(q).toBeDefined();

      // Answer wrongly with confidence 5
      const { attempt } = languageLearningEngine.assessments.adaptive.recordAnswer(
        session,
        q!.id,
        'wrong_option_test',
        5, // VERY_CONFIDENT but WRONG
        6
      );

      expect(attempt.isCorrect).toBe(false);
      expect(attempt.diagnosticCategory).toBe('CRITICAL_MISCONCEPTION');

      const report = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session);
      expect(report.misconceptions.length).toBeGreaterThan(0);
      expect(report.misconceptions[0].remedialSuggestion).toBeDefined();
    });

    it('decouples Mandarin skills into Hanzi, Tones, Grammar, and Vocabulary profiles', () => {
      const session = languageLearningEngine.assessments.adaptive.createSession('test_user_mandarin', 'zh-CN');
      
      // Simulate answering tone question correctly and grammar question incorrectly
      const toneQ = Array.from((languageLearningEngine.assessments.adaptive as any).questionBank.values())
        .find((q: any) => q.languageId === 'zh-CN' && q.testedSkill === 'TONES') as import('./placement/types').PlacementQuestion | undefined;
      const charQ = Array.from((languageLearningEngine.assessments.adaptive as any).questionBank.values())
        .find((q: any) => q.languageId === 'zh-CN' && q.testedSkill === 'CHARACTERS') as import('./placement/types').PlacementQuestion | undefined;

      if (toneQ && charQ) {
        languageLearningEngine.assessments.adaptive.recordAnswer(session, toneQ.id, toneQ.correctAnswer, 5, 3);
        languageLearningEngine.assessments.adaptive.recordAnswer(session, charQ.id, 'wrong_hanzi', 2, 8);

        const report = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session);
        expect(report.skillEstimates.TONES.abilityScore).toBeGreaterThan(report.skillEstimates.CHARACTERS.abilityScore);
        expect(report.framework).toBe('GF0025');
        expect(report.schoolReadiness.status).toBeDefined();
      }
    });

    it('bridges placement diagnostic report into FSRS seeds and PAMI companion recommendations', async () => {
      const session = languageLearningEngine.assessments.adaptive.createSession('test_user_bridge', 'en');
      const q = languageLearningEngine.assessments.adaptive.selectNextQuestion(session);
      if (q) {
        languageLearningEngine.assessments.adaptive.recordAnswer(session, q.id, 'wrong_ans', 5, 5); // creates misconception
        const report = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session);
        
        const bridgeRes = await languageLearningEngine.assessments.bridge.applyPlacementResults(report);
        expect(bridgeRes.fsrsCardsCreatedCount).toBeGreaterThanOrEqual(1);
        expect(bridgeRes.recommendationCreated).toBe(true);
      }
    });

    it('compares previous placement with current placement and reports skill deltas', () => {
      const session1 = languageLearningEngine.assessments.adaptive.createSession('test_user_retest', 'en');
      const prevReport = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session1);

      const session2 = languageLearningEngine.assessments.adaptive.createSession('test_user_retest', 'en');
      // answer all questions correctly in session 2
      const q = languageLearningEngine.assessments.adaptive.selectNextQuestion(session2);
      if (q) {
        languageLearningEngine.assessments.adaptive.recordAnswer(session2, q.id, q.correctAnswer, 5, 3);
      }
      const currentReport = languageLearningEngine.assessments.adaptive.generateDiagnosticReport(session2, prevReport);

      expect(currentReport.comparisonWithPrevious).toBeDefined();
      expect(currentReport.comparisonWithPrevious?.previousOverallLevel).toBeDefined();
      expect(currentReport.comparisonWithPrevious?.skillDeltas.length).toBeGreaterThan(0);
    });
  });

});

