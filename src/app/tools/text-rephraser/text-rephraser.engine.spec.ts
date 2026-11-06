import { describe, it, expect } from 'vitest';
import {
  rephraseText,
  swapSentenceAlternative,
  splitSentencesWithSuffix,
  REPHRASE_SAMPLES
} from './text-rephraser.engine';

describe('TextRephraserEngine', () => {
  it('should return empty result for blank input', () => {
    const res = rephraseText('');
    expect(res.rephrasedText).toBe('');
    expect(res.originalWordCount).toBe(0);
    expect(res.sentences.length).toBe(0);
    expect(res.replacements.length).toBe(0);
    expect(res.totalSentences).toBe(0);
  });

  it('should accurately split paragraphs and sentences while tracking suffixes', () => {
    const text = 'First sentence. Second sentence!\n\nNew paragraph heading\n\nParagraph text.';
    const splits = splitSentencesWithSuffix(text);
    expect(splits.length).toBe(4);
    expect(splits[0].original).toBe('First sentence.');
    expect(splits[0].suffix).toBe(' ');
    expect(splits[1].original).toBe('Second sentence!');
    expect(splits[1].suffix).toBe('\n\n');
    expect(splits[2].original).toBe('New paragraph heading');
    expect(splits[2].suffix).toBe('\n\n');
  });

  it('should rephrase wordy business phrases into professional equivalents', () => {
    const text = 'In order to make sure we succeed, please get in touch with us.';
    const res = rephraseText(text, 'professional');

    expect(res.rephrasedText).toContain('To ensure we succeed');
    expect(res.rephrasedText).toContain('contact us');
    expect(res.replacements.length).toBeGreaterThanOrEqual(2);
  });

  it('should preserve sentence capitalization when replacing phrases', () => {
    const text = 'Due to the fact that it rained, we canceled.';
    const res = rephraseText(text, 'concise');
    expect(res.rephrasedText).toBe('Because it rained, we canceled.');
  });

  it('should preserve all-caps capitalization', () => {
    const text = 'WE MUST MAKE SURE THIS WORKS.';
    const res = rephraseText(text, 'professional');
    expect(res.rephrasedText).toContain('ENSURE');
  });

  it('should rephrase 100% of sentences in the user technology essay with simple human words', () => {
    const text = REPHRASE_SAMPLES.technologyEssay.text;
    const res = rephraseText(text, 'simple');

    expect(res.sentences.length).toBe(8);
    expect(res.totalSentences).toBe(8);
    expect(res.sentencesRephrased).toBe(8);
    expect(res.rephrasePercentage).toBe(100);
    expect(res.sentences.every(s => s.isRephrased)).toBe(true);

    // Simple & Human Anti-AI assertions
    expect(res.rephrasedText).toContain('How Technology Shapes Our Daily Life');
    expect(res.rephrasedText).toContain('Most of us rely on technology every single day.');
    expect(res.rephrasedText).toContain('phones and computers to study, talk to friends, run businesses, and have fun');
    expect(res.rephrasedText).toContain('The internet lets anyone talk to family and friends across the world without any trouble.');
    expect(res.rephrasedText).toContain('Students can take classes from home, pick up new skills, and look up facts in just a few seconds.');
    expect(res.rephrasedText).toContain('get work done a lot quicker with fewer hands-on chores');
    expect(res.rephrasedText).toContain('staring at screens can eat away our day and hurt our health');
    expect(res.rephrasedText).toContain('use technology in a smart way, so we get the good parts without the bad');

    // Asserts zero synthetic AI detector triggers
    expect(res.rephrasedText).not.toContain('woven into');
    expect(res.rephrasedText).not.toContain('effortless');
    expect(res.rephrasedText).not.toContain('drain hours and hurt our well-being');
    expect(res.rephrasedText).not.toContain('adversely impact');

    // Every sentence must provide multiple alternative rephrasings
    expect(res.sentences.every(s => s.alternatives.length >= 2)).toBe(true);
  });

  it('should rephrase every sentence in professional tone with clean executive register', () => {
    const text = REPHRASE_SAMPLES.technologyEssay.text;
    const res = rephraseText(text, 'professional');

    expect(res.sentences.length).toBe(8);
    expect(res.sentences.every(s => s.isRephrased)).toBe(true);
    expect(res.rephrasedText).toContain('The Critical Role of Technology in Everyday Life');
    expect(res.rephrasedText).toContain('essential pillar of everyday life');
    expect(res.rephrasedText).toContain('effortlessly across the globe');
    expect(res.rephrasedText).toContain('helped companies operate faster and more efficiently');
  });

  it('should support interactive sentence alternative swapping', () => {
    const text = REPHRASE_SAMPLES.technologyEssay.text;
    const initialRes = rephraseText(text, 'natural');

    const sentenceIndex = 6; // screen time sentence
    const altOption = initialRes.sentences[sentenceIndex].alternatives[0];
    expect(altOption).toBeDefined();

    const updatedRes = swapSentenceAlternative(initialRes, sentenceIndex, altOption);
    expect(updatedRes.sentences[sentenceIndex].rephrased).toBe(altOption);
    expect(updatedRes.rephrasedText).toContain(altOption);
    expect(updatedRes.rephrasePercentage).toBe(100);
  });

  it('should support technical engineering rephrasing', () => {
    const text = 'We need to setup the server and turn on caching to speed up the app.';
    const res = rephraseText(text, 'technical');

    expect(res.rephrasedText).toContain('configure the server');
    expect(res.rephrasedText).toContain('enable caching');
    expect(res.rephrasedText).toContain('optimize performance of the app');
  });

  it('should support academic and research rephrasing', () => {
    const text = 'The data shows that there is a big difference, which leads to our main idea.';
    const res = rephraseText(text, 'academic');

    expect(res.rephrasedText).toContain('demonstrates that');
    expect(res.rephrasedText).toContain('substantial discrepancy');
    expect(res.rephrasedText).toContain('precipitates our central thesis');
  });

  it('should rephrase 100% of sentences in the hard work essay with simple human words and zero AI triggers', () => {
    const text = REPHRASE_SAMPLES.hardWorkEssay.text;
    const res = rephraseText(text, 'simple');

    expect(res.sentences.length).toBe(8);
    expect(res.totalSentences).toBe(8);
    expect(res.sentencesRephrased).toBe(8);
    expect(res.rephrasePercentage).toBe(100);
    expect(res.sentences.every(s => s.isRephrased)).toBe(true);

    // Simple & Human phrasing assertions
    expect(res.rephrasedText).toContain('Why Hard Work Matters in Life');
    expect(res.rephrasedText).toContain('Putting in real effort is one of the main keys to success.');
    expect(res.rephrasedText).toContain('Every person who succeeds has dealt with tough challenges before reaching their goals.');
    expect(res.rephrasedText).toContain('You cannot achieve anything worthwhile without patience, dedication, and steady effort.');
    expect(res.rephrasedText).toContain('Students have to study hard to earn good grades, and professionals must sharpen their skills to grow their careers.');
    expect(res.rephrasedText).toContain('Sometimes people fail even when they give it their all, but failure should never keep them from trying again.');
    expect(res.rephrasedText).toContain('Instead, it should teach valuable lessons and make us even stronger.');
    expect(res.rephrasedText).toContain('Hard work not only helps us reach our dreams, but it also builds confidence, discipline, and a positive outlook on life.');

    // Asserts zero tough vocabulary words or AI detector triggers
    expect(res.rephrasedText).not.toContain('Diligent effort');
    expect(res.rephrasedText).not.toContain('diligent effort');
    expect(res.rephrasedText).not.toContain('challenging to');
    expect(res.rephrasedText).not.toContain('effective grades');
    expect(res.rephrasedText).not.toContain('providing their best');
    expect(res.rephrasedText).not.toContain('halt them from striving');
    expect(res.rephrasedText).not.toContain('create them stronger');
    expect(res.rephrasedText).not.toContain('assists us');
    expect(res.rephrasedText).not.toContain('The significance of');
  });

  it('should naturally elevate easy and simplistic words when professional tone is selected', () => {
    const text = REPHRASE_SAMPLES.casualText.text;
    const res = rephraseText(text, 'professional');

    expect(res.easyWordsElevatedCount).toBeGreaterThanOrEqual(5);
    expect(res.sentences.every(s => s.isRephrased)).toBe(true);

    // Verify professional phrasing
    expect(res.rephrasedText).toContain('simple and straightforward');
    expect(res.rephrasedText).toContain('slip up noticeably');
    expect(res.rephrasedText).toContain('tackle demanding challenges');
    expect(res.rephrasedText).toContain('solid support');
    expect(res.rephrasedText).toContain('Numerous challenges');
    expect(res.rephrasedText).toContain('uncover valuable insights');

    // Verify it doesn't contain AI robotic clichés
    expect(res.rephrasedText).not.toContain('delve');
    expect(res.rephrasedText).not.toContain('utilize');
    expect(res.rephrasedText).not.toContain('tapestry');
    expect(res.rephrasedText).not.toContain('adversely impact');
  });
});
