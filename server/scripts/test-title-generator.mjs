import assert from 'node:assert/strict';
import { generateRuleBasedTitle, FALLBACK_TITLE } from '../src/services/agroAI/conversation/titleGenerator.js';

let pass = 0, fail = 0;
function record(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    pass++;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e.message}`);
    fail++;
  }
}

record('strips filler words and title-cases', () => {
  assert.equal(generateRuleBasedTitle('my tomato leaves are becoming yellow'), 'Tomato Leaves Becoming Yellow');
});

record('caps at 5 meaningful words', () => {
  assert.equal(generateRuleBasedTitle('what fertilizer should i use for my paddy crop this season'), 'What Fertilizer Should Use Paddy');
});

record('empty/whitespace-only text returns null', () => {
  assert.equal(generateRuleBasedTitle(''), null);
  assert.equal(generateRuleBasedTitle('   '), null);
  assert.equal(generateRuleBasedTitle(undefined), null);
});

record('all-filler-word message (bare greeting) returns null, not a literal "Hi" title', () => {
  assert.equal(generateRuleBasedTitle('hi'), null);
  assert.equal(generateRuleBasedTitle('please'), null);
});

record('long single title is truncated to the max length with an ellipsis', () => {
  const result = generateRuleBasedTitle('supercalifragilisticexpialidocious tomato disease problem today now');
  assert.equal(result.length <= 40, true, `expected <=40 chars, got ${result.length}`);
  assert.equal(result.endsWith('…'), true);
});

record('FALLBACK_TITLE is a non-empty safe string', () => {
  assert.equal(typeof FALLBACK_TITLE, 'string');
  assert.equal(FALLBACK_TITLE.length > 0, true);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
