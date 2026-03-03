import { describe, it, expect } from 'vitest';
import { generateRiddle, checkAnswer } from '../engine/riddles';
import type { TflStopPoint, Riddle } from '../api/types';

const makeStation = (overrides: Partial<TflStopPoint> = {}): TflStopPoint => ({
  naptanId: 'test-station',
  commonName: 'Test Station',
  lat: 51.5,
  lon: -0.1,
  modes: ['tube'],
  lines: [
    { id: 'victoria', name: 'Victoria' },
    { id: 'central', name: 'Central' },
  ],
  zone: '2',
  additionalProperties: [
    { category: 'Facility', key: 'Escalators', value: '4' },
    { category: 'Facility', key: 'Lifts', value: '2' },
    { category: 'Facility', key: 'WiFi', value: 'yes' },
    { category: 'Facility', key: 'Gates', value: '12' },
  ],
  ...overrides,
});

describe('generateRiddle', () => {
  it('returns a riddle for a station with properties', () => {
    const station = makeStation();
    const riddle = generateRiddle(station, 'Victoria');
    expect(riddle).not.toBeNull();
    expect(riddle!.question).toBeTruthy();
    expect(riddle!.stationId).toBe('test-station');
  });

  it('returns null for a station with no usable properties', () => {
    const station = makeStation({
      additionalProperties: [],
      zone: undefined,
      lines: [{ id: 'victoria', name: 'Victoria' }], // only one line, no interchange
    });
    const riddle = generateRiddle(station);
    expect(riddle).toBeNull();
  });

  it('can generate a zone riddle', () => {
    const station = makeStation({
      additionalProperties: [], // no count/boolean properties
      lines: [{ id: 'victoria', name: 'Victoria' }], // single line, no interchange
    });
    const riddle = generateRiddle(station);
    // Zone riddle should be the only option
    expect(riddle).not.toBeNull();
    expect(riddle!.answer).toBe(2); // zone '2'
  });

  it('can generate an interchange riddle when currentLine is provided', () => {
    const station = makeStation({
      additionalProperties: [],
      zone: undefined,
    });
    // With 2 lines and currentLine, interchange should be available
    const riddle = generateRiddle(station, 'Victoria');
    expect(riddle).not.toBeNull();
  });
});

describe('checkAnswer', () => {
  it('checks numeric answers with tolerance', () => {
    const riddle: Riddle = { question: 'How many?', answer: 4, tolerance: 1, stationId: 's1' };
    expect(checkAnswer(riddle, '4').correct).toBe(true);
    expect(checkAnswer(riddle, '3').correct).toBe(true);  // within tolerance
    expect(checkAnswer(riddle, '5').correct).toBe(true);  // within tolerance
    expect(checkAnswer(riddle, '6').correct).toBe(false); // outside tolerance
  });

  it('checks exact numeric answers without tolerance', () => {
    const riddle: Riddle = { question: 'Zone?', answer: 2, stationId: 's1' };
    expect(checkAnswer(riddle, '2').correct).toBe(true);
    expect(checkAnswer(riddle, '3').correct).toBe(false);
  });

  it('returns actualAnswer on wrong answer', () => {
    const riddle: Riddle = { question: 'Zone?', answer: 2, stationId: 's1' };
    const result = checkAnswer(riddle, '5');
    expect(result.correct).toBe(false);
    expect(result.actualAnswer).toBe(2);
  });

  it('checks boolean answers with various yes forms', () => {
    const riddle: Riddle = { question: 'WiFi?', answer: true, stationId: 's1' };
    expect(checkAnswer(riddle, 'yes').correct).toBe(true);
    expect(checkAnswer(riddle, 'y').correct).toBe(true);
    expect(checkAnswer(riddle, 'true').correct).toBe(true);
    expect(checkAnswer(riddle, 'no').correct).toBe(false);
  });

  it('checks boolean false answers', () => {
    const riddle: Riddle = { question: 'WiFi?', answer: false, stationId: 's1' };
    expect(checkAnswer(riddle, 'no').correct).toBe(true);
    expect(checkAnswer(riddle, 'n').correct).toBe(true);
    expect(checkAnswer(riddle, 'false').correct).toBe(true);
    expect(checkAnswer(riddle, 'yes').correct).toBe(false);
  });

  it('checks string answers case-insensitively', () => {
    const riddle: Riddle = { question: 'Line?', answer: 'Central', stationId: 's1' };
    expect(checkAnswer(riddle, 'central').correct).toBe(true);
    expect(checkAnswer(riddle, 'Central').correct).toBe(true);
    expect(checkAnswer(riddle, '  central  ').correct).toBe(true);
    expect(checkAnswer(riddle, 'Victoria').correct).toBe(false);
  });

  it('handles invalid numeric input gracefully', () => {
    const riddle: Riddle = { question: 'How many?', answer: 4, tolerance: 1, stationId: 's1' };
    expect(checkAnswer(riddle, 'abc').correct).toBe(false);
  });
});
