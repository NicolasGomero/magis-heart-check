// Examination questions organized by pillar and context

export type Pillar = 'god' | 'neighbor' | 'self';
export type Context = 'home' | 'work' | 'transit' | 'social' | 'rest' | 'general';

export interface Question {
  id: string;
  pillar: Pillar;
  text: string;
  contexts: Context[];
}

export const CONTEXTS: { id: Context; label: string; icon: string }[] = [
  { id: 'home', label: 'En casa', icon: '🏠' },
  { id: 'work', label: 'Trabajo', icon: '💼' },
  { id: 'transit', label: 'En tránsito', icon: '🚶' },
  { id: 'social', label: 'Con otros', icon: '👥' },
  { id: 'rest', label: 'Descanso', icon: '☕' },
  { id: 'general', label: 'General', icon: '✨' },
];

export const PILLARS: { id: Pillar; label: string; description: string }[] = [
  { id: 'god', label: 'Dios', description: 'Mi relación con Dios' },
  { id: 'neighbor', label: 'Prójimo', description: 'Mi relación con los demás' },
  { id: 'self', label: 'Yo mismo', description: 'Mi relación conmigo' },
];

// Questions database - contextual and focused
const QUESTIONS: Question[] = [
  // GOD - Relationship with God
  { id: 'g1', pillar: 'god', text: '¿He sido consciente de la presencia de Dios?', contexts: ['general', 'home', 'work', 'transit', 'rest'] },
  { id: 'g2', pillar: 'god', text: '¿He agradecido algo hoy?', contexts: ['general', 'home', 'work', 'rest'] },
  { id: 'g3', pillar: 'god', text: '¿He confiado en Él ante dificultades?', contexts: ['work', 'social', 'general'] },
  { id: 'g4', pillar: 'god', text: '¿He dedicado un momento a la oración?', contexts: ['home', 'transit', 'rest', 'general'] },
  { id: 'g5', pillar: 'god', text: '¿He reconocido Su acción en mi día?', contexts: ['general', 'rest'] },
  
  // NEIGHBOR - Relationship with others
  { id: 'n1', pillar: 'neighbor', text: '¿He escuchado con atención a alguien?', contexts: ['home', 'work', 'social'] },
  { id: 'n2', pillar: 'neighbor', text: '¿He sido paciente con los demás?', contexts: ['work', 'social', 'transit', 'home'] },
  { id: 'n3', pillar: 'neighbor', text: '¿He evitado juzgar o criticar?', contexts: ['work', 'social', 'general'] },
  { id: 'n4', pillar: 'neighbor', text: '¿He ofrecido ayuda a quien la necesitaba?', contexts: ['work', 'social', 'home', 'transit'] },
  { id: 'n5', pillar: 'neighbor', text: '¿He dicho palabras amables?', contexts: ['home', 'work', 'social'] },
  { id: 'n6', pillar: 'neighbor', text: '¿He perdonado alguna ofensa?', contexts: ['general', 'home', 'work', 'social'] },
  
  // SELF - Relationship with oneself
  { id: 's1', pillar: 'self', text: '¿He cuidado mi cuerpo adecuadamente?', contexts: ['home', 'work', 'rest', 'general'] },
  { id: 's2', pillar: 'self', text: '¿He sido amable conmigo mismo?', contexts: ['work', 'rest', 'general'] },
  { id: 's3', pillar: 'self', text: '¿He evitado pensamientos negativos sobre mí?', contexts: ['general', 'work', 'rest'] },
  { id: 's4', pillar: 'self', text: '¿He respetado mis límites?', contexts: ['work', 'social', 'general'] },
  { id: 's5', pillar: 'self', text: '¿He hecho algo que me da paz?', contexts: ['rest', 'home', 'general'] },
  { id: 's6', pillar: 'self', text: '¿He sido honesto conmigo mismo?', contexts: ['general', 'work', 'rest'] },
];

// Get questions for a specific context (1 per pillar)
export function getQuestionsForContext(context: Context): Question[] {
  const godQuestions = QUESTIONS.filter(q => q.pillar === 'god' && q.contexts.includes(context));
  const neighborQuestions = QUESTIONS.filter(q => q.pillar === 'neighbor' && q.contexts.includes(context));
  const selfQuestions = QUESTIONS.filter(q => q.pillar === 'self' && q.contexts.includes(context));
  
  // Pick one random from each pillar
  const selected: Question[] = [];
  
  if (godQuestions.length > 0) {
    selected.push(godQuestions[Math.floor(Math.random() * godQuestions.length)]);
  }
  if (neighborQuestions.length > 0) {
    selected.push(neighborQuestions[Math.floor(Math.random() * neighborQuestions.length)]);
  }
  if (selfQuestions.length > 0) {
    selected.push(selfQuestions[Math.floor(Math.random() * selfQuestions.length)]);
  }
  
  return selected;
}

// Get pillar color class
export function getPillarColor(pillar: Pillar): string {
  switch (pillar) {
    case 'god': return 'state-growth';
    case 'neighbor': return 'state-attention';
    case 'self': return 'state-peace';
  }
}
