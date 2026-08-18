// Scan and Import Flow Modal for PAHAM
// Complete Photo/Picture Upload, Camera Capture, 10+ Subject Selector, and Inline Subject/Chapter Creator

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Layers,
  Camera,
  Image as ImageIcon,
  Upload,
  Plus,
  Video,
  VideoOff,
  RotateCcw,
  Tag
} from 'lucide-react';
import { db } from '../core/db';
import { Material, MaterialBlock, Subject, Chapter } from '../core/types';
import { ai } from '../services/ai/aiProvider';

interface ScanFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaterialCreated: (newMaterialId: string) => void;
}

type ScanStage = 'input' | 'processing' | 'permission_gate' | 'verification' | 'completed';
type CaptureTab = 'upload' | 'camera' | 'text';

export const ScanFlowModal: React.FC<ScanFlowModalProps> = ({
  isOpen,
  onClose,
  onMaterialCreated,
}) => {
  const [stage, setStage] = useState<ScanStage>('input');
  const [captureTab, setCaptureTab] = useState<CaptureTab>('upload');
  
  // Dynamic Subjects & Chapters from Database
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-bind');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chap-bind-5');
  
  // Inline Creation of New Subject / Chapter
  const [isAddingNewSubject, setIsAddingNewSubject] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectCode, setNewSubjectCode] = useState<string>('');
  
  const [isAddingNewChapter, setIsAddingNewChapter] = useState<boolean>(false);
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');

  // Material Form States
  const [materialTitle, setMaterialTitle] = useState<string>('Catatan Guru: Tambahan Materi');
  const [sourceType, setSourceType] = useState<Material['sourceType']>('catatan_guru');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  
  // OCR & Pipeline States
  const [rawText, setRawText] = useState<string>(
    'Bab 5: Penokohan cerita fiksi. Penokohan ada 2 cara: 1. Analitik (pengarang langsung sebut watak), 2. Dramatik (lewat dialog/tindakan tokoh). Tokoh adalah pemeran fisik dlm cerita.'
  );
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [extractedConcepts, setExtractedConcepts] = useState<string[]>(['Penokohan', 'Metode Analitik & Dramatik', 'Tokoh']);
  const [cleanedText, setCleanedText] = useState<string>('');
  const [isAiEnhanced, setIsAiEnhanced] = useState<boolean>(false);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load all subjects & chapters when opened
  useEffect(() => {
    async function loadSubjectsAndChapters() {
      const subs: Subject[] = await db.subjects.toArray();
      const chaps: Chapter[] = await db.chapters.toArray();
      setSubjects(subs);
      setChapters(chaps);

      if (subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
        const subChaps = chaps.filter(c => c.subjectId === subs[0].id);
        if (subChaps.length > 0) setSelectedChapterId(subChaps[0].id);
      }
    }
    if (isOpen) {
      loadSubjectsAndChapters();
    }
  }, [isOpen]);

  // Update chapters when subject changes
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  // Clipboard Paste Support (Ctrl+V Image)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || stage !== 'input') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              setUploadedImagePreview(uploadEvent.target?.result as string);
              setCaptureTab('upload');
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, stage]);

  // Camera Management
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      alert('Tidak dapat mengakses kamera perangkat. Silakan gunakan opsi upload file foto.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhotoSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setUploadedImagePreview(dataUrl);
      stopCamera();
      setCaptureTab('upload');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUploadedImagePreview(uploadEvent.target?.result as string);
      if (!materialTitle || materialTitle.startsWith('Catatan Guru:')) {
        setMaterialTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewSubject = async () => {
    if (!newSubjectName.trim()) return;
    const newId = `sub-${Date.now()}`;
    const newSub: Subject = {
      id: newId,
      name: newSubjectName.trim(),
      code: newSubjectCode.trim().toUpperCase() || newSubjectName.slice(0, 3).toUpperCase(),
      color: '#2D5A43',
      iconName: 'BookOpen',
      description: 'Mata pelajaran kustom',
    };

    await db.subjects.add(newSub);
    setSubjects(prev => [...prev, newSub]);
    setSelectedSubjectId(newId);

    // Also create initial Bab 1
    const newChap: Chapter = {
      id: `chap-${newId}-1`,
      subjectId: newId,
      number: 1,
      title: 'Bab 1 — Materi Pokok',
      examRelevance: 'high',
    };
    await db.chapters.add(newChap);
    setChapters(prev => [...prev, newChap]);
    setSelectedChapterId(newChap.id);

    setIsAddingNewSubject(false);
    setNewSubjectName('');
    setNewSubjectCode('');
  };

  const handleCreateNewChapter = async () => {
    if (!newChapterTitle.trim()) return;
    const newChapId = `chap-${selectedSubjectId}-${Date.now()}`;
    const newChap: Chapter = {
      id: newChapId,
      subjectId: selectedSubjectId,
      number: newChapterNumber,
      title: `Bab ${newChapterNumber} — ${newChapterTitle.trim()}`,
      examRelevance: 'medium',
    };

    await db.chapters.add(newChap);
    setChapters(prev => [...prev, newChap]);
    setSelectedChapterId(newChapId);

    setIsAddingNewChapter(false);
    setNewChapterTitle('');
    setNewChapterNumber(prev => prev + 1);
  };

  const startPipeline = async (withAi: boolean = false) => {
    stopCamera();
    setStage('processing');
    setProcessingStep(1); // Membaca halaman & OCR

    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(2); // Menemukan konsep

    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(3); // Merapikan materi

    if (sourceType === 'catatan_guru' && !withAi) {
      setStage('permission_gate');
      return;
    }

    const currentSub = subjects.find(s => s.id === selectedSubjectId);
    const result = await ai.extractHandwriting({
      rawOcrSnippet: rawText,
      subjectName: currentSub?.name || 'Mata Pelajaran',
    });

    setCleanedText(result.cleanedText);
    setExtractedConcepts(result.detectedConcepts);
    setIsAiEnhanced(result.isAiEnhanced);

    setProcessingStep(4);
    await new Promise(r => setTimeout(r, 400));
    setStage('verification');
  };

  const handleSaveMaterial = async () => {
    const newMaterialId = `mat-${Date.now()}`;
    const newBlock: MaterialBlock = {
      id: `blk-${Date.now()}`,
      materialId: newMaterialId,
      pageNumber: 1,
      blockType: sourceType === 'catatan_guru' ? 'handwritten_note' : 'paragraph',
      text: cleanedText || rawText,
      confidence: isAiEnhanced ? 0.96 : 0.88,
      isHandwritten: sourceType === 'catatan_guru',
      verificationState: isAiEnhanced ? 'AI_VERIFIED' : 'USER_VERIFIED',
      extractedConcepts,
    };

    const newMat: Material = {
      id: newMaterialId,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId || `chap-${selectedSubjectId}-1`,
      title: materialTitle,
      sourceType,
      dateAdded: new Date().toISOString(),
      pageCount: 1,
      hasHandwriting: sourceType === 'catatan_guru',
      isVerified: true,
      thumbnailUrl: uploadedImagePreview || undefined,
      previewPages: uploadedImagePreview ? [{
        pageNumber: 1,
        imageUrl: uploadedImagePreview,
      }] : undefined,
      blocks: [newBlock],
    };

    await db.materials.add(newMat);

    // Save learning event
    const currentSub = subjects.find(s => s.id === selectedSubjectId);
    await db.learningEvents.add({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'MATERIAL_IMPORTED',
      subjectId: selectedSubjectId,
      metadata: { materialTitle, subjectName: currentSub?.name, hasPhoto: Boolean(uploadedImagePreview) },
    });

    setStage('completed');
    setTimeout(() => {
      onMaterialCreated(newMaterialId);
      onClose();
      setStage('input');
      setUploadedImagePreview(null);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-paper-50 border border-paper-300 rounded shadow-modal max-w-2xl w-full p-6 sm:p-7 relative text-ink-900 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STAGE 1: INPUT / CAPTURE */}
        {stage === 'input' && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-moss-800 font-semibold block mb-1">
                Material Capture & Photo Scanner
              </span>
              <h2 className="text-2xl font-serif font-medium text-ink-950">
                Masukkan Catatan & Foto Materi
              </h2>
              <p className="text-xs text-ink-600 font-serif mt-0.5">
                Ambil foto kamera, upload gambar catatan guru, atau ketik materi untuk 16+ mata pelajaran.
              </p>
            </div>

            {/* Subject and Chapter Selector with Inline Creator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-paper-100/80 rounded border border-paper-200">
              
              {/* Subject Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
                    Mata Pelajaran ({subjects.length} Tersedia)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSubject(!isAddingNewSubject)}
                    className="text-[11px] text-moss-800 font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Mapel Baru
                  </button>
                </div>

                {!isAddingNewSubject ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      const subChaps = chapters.filter(c => c.subjectId === e.target.value);
                      if (subChaps.length > 0) setSelectedChapterId(subChaps[0].id);
                    }}
                    className="w-full bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs text-ink-900 focus:border-moss-700 font-medium"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5 p-2 bg-paper-50 rounded border border-moss-300">
                    <input
                      type="text"
                      placeholder="Nama Mapel (misal: Kimia, Sosiologi)..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full bg-paper-100 border border-paper-300 rounded px-2 py-1 text-xs text-ink-900"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Kode (misal: KIM)..."
                        value={newSubjectCode}
                        onChange={(e) => setNewSubjectCode(e.target.value)}
                        className="w-24 bg-paper-100 border border-paper-300 rounded px-2 py-1 text-xs text-ink-900 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewSubject}
                        className="btn-primary text-[10px] py-1 px-2.5"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewSubject(false)}
                        className="btn-ghost text-[10px] py-1 px-1.5"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chapter Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
                    Bab / Topik
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewChapter(!isAddingNewChapter)}
                    className="text-[11px] text-moss-800 font-medium hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Bab Baru
                  </button>
                </div>

                {!isAddingNewChapter ? (
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full bg-paper-50 border border-paper-300 rounded px-2.5 py-1.5 text-xs text-ink-900 focus:border-moss-700"
                  >
                    {filteredChapters.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                    {filteredChapters.length === 0 && (
                      <option value="">Belum ada bab (Klik + Bab Baru)</option>
                    )}
                  </select>
                ) : (
                  <div className="space-y-1.5 p-2 bg-paper-50 rounded border border-moss-300">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={newChapterNumber}
                        onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                        className="w-14 bg-paper-100 border border-paper-300 rounded px-2 py-1 text-xs text-ink-900"
                      />
                      <input
                        type="text"
                        placeholder="Judul Bab (misal: Stoikiometri)..."
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        className="flex-1 bg-paper-100 border border-paper-300 rounded px-2 py-1 text-xs text-ink-900"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewChapter(false)}
                        className="btn-ghost text-[10px] py-1 px-2"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewChapter}
                        className="btn-primary text-[10px] py-1 px-2.5"
                      >
                        Tambah Bab
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Input Capture Method Selector */}
            <div className="flex items-center gap-1.5 border-b border-paper-300 pb-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCaptureTab('upload');
                }}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
                  captureTab === 'upload' ? 'bg-moss-900 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Upload Foto / Gambar
              </button>

              <button
                type="button"
                onClick={() => {
                  setCaptureTab('camera');
                  startCamera();
                }}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
                  captureTab === 'camera' ? 'bg-moss-900 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Ambil Foto Kamera
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCaptureTab('text');
                }}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition ${
                  captureTab === 'text' ? 'bg-moss-900 text-paper-50' : 'bg-paper-200 text-ink-700 hover:bg-paper-300'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Ketik / Tempel Teks
              </button>
            </div>

            {/* TAB 1: UPLOAD PHOTO FILE OR DROPZONE */}
            {captureTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadedImagePreview ? (
                  <div className="relative p-2 bg-paper-100 rounded border border-moss-300 text-center space-y-2">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Note"
                      className="max-h-56 mx-auto rounded object-contain border border-paper-300 shadow-sm"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[11px] text-moss-900 font-medium">
                        ✓ Foto catatan berhasil dimuat
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedImagePreview(null)}
                        className="text-[11px] text-terracotta-800 hover:underline"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-paper-300 hover:border-moss-700 bg-paper-100/50 hover:bg-paper-100 rounded text-center cursor-pointer transition space-y-2"
                  >
                    <Upload className="w-8 h-8 text-moss-800 mx-auto" />
                    <p className="text-sm font-serif font-medium text-ink-950">
                      Pilih foto catatan dari komputer atau HP
                    </p>
                    <p className="text-xs text-ink-500 font-sans">
                      Mendukung JPG, PNG, WebP, atau PDF (atau tekan <strong>Ctrl + V</strong> untuk tempel screenshot).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LIVE CAMERA CAPTURE */}
            {captureTab === 'camera' && (
              <div className="space-y-3 p-3 bg-paper-100 rounded border border-paper-300 text-center">
                <div className="relative bg-ink-950 rounded overflow-hidden max-h-64 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover max-h-64"
                  />
                  {!isCameraActive && (
                    <p className="text-paper-100 text-xs py-12">Menyiapkan kamera...</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={takePhotoSnapshot}
                    className="btn-primary text-xs py-2 px-5 shadow-subtle"
                  >
                    <Camera className="w-4 h-4" />
                    Ambil Foto Catatan
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="btn-secondary text-xs py-2 px-3"
                  >
                    Tutup Kamera
                  </button>
                </div>
              </div>
            )}

            {/* Title & Notes Textarea */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1">Judul Catatan / Dokumen</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full bg-paper-100 border border-paper-300 rounded px-3 py-1.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1">
                  Transkrip Materi / Teks OCR Catatan
                </label>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Ketik atau edit teks materi rujukan..."
                  className="w-full bg-paper-100 border border-paper-300 rounded p-2.5 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700 font-mono leading-relaxed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="btn-ghost text-xs py-2 px-3"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => startPipeline(false)}
                className="btn-primary text-xs py-2 px-4 shadow-subtle"
              >
                <Layers className="w-3.5 h-3.5" />
                Mulai Ekstraksi & Verifikasi
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: PROCESSING PROGRESS SEQUENCE */}
        {stage === 'processing' && (
          <div className="py-8 space-y-6 text-center">
            <h3 className="font-serif text-xl text-ink-950 font-medium">
              Memproses Catatan & Foto Materi
            </h3>
            <p className="text-xs text-ink-500 font-serif">
              Menghubungkan catatan ke dalam struktur pengetahuan PAHAM...
            </p>

            <div className="max-w-xs mx-auto space-y-3 text-left text-xs font-mono">
              <div className={`flex items-center justify-between p-2.5 rounded ${processingStep >= 1 ? 'bg-moss-50 text-moss-900 font-medium' : 'text-ink-400'}`}>
                <span>1. Membaca gambar & OCR halaman</span>
                {processingStep > 1 ? <Check className="w-4 h-4 text-moss-700" /> : <span className="animate-pulse">...</span>}
              </div>
              <div className={`flex items-center justify-between p-2.5 rounded ${processingStep >= 2 ? 'bg-moss-50 text-moss-900 font-medium' : 'text-ink-400'}`}>
                <span>2. Menemukan konsep kunci</span>
                {processingStep > 2 ? <Check className="w-4 h-4 text-moss-700" /> : processingStep === 2 ? <span className="animate-pulse">...</span> : null}
              </div>
              <div className={`flex items-center justify-between p-2.5 rounded ${processingStep >= 3 ? 'bg-moss-50 text-moss-900 font-medium' : 'text-ink-400'}`}>
                <span>3. Merapikan struktur kalimat</span>
                {processingStep > 3 ? <Check className="w-4 h-4 text-moss-700" /> : processingStep === 3 ? <span className="animate-pulse">...</span> : null}
              </div>
              <div className={`flex items-center justify-between p-2.5 rounded ${processingStep >= 4 ? 'bg-moss-50 text-moss-900 font-medium' : 'text-ink-400'}`}>
                <span>4. Siap dipelajari</span>
                {processingStep >= 4 && <Check className="w-4 h-4 text-moss-700" />}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: HANDWRITING REALITY CHECK & AI PERMISSION GATE */}
        {stage === 'permission_gate' && (
          <div className="space-y-4">
            <div className="p-4 rounded bg-terracotta-100 border border-terracotta-200">
              <div className="flex items-center gap-2 text-terracotta-900 font-medium text-sm mb-1">
                <AlertTriangle className="w-4 h-4 text-terracotta-700" />
                ✍️ Tulisan Tangan Terdeteksi
              </div>
              <p className="text-xs text-terracotta-800 font-serif leading-relaxed">
                Beberapa bagian catatan guru sulit dibaca dengan OCR lokal standar. Apakah kamu ingin menggunakan pembaca cerdas AI untuk merapikan kalimat dan mengekstrak konsep secara akurat?
              </p>
            </div>

            {uploadedImagePreview && (
              <img
                src={uploadedImagePreview}
                alt="Thumbnail"
                className="max-h-40 mx-auto rounded object-contain border border-paper-300 shadow-sm"
              />
            )}

            <div className="p-3 bg-paper-100 rounded border border-paper-300 text-xs font-mono text-ink-700 line-clamp-3">
              "{rawText}"
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
              <button
                type="button"
                onClick={() => {
                  setCleanedText(rawText);
                  setStage('verification');
                }}
                className="btn-secondary text-xs py-2 px-3"
              >
                Gunakan Hasil Standar (Tanpa AI)
              </button>
              <button
                type="button"
                onClick={() => startPipeline(true)}
                className="btn-primary text-xs py-2 px-4 bg-moss-900 hover:bg-moss-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-moss-200" />
                Gunakan Pembaca AI
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: VERIFICATION & EDITING */}
        {stage === 'verification' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-paper-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-moss-800 font-semibold block">
                  Verifikasi Ekstraksi
                </span>
                <h3 className="font-serif text-lg text-ink-950 font-medium">
                  Periksa & Simpan Pengetahuan
                </h3>
              </div>
              {isAiEnhanced ? (
                <span className="badge-moss">✨ AI Verified</span>
              ) : (
                <span className="badge-neutral">Local OCR</span>
              )}
            </div>

            {uploadedImagePreview && (
              <div className="flex items-center gap-3 p-2 bg-paper-100 rounded border border-paper-200">
                <img
                  src={uploadedImagePreview}
                  alt="Scanned Preview"
                  className="w-16 h-16 object-cover rounded border border-paper-300"
                />
                <div className="text-xs">
                  <p className="font-semibold text-ink-900">{materialTitle}</p>
                  <p className="text-[11px] text-moss-800">Foto Catatan Guru Tersimpan</p>
                </div>
              </div>
            )}

            {/* Extracted Concepts Tagging */}
            <div>
              <label className="text-[11px] font-medium text-ink-600 uppercase tracking-wider block mb-1.5">
                Konsep Pelajaran yang Dikenali:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {extractedConcepts.map((c, i) => (
                  <span key={i} className="badge-moss text-xs font-sans">
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Editable Cleaned Text */}
            <div>
              <label className="text-[11px] font-medium text-ink-600 uppercase tracking-wider block mb-1.5">
                Teks Materi Terverifikasi:
              </label>
              <textarea
                rows={4}
                value={cleanedText}
                onChange={(e) => setCleanedText(e.target.value)}
                className="w-full bg-paper-100 border border-paper-300 rounded p-3 text-xs text-ink-900 focus:bg-paper-50 focus:border-moss-700 font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-paper-200">
              <span className="text-[11px] text-ink-500 font-serif">
                Siap disimpan ke arsip catatan sekolah.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage('input')}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={handleSaveMaterial}
                  className="btn-primary text-xs py-2 px-4 shadow-subtle"
                >
                  <Check className="w-4 h-4" />
                  Simpan ke Materiku
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 5: COMPLETED */}
        {stage === 'completed' && (
          <div className="py-10 text-center space-y-2">
            <Check className="w-10 h-10 text-moss-700 mx-auto" />
            <h3 className="font-serif text-xl text-ink-950 font-medium">Materi & Foto Berhasil Disimpan</h3>
            <p className="text-xs text-ink-500 font-serif">Materi sekarang sudah terhubung ke jadwal belajar harianmu.</p>
          </div>
        )}

      </div>
    </div>
  );
};
