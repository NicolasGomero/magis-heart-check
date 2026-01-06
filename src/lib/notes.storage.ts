// Notes Storage - Offline-first persistence for notes on sins and good deeds

export type NoteTargetType = 'sin' | 'goodWork';

export interface Note {
  id: string;
  targetType: NoteTargetType;
  targetId: string;
  text: string;
  createdAt: number;
  cycleKey?: string; // Optional: reference to cycle when note was created
}

const NOTES_STORAGE_KEY = 'magis_notes';

// Get all notes from storage
export function getAllNotes(): Note[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save notes to storage
function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  window.dispatchEvent(new CustomEvent('notes-updated'));
}

// Get notes for a specific target
export function getNotesForTarget(targetType: NoteTargetType, targetId: string): Note[] {
  const allNotes = getAllNotes();
  return allNotes
    .filter(n => n.targetType === targetType && n.targetId === targetId)
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first
}

// Create a new note
export function createNote(targetType: NoteTargetType, targetId: string, text: string): Note {
  const newNote: Note = {
    id: crypto.randomUUID(),
    targetType,
    targetId,
    text: text.trim(),
    createdAt: Date.now(),
  };
  
  const notes = getAllNotes();
  notes.push(newNote);
  saveNotes(notes);
  
  return newNote;
}

// Update a note
export function updateNote(noteId: string, text: string): Note | null {
  const notes = getAllNotes();
  const index = notes.findIndex(n => n.id === noteId);
  
  if (index === -1) return null;
  
  notes[index] = { ...notes[index], text: text.trim() };
  saveNotes(notes);
  
  return notes[index];
}

// Delete a note
export function deleteNote(noteId: string): boolean {
  const notes = getAllNotes();
  const index = notes.findIndex(n => n.id === noteId);
  
  if (index === -1) return false;
  
  notes.splice(index, 1);
  saveNotes(notes);
  
  return true;
}

// Get note count for a target
export function getNoteCountForTarget(targetType: NoteTargetType, targetId: string): number {
  return getNotesForTarget(targetType, targetId).length;
}

// Export all notes
export function exportNotes(): Note[] {
  return getAllNotes();
}

// Import notes
export function importNotes(newNotes: Note[]): number {
  const existing = getAllNotes();
  const existingIds = new Set(existing.map(n => n.id));
  
  let imported = 0;
  for (const note of newNotes) {
    if (!existingIds.has(note.id)) {
      existing.push(note);
      imported++;
    }
  }
  
  saveNotes(existing);
  return imported;
}
