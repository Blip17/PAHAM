// Concept Extraction and Persistence Service for PAHAM
// Extracts concepts from material text and saves them to the database.
// Uses AI if available, deterministic extraction as fallback.

import { db } from '../core/db';
import { Concept, Material, SourceReference } from '../core/types';
import { ai } from './ai/aiProvider';

// ---------------------------------------------------------------------------
// DETERMINISTIC KEYWORD EXTRACTOR (zero API calls, always available)
// ---------------------------------------------------------------------------
// A heuristic pass that looks for common patterns in Indonesian school notes.
// It scans for numbered-list items, heading-like lines, and definition markers.
function deterministicExtractConcepts(text: string): string[] {
  const titles = new Set<string>();

  // Pattern 1: Numbered or bulleted items often introduce concept names.
  //   "1. Penokohan" / "• Ekosistem" / "a. Pengertian fotosintesis"
  const numberedPattern = /^(?:\d+\.|[a-z]\.|[•\-\*])\s+([A-Z][^\n]{2,60})/gm;
  for (const m of text.matchAll(numberedPattern)) {
    const t = m[1].trim().replace(/[:.;,]$/, '');
    if (t.length >= 3 && t.length <= 60) titles.add(t);
  }

  // Pattern 2: Lines ending in a colon look like headings.
  //   "Alur cerita:" / "Pengertian ekosistem:"
  const colonPattern = /^([A-Za-z][^\n]{2,50}):/gm;
  for (const m of text.matchAll(colonPattern)) {
    const t = m[1].trim();
    if (t.length >= 3 && t.split(' ').length <= 6) titles.add(t);
  }

  // Pattern 3: Capitalised standalone short lines (likely headings in notes)
  const headingPattern = /^([A-Z][a-zA-Z\s&\/]{2,40})$/gm;
  for (const m of text.matchAll(headingPattern)) {
    const t = m[1].trim();
    if (t.length >= 3 && t.split(' ').length <= 5) titles.add(t);
  }

  return Array.from(titles).slice(0, 6);
}

// ---------------------------------------------------------------------------
// DEFINITION EXTRACTOR (finds first sentence after a concept name)
// ---------------------------------------------------------------------------
function extractDefinitionSnippet(text: string, conceptTitle: string): string {
  const escaped = conceptTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escaped}[^.]*[.:] ?([^.]{20,200})`, 'i'));
  if (match) return match[1].trim();

  // Fallback: return first non-trivial sentence from text
  const firstSentence = text.match(/[A-Z][^.!?]{30,200}[.!?]/);
  return firstSentence ? firstSentence[0].trim() : `Konsep dari materi catatan.`;
}

// ---------------------------------------------------------------------------
// MAIN: Extract and persist concepts from a saved Material
// ---------------------------------------------------------------------------
export async function extractAndPersistConcepts(material: Material): Promise<string[]> {
  // Gather all text from blocks in priority order
  const rawText = material.blocks
    .map(b => b.text)
    .join('\n')
    .trim();

  if (!rawText || rawText.length < 10) return [];

  // 1. Try to get concept titles from blocks' extractedConcepts first (from AI extraction step)
  let conceptTitles: string[] = [];
  for (const block of material.blocks) {
    if (block.extractedConcepts && block.extractedConcepts.length > 0) {
      conceptTitles.push(...block.extractedConcepts);
    }
  }

  // Deduplicate
  conceptTitles = [...new Set(conceptTitles)];

  // 2. If still empty, use deterministic extraction
  if (conceptTitles.length === 0) {
    conceptTitles = deterministicExtractConcepts(rawText);
  }

  // 3. If still empty after all heuristics, create a single general concept from the material title
  if (conceptTitles.length === 0) {
    conceptTitles = [material.title];
  }

  const createdConceptIds: string[] = [];
  const now = new Date().toISOString();

  for (const title of conceptTitles) {
    // Skip if a concept with this title in the same chapter already exists
    const existing = await db.concepts
      .where('chapterId')
      .equals(material.chapterId)
      .and(c => c.title.toLowerCase() === title.toLowerCase())
      .first();

    if (existing) {
      createdConceptIds.push(existing.id);
      continue;
    }

    const definition = extractDefinitionSnippet(rawText, title);
    const conceptId = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const sourceRef: SourceReference = {
      materialId: material.id,
      materialTitle: material.title,
      sourceType: material.sourceType,
      pageNumber: material.blocks[0]?.pageNumber ?? 1,
      snippet: rawText.slice(0, 120),
    };

    const concept: Concept = {
      id: conceptId,
      subjectId: material.subjectId,
      chapterId: material.chapterId,
      title,
      definition,
      example: `Lihat catatan: ${material.title}`,
      keyPoints: [title, definition.split(' ').slice(0, 5).join(' ')],
      relationships: [],
      sources: [sourceRef],
      difficultyLevel: 2,
      createdAt: now,
    };

    await db.concepts.add(concept);

    // Initialise a default StudentConceptState for this concept
    await db.studentConceptStates.put({
      conceptId,
      masteryScore: 0,
      fsrs: {
        conceptId,
        due: now,
        stability: 0,
        difficulty: 5,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0,
      },
      recentAttemptsCount: 0,
      recentCorrectCount: 0,
      commonMistakes: [],
      priorityScore: 80,
      recommendedMode: 'learn',
    });

    // Log learning event
    await db.learningEvents.add({
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: now,
      eventType: 'CONCEPT_CREATED',
      subjectId: material.subjectId,
      conceptId,
      metadata: { materialId: material.id, title },
    });

    createdConceptIds.push(conceptId);

    // Small pause to avoid duplicate IDs if many concepts
    await new Promise(r => setTimeout(r, 2));
  }

  return createdConceptIds;
}

// ---------------------------------------------------------------------------
// AI-assisted concept extraction (called when user opts-in with AI button)
// ---------------------------------------------------------------------------
export async function aiEnhancedExtraction(
  text: string,
  subjectName: string
): Promise<string[]> {
  try {
    const result = await ai.extractHandwriting({
      rawOcrSnippet: text,
      subjectName,
    });
    return result.detectedConcepts.length > 0
      ? result.detectedConcepts
      : deterministicExtractConcepts(text);
  } catch {
    return deterministicExtractConcepts(text);
  }
}
