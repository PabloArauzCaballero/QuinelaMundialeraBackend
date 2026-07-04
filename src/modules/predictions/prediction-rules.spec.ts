import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculatePredictionPoints } from './prediction-rules';

void describe('prediction rules', () => {
  void it('scores 3 points for exact result', () => {
    assert.equal(calculatePredictionPoints({ predictedHomeScore: 2, predictedAwayScore: 1 }, { homeScore: 2, awayScore: 1 }), 3);
  });

  void it('scores 1 point for correct winner only', () => {
    assert.equal(calculatePredictionPoints({ predictedHomeScore: 3, predictedAwayScore: 1 }, { homeScore: 2, awayScore: 0 }), 1);
  });

  void it('scores 0 points for wrong outcome', () => {
    assert.equal(calculatePredictionPoints({ predictedHomeScore: 0, predictedAwayScore: 1 }, { homeScore: 2, awayScore: 0 }), 0);
  });
});
