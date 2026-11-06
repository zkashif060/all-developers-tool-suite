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
    expect(res.rephrasedText).toContain('How Tech Shapes the Way We Live Every Day');
    expect(res.rephrasedText).toContain('impossible to get through an ordinary day now without touching a phone');
    expect(res.rephrasedText).toContain('check texts, do school assignments, knock out our jobs, or just unwind with a video');
    expect(res.rephrasedText).toContain('shooting a message to someone living halfway across the planet feels just like talking to a friend down the street');
    expect(res.rephrasedText).toContain('Students don’t even have to leave their bedrooms to sit through lectures');
    expect(res.rephrasedText).toContain('take care of all the repetitive paperwork and boring chores');
    expect(res.rephrasedText).toContain('zoning out in front of a screen for five hours straight eats up your day, drains your energy, and wrecks your sleep');
    expect(res.rephrasedText).toContain('set some boundaries—put technology to work for the things that really matter without letting it run your whole life');

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
    expect(res.rephrasedText).toContain('Why You Need Real Effort to Get Anywhere in Life');
    expect(res.rephrasedText).toContain('Success rarely happens by pure accident.');
    expect(res.rephrasedText).toContain('grind through years of messy failures that nobody talks about');
    expect(res.rephrasedText).toContain('You just won’t build anything that lasts unless you show up and do the work on the days you want to quit.');
    expect(res.rephrasedText).toContain('pull late nights with their books to bring home passing marks');
    expect(res.rephrasedText).toContain('fall flat on their face. It stings, but throwing in the towel right then and there solves nothing');
    expect(res.rephrasedText).toContain('shows you where you messed up so you can fix it and come back sharper tomorrow');
    expect(res.rephrasedText).toContain('Grinding it out does a lot more than help you hit your goals—it gives you real backbone, teaches you to trust yourself, and keeps your chin up through the hard stuff.');

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
    expect(res.rephrasedText).not.toContain('keys to success');
    expect(res.rephrasedText).not.toContain('patience, dedication, and continuous effort');
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
