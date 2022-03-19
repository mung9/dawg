import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { buildWordGraph } from './dawg';

const add = suite('add');
add('words not in alphabetical order and throw error', () => {
  const dataset = [
    ['b', 'a'],
    ['나', '가'],
  ];

  for (const words of dataset) {
    const builder = buildWordGraph();
    builder.add(words[0]);
    assert.throws(() => builder.add(words[1]));
  }
});

const findPrefixes = suite('findPrefixes');
findPrefixes('should return all prefixes', () => {
  const dataset = ['스타벅스', '스타', '스타크래프트', '스타트', '파스타벅스'];
  const wg = dataset
    .sort()
    .reduce((builder, word) => builder.add(word), buildWordGraph())
    .finish();
  assert.equal(wg.findPrefixes('스타벅스강남역점'), ['스타', '스타벅스']);
  assert.equal(wg.findPrefixes('스타트'), ['스타', '스타트']);
});

const indexOf = suite('indexOf');
indexOf('should return index of the input word or -1', () => {
  const dataset = ['스타벅스', '스타벅스멜론', '스타', '스타멜론'];
  const wg = dataset
    .sort()
    .reduce((builder, word) => builder.add(word), buildWordGraph())
    .finish();
  assert.is(wg.indexOf('롯데리아'), -1);
  assert.is(wg.indexOf(''), -1);
  assert.is(wg.indexOf('스타'), 0);
  assert.is(wg.indexOf('스타벅스'), 2);
  assert.is(wg.indexOf('스타벅스멜론'), 3);
  assert.is(wg.indexOf('스타멜론'), 1);
});

const nodesCount = suite('nodesCount');
nodesCount('should return minimized nodes count', () => {
  const tests = [
    {
      words: ['스타벅스', '스타벅스멜론', '스타', '스타멜론'],
      expectedCount: 6,
    },
    {
      words: [],
      expectedCount: 0,
    },
  ];
  for (const test of tests) {
    const actualCount = test.words
      .sort()
      .reduce((builder, word) => builder.add(word), buildWordGraph())
      .finish().nodesCount;
    assert.is(actualCount, test.expectedCount);
  }
});

const wordsCount = suite('wordsCount');
wordsCount('should return added words count', () => {
  const dataset = [
    {
      words: ['스타벅스', '스타벅스멜론', '스타', '스타멜론'],
      expectedCount: 4,
    },
    {
      words: [],
      expectedCount: 0,
    },
    {
      words: ['스타벅스', '스타벅스'],
      expectedCount: 1,
    },
  ];

  for (const { words, expectedCount } of dataset) {
    const actualCount = words
      .sort()
      .reduce((builder, word) => builder.add(word), buildWordGraph())
      .finish().wordsCount;
    assert.is(actualCount, expectedCount);
  }
});

add.run();
findPrefixes.run();
indexOf.run();
nodesCount.run();
wordsCount.run();
