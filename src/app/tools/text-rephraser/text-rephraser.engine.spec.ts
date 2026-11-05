import { describe, it, expect } from 'vitest';
import {
  rephraseText,
  REPHRASE_SAMPLES
} from './text-rephraser.engine';

describe('TextRephraserEngine', () => {
  it('should return empty result for blank input', () => {
    const res = rephraseText('');
    expect(res.rephrasedText).toBe('');
    expect(res.originalWordCount).toBe(0);
    expect(res.replacements.length).toBe(0);
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

  it('should rephrase the user technology essay sample significantly', () => {
    const text = REPHRASE_SAMPLES.technologyEssay.text;
    const res = rephraseText(text, 'professional');

    expect(res.replacements.length).toBeGreaterThanOrEqual(10);
    expect(res.rephrasedText).toContain('The significance of Technology in modern daily life');
    expect(res.rephrasedText).toContain('become an essential component of');
    expect(res.rephrasedText).toContain('utilize it for');
    expect(res.rephrasedText).toContain('Enabled by the internet');
    expect(res.rephrasedText).toContain('across the globe');
    expect(res.rephrasedText).toContain('participate in virtual courses');
    expect(res.rephrasedText).toContain('acquire valuable competencies');
    expect(res.rephrasedText).toContain('instantaneously');
    expect(res.rephrasedText).toContain('more expedited and productive');
    expect(res.rephrasedText).toContain('manual labor');
    expect(res.rephrasedText).toContain('overreliance on');
    expect(res.rephrasedText).toContain('deplete productivity');
    expect(res.rephrasedText).toContain('adversely impact personal well-being');
    expect(res.rephrasedText).toContain('judiciously');
    expect(res.rephrasedText).toContain('tangible advantages');
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
