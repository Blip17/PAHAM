// Daily Study Planner Engine for PAHAM
// Generates the daily personalized learning schedule answering: 'Apa yang harus aku pelajari sekarang?'

import { 
  Concept, 
  StudentConceptState, 
  Subject, 
  Chapter, 
  Exam, 
  DailyStudyPlan, 
  DailyStudyItem 
} from './types';
import { masteryEngine } from './masteryEngine';

export class StudyPlannerEngine {
  /**
   * Generates the optimized daily study plan
   */
  public generateDailyPlan(
    concepts: Concept[],
    studentStates: Map<string, StudentConceptState>,
    subjects: Subject[],
    chapters: Chapter[],
    exams: Exam[],
    targetMinutes: number = 25
  ): DailyStudyPlan {
    const todayStr = new Date().toISOString().split('T')[0];
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const chapterMap = new Map(chapters.map(c => [c.id, c]));

    // Find closest urgent exam
    const now = new Date();
    const activeExams = exams
      .map(exam => {
        const diffDays = Math.ceil((new Date(exam.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { exam, diffDays };
      })
      .filter(e => e.diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays);

    const closestExam = activeExams.length > 0 ? activeExams[0] : null;

    // Evaluate all concepts
    const evaluatedItems: Array<{
      concept: Concept;
      state?: StudentConceptState;
      priority: number;
      readiness: number;
      mode: 'learn' | 'recall' | 'practice' | 'review' | 'rescue';
      isDue: boolean;
      hasMistakes: boolean;
      isExamScope: boolean;
    }> = [];

    concepts.forEach(concept => {
      const state = studentStates.get(concept.id);
      const evalResult = masteryEngine.evaluateConcept(concept, state, exams);
      const isExamScope = closestExam ? closestExam.exam.coveredChapterIds.includes(concept.chapterId) : false;
      const isDue = state ? new Date(state.fsrs.due) <= now : true;
      const hasMistakes = (state?.commonMistakes.length || 0) > 0;

      let priority = evalResult.priorityScore;
      if (isExamScope && closestExam && closestExam.diffDays <= 4) {
        priority += 40;
      }

      evaluatedItems.push({
        concept,
        state,
        priority,
        readiness: evalResult.readinessPercentage,
        mode: evalResult.recommendedMode,
        isDue,
        hasMistakes,
        isExamScope,
      });
    });

    // Sort by priority descending
    evaluatedItems.sort((a, b) => b.priority - a.priority);

    // Pick top items to fill target daily time
    let allocatedMinutes = 0;
    const planItems: DailyStudyItem[] = [];

    // 1. Ensure the most urgent weak/exam item is chosen first (Hero item)
    for (const item of evaluatedItems) {
      if (allocatedMinutes >= targetMinutes) break;

      const subject = subjectMap.get(item.concept.subjectId);
      const chapter = chapterMap.get(item.concept.chapterId);
      if (!subject || !chapter) continue;

      let estimatedTime = 7; // default 7 min
      if (item.mode === 'learn') estimatedTime = 9;
      else if (item.mode === 'practice') estimatedTime = 8;
      else if (item.mode === 'review') estimatedTime = 6;
      else if (item.mode === 'rescue') estimatedTime = 9;

      let reason = 'Review terjadwal untuk menjaga daya ingat.';
      let priorityType: DailyStudyItem['priorityType'] = 'fsrs_due';
      let urgencyLevel: DailyStudyItem['urgencyLevel'] = 'medium';

      if (item.isExamScope && closestExam && closestExam.diffDays <= 4) {
        priorityType = 'urgent_exam';
        urgencyLevel = 'high';
        if (item.hasMistakes) {
          reason = `Konsep ini masih sering tertukar dan ulanganmu tinggal ${closestExam.diffDays} hari.`;
        } else {
          reason = `Materi penting untuk ulangan ${closestExam.diffDays} hari lagi.`;
        }
      } else if (item.hasMistakes || item.readiness < 50) {
        priorityType = 'weak_mastery';
        urgencyLevel = 'high';
        reason = 'Akurasi pemahaman masih rendah pada latihan sebelumnya.';
      } else if (!item.state) {
        priorityType = 'new_material';
        urgencyLevel = 'medium';
        reason = 'Materi baru yang belum pernah dipelajari.';
      }

      planItems.push({
        id: `plan-${item.concept.id}`,
        subjectId: subject.id,
        subjectName: subject.name,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        conceptId: item.concept.id,
        conceptTitle: item.concept.title,
        priorityType,
        mode: item.mode,
        estimatedMinutes: estimatedTime,
        reason,
        urgencyLevel,
        isCompleted: false,
      });

      allocatedMinutes += estimatedTime;

      // Limit to 3-4 items max per day to maintain student focus
      if (planItems.length >= 4) break;
    }

    let urgentExamInfo = undefined;
    if (closestExam) {
      const examReadiness = masteryEngine.evaluateExamReadiness(
        closestExam.exam,
        concepts,
        studentStates
      );
      urgentExamInfo = {
        examId: closestExam.exam.id,
        subjectName: subjectMap.get(closestExam.exam.subjectId)?.name || 'Ujian',
        daysRemaining: closestExam.diffDays,
        readinessScore: examReadiness.overallReadiness,
      };
    }

    return {
      date: todayStr,
      totalEstimatedMinutes: allocatedMinutes > 0 ? allocatedMinutes : 21,
      items: planItems,
      urgentExam: urgentExamInfo,
    };
  }
}

export const studyPlanner = new StudyPlannerEngine();
