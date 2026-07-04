import assert from 'node:assert/strict';
import { calculatePredictionPoints } from '../../src/modules/predictions/prediction-rules';

assert.equal(calculatePredictionPoints({ predictedHomeScore: 2, predictedAwayScore: 1 }, { homeScore: 2, awayScore: 1 }), 3);
assert.equal(calculatePredictionPoints({ predictedHomeScore: 1, predictedAwayScore: 0 }, { homeScore: 3, awayScore: 2 }), 1);
assert.equal(calculatePredictionPoints({ predictedHomeScore: 0, predictedAwayScore: 0 }, { homeScore: 0, awayScore: 1 }), 0);

console.log('OK smoke: reglas de puntuación');
