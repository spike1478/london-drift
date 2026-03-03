import type { TflStopPoint, Riddle, RiddleAnswer, RiddleTemplate } from '../api/types';
import { RIDDLE_TEMPLATES } from '../data/riddle-templates';

export function generateRiddle(station: TflStopPoint, currentLine?: string): Riddle | null {
  const available = RIDDLE_TEMPLATES.filter(t => canGenerateRiddle(t, station, currentLine));
  if (available.length === 0) return null;

  const template = available[Math.floor(Math.random() * available.length)];
  return createRiddle(template, station, currentLine);
}

function canGenerateRiddle(template: RiddleTemplate, station: TflStopPoint, currentLine?: string): boolean {
  switch (template.type) {
    case 'count': return !!getProperty(station, template.field!);
    case 'zone': return !!station.zone;
    case 'interchange': return station.lines.length > 1 && !!currentLine;
    case 'boolean': return !!getProperty(station, template.field!);
  }
}

function getProperty(station: TflStopPoint, key: string): string | undefined {
  return station.additionalProperties.find(p => p.key === key)?.value;
}

function createRiddle(template: RiddleTemplate, station: TflStopPoint, currentLine?: string): Riddle {
  let question = template.question;
  let answer: string | number | boolean;
  let tolerance: number | undefined;

  switch (template.type) {
    case 'count': {
      const value = getProperty(station, template.field!)!;
      answer = parseInt(value, 10);
      tolerance = 1;
      break;
    }
    case 'zone': {
      answer = parseInt(station.zone || '1', 10);
      break;
    }
    case 'interchange': {
      question = template.question.replace('{currentLine}', currentLine || 'your line');
      const otherLines = station.lines.filter(l => l.name !== currentLine);
      answer = otherLines[0]?.name || '';
      break;
    }
    case 'boolean': {
      const value = getProperty(station, template.field!);
      answer = value === 'true' || value === 'yes' || value === 'Yes';
      break;
    }
  }

  return { question, answer, tolerance, stationId: station.naptanId };
}

export function checkAnswer(riddle: Riddle, userAnswer: string): RiddleAnswer {
  let correct = false;

  if (typeof riddle.answer === 'number') {
    const parsed = parseInt(userAnswer, 10);
    if (!isNaN(parsed)) {
      correct = riddle.tolerance
        ? Math.abs(parsed - riddle.answer) <= riddle.tolerance
        : parsed === riddle.answer;
    }
  } else if (typeof riddle.answer === 'boolean') {
    const normalized = userAnswer.toLowerCase().trim();
    const isYes = ['yes', 'y', 'true'].includes(normalized);
    const isNo = ['no', 'n', 'false'].includes(normalized);
    correct = (riddle.answer && isYes) || (!riddle.answer && isNo);
  } else {
    correct = userAnswer.toLowerCase().trim() === String(riddle.answer).toLowerCase().trim();
  }

  return { correct, actualAnswer: riddle.answer };
}
