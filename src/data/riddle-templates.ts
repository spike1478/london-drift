import type { RiddleTemplate } from '../api/types';

export const RIDDLE_TEMPLATES: RiddleTemplate[] = [
  { type: 'count', field: 'Escalators', question: 'How many escalators does this station have?', answerType: 'number' },
  { type: 'count', field: 'Lifts', question: 'How many lifts are at this station?', answerType: 'number' },
  { type: 'zone', question: 'What zone is this station in?', answerType: 'number' },
  { type: 'interchange', question: 'Name another line that stops here (besides {currentLine})', answerType: 'line' },
  { type: 'boolean', field: 'WiFi', question: 'Does this station have WiFi?', answerType: 'yesno' },
  { type: 'count', field: 'Gates', question: 'How many ticket gates does this station have?', answerType: 'number' },
];
