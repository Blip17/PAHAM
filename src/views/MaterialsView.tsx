// Materials View for PAHAM
// Digital Study Archive with Photo View, 16+ Subjects Selector, and Interactive Grounding

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Camera, 
  BookOpen, 
  Tag,
  Highlighter,
  Plus,
  Maximize2,
  X,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../core/db';
import { Material, Concept, Subject, Chapter, MaterialBlock } from '../core/types';
import { PahamMascot } from '../components/mascot/PahamMascot';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';

interface MaterialsViewProps {
  onStartStudyConcept: (conceptId: string) => void;
  onOpenScanModal: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  onStartStudyConcept,
  onOpenScanModal,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [activePageNumber, setActivePageNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Grounding Cross-Highlight State
  const [highlightedConceptId, setHighlightedConceptId] = useState<string | null>(null);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  // Fullscreen Photo Modal
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  // Add Subject Modal
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubCode, setNewSubCode] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const mats: Material[] = await db.materials.toArray();
      const concs: Concept[] = await db.concepts.toArray();
      const subs: Subject[] = await db.subjects.toArray();
      const chaps: Chapter[] = await db.chapters.toArray();

      setMaterials(mats);
      setConcepts(concs);
      setSubjects(subs);
      setChapters(chaps);

      if (mats.length > 0 && !selectedMaterial) {
        setSelectedMaterial(mats[0]);
      }
    }
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase() || newSubName.slice(0, 3).toUpperCase(),
      color: '#2D5A43',
      iconName: 'BookOpen',
      description: 'Mata pelajaran kustom',
    };

    await db.subjects.add(newSub);
    setSubjects(prev => [...prev, newSub]);
    setSelectedSubjectId(newSub.id);

    setIsAddSubjectModalOpen(false);
    setNewSubName('');
    setNewSubCode('');
  };

  const filteredMaterials = materials.filter((m: Material) => {
    const matchSubject = selectedSubjectId === 'all' || m.subjectId === selectedSubjectId;
    const matchSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  const getSubjectName = (subId: string) => subjects.find((s: Subject) => s.id === subId)?.name || 'Mata Pelajaran';
  const getChapterTitle = (chapId: string) => chapters.find((c: Chapter) => c.id === chapId)?.title || 'Bab';

  const getSourceBadge = (sourceType: Material['sourceType']) => {
    switch (sourceType) {
      case 'catatan_guru':
        return <span className="badge-moss">Catatan Guru</span>;
      case 'fotokopi':
        return <span className="badge-amber">Fotokopi</span>;
      case 'lembar_kerja':
        return <span className="badge-neutral">Lembar Kerja</span>;
      case 'pdf':
        return <span className="badge-neutral">PDF</span>;
      default:
        return <span className="badge-neutral">Catatan Pribadi</span>;
    }
  };

  const selectedMaterialConcepts = concepts.filter((c: Concept) => 
    c.sources.some(s => s.materialId === selectedMaterial?.id) ||
    c.chapterId === selectedMaterial?.chapterId
  );

  const handleConceptClick = (concept: Concept) => {
    setHighlightedConceptId(concept.id);
    if (concept.sources.length > 0) {
      const source = concept.sources[0];
      setActivePageNumber(source.pageNumber);
      const block = selectedMaterial?.blocks.find(b => 
        b.pageNumber === source.pageNumber && (b.extractedConcepts?.some(ec => concept.title.toLowerCase().includes(ec.toLowerCase())) || b.text.toLowerCase().includes(concept.title.toLowerCase()))
      );
      if (block) {
        setHighlightedBlockId(block.id);
      }
    }
  };

  const handleBlockClick = (block: MaterialBlock) => {
    setHighlightedBlockId(block.id);
    const matched = selectedMaterialConcepts.find(c => 
      block.extractedConcepts?.some(ec => c.title.toLowerCase().includes(ec.toLowerCase())) ||
      block.text.toLowerCase().includes(c.title.toLowerCase())
    );
    if (matched) {
      setHighlightedConceptId(matched.id);
    }
  };

  // Check if current page has an uploaded photo
  const currentPhotoUrl = selectedMaterial?.previewPages?.find(p => p.pageNumber === activePageNumber)?.imageUrl || selectedMaterial?.thumbnailUrl;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-300 pb-5">
        <div>
          <h1 className="text-3xl font-serif text-ink-950 font-normal">
            Materiku
          </h1>
          <p className="text-sm text-ink-600 font-serif mt-0.5">
            Semua yang pernah kamu pelajari, dalam satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="btn-secondary text-xs py-2 px-3 text-ink-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Mapel
          </button>

          <button
            onClick={onOpenScanModal}
            className="btn-primary text-xs py-2 px-4 shadow-subtle"
          >
            <Camera className="w-3.5 h-3.5" />
            Scan / Upload Foto Materi
          </button>
        </div>
      </div>

      {/* 16+ Subjects Navigation Pills Rail & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Scrollable Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full flex-1">
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={`px-3 py-1.5 text-xs rounded font-medium shrink-0 transition ${
                selectedSubjectId === 'all'
                  ? 'bg-ink-900 text-paper-50'
                  : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
              }`}
            >
              Semua ({subjects.length} Mapel)
            </button>
            {subjects.map((s: Subject) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3 py-1.5 text-xs rounded font-medium shrink-0 transition flex items-center gap-1 ${
                  selectedSubjectId === s.id
                    ? 'bg-ink-900 text-paper-50'
                    : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] opacity-70">({s.code})</span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[180px] shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper-50 border border-paper-300 pl-8 pr-3 py-1.5 text-xs rounded text-ink-900 placeholder:text-ink-400 focus:bg-paper-50 focus:border-moss-700"
            />
          </div>
        </div>
      </div>

      {/* Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Material Archive List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-ink-500 font-semibold block">
            Daftar Dokumen ({filteredMaterials.length})
          </span>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {filteredMaterials.map((mat: Material) => {
              const isSelected = selectedMaterial?.id === mat.id;
              return (
                <div
                  key={mat.id}
                  onClick={() => {
                    setSelectedMaterial(mat);
                    setActivePageNumber(1);
                    setHighlightedConceptId(null);
                    setHighlightedBlockId(null);
                  }}
                  className={`p-3.5 rounded cursor-pointer transition border ${
                    isSelected
                      ? 'bg-paper-50 border-moss-800 shadow-subtle'
                      : 'bg-paper-50/60 hover:bg-paper-150 border-paper-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {getSourceBadge(mat.sourceType)}
                    <span className="text-[10px] font-mono text-ink-400">
                      {new Date(mat.dateAdded).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <h3 className="font-serif text-sm font-medium text-ink-950 leading-snug line-clamp-2">
                    {mat.title}
                  </h3>

                  <p className="text-[11px] text-ink-500 mt-1 truncate">
                    {getSubjectName(mat.subjectId)} · {getChapterTitle(mat.chapterId).split('—')[0]}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-500 pt-2 border-t border-paper-200/60">
                    <span>{mat.pageCount} halaman</span>
                    {mat.thumbnailUrl || mat.previewPages ? (
                      <span className="text-moss-800 font-medium flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Foto Catatan
                      </span>
                    ) : mat.hasHandwriting ? (
                      <span className="text-moss-800 font-medium">✍️ Tulisan tangan</span>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {filteredMaterials.length === 0 && (
              <div className="p-8 text-center bg-paper-50 rounded border border-dashed border-paper-300 space-y-2">
                <FileText className="w-6 h-6 text-ink-400 mx-auto" />
                <p className="font-serif text-xs text-ink-600">Belum ada materi untuk mata pelajaran ini.</p>
                <button
                  onClick={onOpenScanModal}
                  className="btn-primary text-[11px] py-1 px-3"
                >
                  + Upload Materi Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Material Detail & Dual Understanding View (8 cols) */}
        <div className="lg:col-span-8">
          {selectedMaterial ? (
            <div className="paper-sheet p-6 space-y-6">
              
              {/* Document Header */}
              <div className="border-b border-paper-200 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-moss-800 font-semibold uppercase">
                    {getSubjectName(selectedMaterial.subjectId)} · {getChapterTitle(selectedMaterial.chapterId)}
                  </span>
                  {getSourceBadge(selectedMaterial.sourceType)}
                </div>
                <h2 className="text-2xl font-serif font-medium text-ink-950">
                  {selectedMaterial.title}
                </h2>
              </div>

              {/* Two-Subcolumn View: Left (Document / Scanned Photo) & Right (Structured Concepts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Subcolumn: Document Page / Scanned Photo View */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-ink-600 pb-1 border-b border-paper-200">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-500 font-mono flex items-center gap-1.5">
                      <Highlighter className="w-3.5 h-3.5 text-moss-700" />
                      {currentPhotoUrl ? 'Foto Catatan Guru' : 'Pratinjau Catatan'}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      Hal.
                      {Array.from({ length: selectedMaterial.pageCount }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setActivePageNumber(pageNum);
                            setHighlightedBlockId(null);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                            activePageNumber === pageNum
                              ? 'bg-moss-800 text-paper-50 font-bold'
                              : 'bg-paper-200 hover:bg-paper-300 text-ink-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Scanned Photo Display if uploaded, else Paper Simulator */}
                  {currentPhotoUrl ? (
                    <div className="relative group bg-paper-100 rounded border border-paper-300 overflow-hidden text-center p-2">
                      <img
                        src={currentPhotoUrl}
                        alt="Scanned Teacher Note"
                        className="max-h-72 mx-auto rounded object-contain border border-paper-200 shadow-sm cursor-zoom-in"
                        onClick={() => setExpandedPhotoUrl(currentPhotoUrl)}
                      />
                      <button
                        onClick={() => setExpandedPhotoUrl(currentPhotoUrl)}
                        className="absolute top-4 right-4 p-1.5 rounded bg-ink-950/70 hover:bg-ink-950 text-paper-50 text-xs flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Perbesar
                      </button>
                      <p className="text-[10px] text-ink-500 mt-1 font-serif">
                        Klik gambar untuk memperbesar foto catatan asli.
                      </p>
                    </div>
                  ) : null}

                  {/* Scanned Document Paper Simulator */}
                  <div className="bg-paper-100 p-4 rounded border border-paper-300 min-h-[260px] text-xs leading-relaxed space-y-3 font-mono">
                    <div className="text-[10px] text-ink-400 uppercase tracking-widest pb-1 border-b border-paper-200 flex justify-between items-center">
                      <span>[Teks Terindeks — Hal. {activePageNumber}]</span>
                      <span className="text-[9px] text-ink-400 italic">Klik baris untuk menyorot</span>
                    </div>

                    {selectedMaterial.blocks
                      .filter((b: MaterialBlock) => b.pageNumber === activePageNumber)
                      .map((block: MaterialBlock) => {
                        const isBlockHighlighted = highlightedBlockId === block.id;
                        return (
                          <div 
                            key={block.id}
                            onClick={() => handleBlockClick(block)}
                            className={`p-3 rounded transition cursor-pointer border ${
                              isBlockHighlighted
                                ? 'bg-moss-100/90 border-moss-700 shadow-sm text-ink-950 font-medium'
                                : block.isHandwritten 
                                ? 'bg-paper-50/80 hover:bg-paper-50 border-paper-200 border-l-2 border-l-moss-700 font-sans italic text-ink-800' 
                                : 'bg-paper-50/50 hover:bg-paper-50 border-paper-200 text-ink-900 font-mono'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-ink-400 mb-1">
                              <span>{block.isHandwritten ? '✍️ Catatan Guru' : '📄 Teks Catatan'}</span>
                              <span className="text-moss-700 font-mono">Akurasi {(block.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-xs">{block.text}</p>
                          </div>
                        );
                      })}

                    {selectedMaterial.blocks.filter((b: MaterialBlock) => b.pageNumber === activePageNumber).length === 0 && (
                      <p className="text-ink-400 italic text-center py-8 font-sans">
                        Halaman ini belum memiliki blok teks terindeks.
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Subcolumn: Structured Knowledge Extracted */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-ink-600 pb-1 border-b border-paper-200">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-500 font-mono">
                      Konsep Terverifikasi ({selectedMaterialConcepts.length})
                    </span>
                    <span className="text-[10px] text-moss-800 font-medium">
                      Tersambung ke Sistem
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {selectedMaterialConcepts.map((concept: Concept) => {
                      const isConceptHighlighted = highlightedConceptId === concept.id;
                      return (
                        <div
                          key={concept.id}
                          onClick={() => handleConceptClick(concept)}
                          className={`p-3.5 rounded border transition cursor-pointer ${
                            isConceptHighlighted
                              ? 'bg-moss-50 border-moss-800 shadow-sm'
                              : 'bg-paper-50 hover:bg-paper-150 border-paper-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-serif text-sm font-medium text-ink-950">
                              {concept.title}
                            </h4>
                            <span className="text-[10px] font-mono text-ink-400">
                              Level {concept.difficultyLevel}/5
                            </span>
                          </div>

                          <p className="text-xs text-ink-700 leading-relaxed line-clamp-2">
                            {concept.definition}
                          </p>

                          {/* Grounding Source Citation */}
                          {concept.sources.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-paper-200 text-[11px] text-ink-500 flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-moss-700 shrink-0" />
                              <span className="truncate">
                                Ditemukan di: {concept.sources[0].sourceType === 'catatan_guru' ? 'Catatan guru' : 'Materi'} — Hal {concept.sources[0].pageNumber}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartStudyConcept(concept.id);
                              }}
                              className="btn-primary text-xs py-1 px-2.5"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Pelajari Konsep Ini
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {selectedMaterialConcepts.length === 0 && (
                      <p className="text-xs text-ink-500 italic text-center py-6">
                        Belum ada konsep terhubung pada bab ini.
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="paper-sheet p-12 text-center text-ink-500 font-serif">
              Pilih dokumen untuk melihat catatan dan konsep terstruktur.
            </div>
          )}
        </div>

      </div>

      {/* FULLSCREEN PHOTO PREVIEW MODAL */}
      {expandedPhotoUrl && (
        <div className="fixed inset-0 bg-ink-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl w-full bg-paper-50 rounded p-4 text-center space-y-3">
            <button
              onClick={() => setExpandedPhotoUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-paper-200 text-ink-900 hover:bg-paper-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-lg text-ink-950 font-medium">{selectedMaterial?.title}</h3>
            <img
              src={expandedPhotoUrl}
              alt="Expanded Note"
              className="max-h-[75vh] mx-auto rounded object-contain border border-paper-300 shadow-md"
            />
          </div>
        </div>
      )}

      {/* ADD SUBJECT MODAL */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-paper-50 border border-paper-300 rounded shadow-modal max-w-md w-full p-6 relative text-ink-900 space-y-4">
            <button
              onClick={() => setIsAddSubjectModalOpen(false)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block mb-0.5">
                Kurikulum
              </span>
              <h3 className="font-serif text-xl font-medium text-ink-950">
                Tambah Mata Pelajaran Baru
              </h3>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-ink-700 block mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kimia, Sosiologi, Bahasa Jepang..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
                />
              </div>

              <div>
                <label className="font-medium text-ink-700 block mb-1">Kode Singkatan</label>
                <input
                  type="text"
                  placeholder="Misal: KIM, SOS, JPN..."
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700 uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-1.5 px-4"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
