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

  it('should rephrase 100% of sentences in the user technology essay', () => {
    const text = REPHRASE_SAMPLES.technologyEssay.text;
    const res = rephraseText(text, 'natural');

    expect(res.sentences.length).toBe(8);
    expect(res.totalSentences).toBe(8);
    expect(res.sentencesRephrased).toBe(8);
    expect(res.rephrasePercentage).toBe(100);
    expect(res.sentences.every(s => s.isRephrased)).toBe(true);

    // Natural human tone assertions
    expect(res.rephrasedText).toContain('Why Technology Matters in Our Everyday Lives');
    expect(res.rephrasedText).toContain('woven into almost every aspect');
    expect(res.rephrasedText).toContain('Thanks to the internet');
    expect(res.rephrasedText).toContain('glued to screens can drain hours and hurt our well-being');
    expect(res.rephrasedText).toContain('use technology with care and focus on the real benefits');

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
});
