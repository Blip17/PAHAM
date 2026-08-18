// Study Method Advisor Modal for PAHAM
// Implements section 23: "Aku harus belajar gimana?" with personalized mode breakdown

import React from 'react';
import { 
  X, 
  BookOpen, 
  RotateCcw, 
  Target, 
  Flame, 
  LifeBuoy, 
  ArrowRight,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Concept, StudentConceptState, Subject, Chapter, Exam } from '../core/types';
import { masteryEngine } from '../core/masteryEngine';

interface StudyAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: Concept[];
  studentStates: Map<string, StudentConceptState>;
  subjects: Subject[];
  chapters: Chapter[];
  exams: Exam[];
  onStartStudy: (conceptId: string) => void;
}

export const StudyAdvisorModal: React.FC<StudyAdvisorModalProps> = ({
  isOpen,
  onClose,
  concepts,
  studentStates,
  subjects,
  chapters,
  exams,
  onStartStudy,
}) => {
  if (!isOpen) return null;

  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const chapterMap = new Map(chapters.map(c => [c.id, c]));

  // Evaluate all concepts for recommendations
  const adviceList = concepts.map(concept => {
    const state = studentStates.get(concept.id);
    const evalRes = masteryEngine.evaluateConcept(concept, state, exams);
    const subject = subjectMap.get(concept.subjectId);
    const chapter = chapterMap.get(concept.chapterId);

    let methodTitle = 'Active Recall';
    let methodDesc = 'Uji ingatan dengan menjawab tanpa melihat catatan.';
    let icon = RotateCcw;
    let badgeClass = 'badge-moss';

    switch (evalRes.recommendedMode) {
      case 'learn':
        methodTitle = 'Learn Mode (Pahami dari Dasar)';
        methodDesc = 'Konsep baru atau belum stabil. Baca rujukan guru, telaah contoh nyata, lalu jelaskan dengan kata-kata sendiri.';
        icon = BookOpen;
        badgeClass = 'badge-neutral';
        break;
      case 'recall':
        methodTitle = 'Recall Mode (Pengingatan Aktif)';
        methodDesc = 'Konsep sudah dipahami tapi retensi memori mulai menurun. Jawab 3-5 pertanyaan tanpa melihat contekan.';
        icon = RotateCcw;
        badgeClass = 'badge-moss';
        break;
      case 'practice':
        methodTitle = 'Practice Mode (Latihan Kasus)';
        methodDesc = 'Definisi sudah hafal tapi sering keliru dalam soal kasus. Fokus pada pembedaan opsi mirip dan analisis jebakan.';
        icon = Target;
        badgeClass = 'badge-amber';
        break;
      case 'review':
        methodTitle = 'Review Mode (FSRS Due)';
        methodDesc = 'Kartu memori jatuh tempo hari ini. Review 5 menit untuk memperkuat stabilitas jangka panjang.';
        icon = Flame;
        badgeClass = 'badge-moss';
        break;
      case 'rescue':
        methodTitle = 'Rescue Mode (Prioritas Ujian Cepat)';
        methodDesc = 'Ulangan tinggal hitungan hari dan konsep ini rawan salah. Kerjakan ringkasan poin kunci & soal prediksi.';
        icon = LifeBuoy;
        badgeClass = 'badge-terracotta';
        break;
    }

    return {
      concept,
      subject,
      chapter,
      evalRes,
      methodTitle,
      methodDesc,
      icon,
      badgeClass,
      mode: evalRes.recommendedMode,
    };
  });

  // Sort by priority (rescue & practice first)
  adviceList.sort((a, b) => b.evalRes.priorityScore - a.evalRes.priorityScore);

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-paper-50 border border-paper-300 rounded shadow-modal max-w-2xl w-full p-6 sm:p-7 relative text-ink-900 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-paper-300 shrink-0">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block mb-1">
              Panduan Metode Belajar
            </span>
            <h2 className="text-2xl font-serif font-medium text-ink-950">
              "Aku harus belajar gimana?"
            </h2>
            <p className="text-xs text-ink-600 font-serif mt-0.5">
              Paham merekomendasikan teknik belajar spesifik untuk setiap konsep berdasarkan data memorimu.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto py-4 space-y-3 pr-1">
          {adviceList.map(({ concept, subject, chapter, evalRes, methodTitle, methodDesc, icon: Icon, badgeClass }) => (
            <div
              key={concept.id}
              className="p-4 rounded bg-paper-100/70 border border-paper-200 hover:bg-paper-150 transition space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-ink-500 uppercase">
                    {subject?.name} · {chapter?.title.split('—')[0]}
                  </span>
                  <h3 className="font-serif text-base font-medium text-ink-950">
                    {concept.title}
                  </h3>
                </div>
                <span className={badgeClass}>{evalRes.readinessPercentage}% Kesiapan</span>
              </div>

              <div className="p-2.5 bg-paper-50 rounded border border-paper-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-ink-900">
                  <Icon className="w-3.5 h-3.5 text-moss-800 shrink-0" />
                  <span>{methodTitle}</span>
                </div>
                <p className="text-ink-600 font-serif text-[11px] leading-relaxed">
                  {methodDesc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-ink-500">
                  Status: <strong>{evalRes.statusLabel}</strong>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onStartStudy(concept.id);
                  }}
                  className="btn-primary text-xs py-1 px-3 shadow-subtle"
                >
                  Mulai Metode Ini
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-paper-200 shrink-0 text-center text-[11px] text-ink-500 font-serif">
          Metode disesuaikan otomatis setiap kali kamu menjawab kuis atau menyelesaikan sesi latihan.
        </div>

      </div>
    </div>
  );
};
