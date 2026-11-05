export type RephraseTone = 'professional' | 'concise' | 'academic' | 'technical';

export interface PhraseRule {
  pattern: RegExp;
  replacement: string;
  alternatives?: string[];
  reason: string;
  tone: RephraseTone | 'all';
}

export interface ReplacementItem {
  id: string;
  original: string;
  replacement: string;
  alternatives: string[];
  startIndex: number;
  endIndex: number;
  reason: string;
}

export interface RephraseResult {
  rephrasedText: string;
  originalText: string;
  originalWordCount: number;
  rephrasedWordCount: number;
  replacements: ReplacementItem[];
  readingTimeSeconds: number;
  wordsReduced: number;
}

/**
 * Professional, rule-based linguistic dictionary for deterministic in-browser text transformation.
 * Multi-word phrases are listed first to guarantee maximum contextual specificity.
 */
export const PHRASE_RULES: PhraseRule[] = [
  // --- Professional & Business Tone Rules ---
  {
    pattern: /\bin order to\b/gi,
    replacement: 'to',
    alternatives: ['with the objective of', 'so as to'],
    reason: 'Eliminated unnecessary wordiness',
    tone: 'all'
  },
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: 'because',
    alternatives: ['since', 'as'],
    reason: 'Streamlined causal phrase',
    tone: 'all'
  },
  {
    pattern: /\bat this point in time\b/gi,
    replacement: 'currently',
    alternatives: ['presently', 'now'],
    reason: 'Replaced wordy temporal phrase',
    tone: 'all'
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    replacement: 'for',
    alternatives: ['to facilitate', 'intended to'],
    reason: 'Streamlined prepositional phrase',
    tone: 'all'
  },
  {
    pattern: /\bin the event that\b/gi,
    replacement: 'if',
    alternatives: ['should', 'in case'],
    reason: 'Simplified conditional clause',
    tone: 'all'
  },
  {
    pattern: /\bwith reference to\b/gi,
    replacement: 'regarding',
    alternatives: ['concerning', 'in relation to'],
    reason: 'Elevated formal business terminology',
    tone: 'professional'
  },
  {
    pattern: /\bwith regard to\b/gi,
    replacement: 'regarding',
    alternatives: ['concerning', 'in connection with'],
    reason: 'Elevated business terminology',
    tone: 'professional'
  },
  {
    pattern: /\bhas the capability to\b/gi,
    replacement: 'can',
    alternatives: ['is equipped to', 'is capable of'],
    reason: 'Replaced indirect verbal phrase',
    tone: 'all'
  },
  {
    pattern: /\bis able to\b/gi,
    replacement: 'can',
    alternatives: ['possesses the capacity to'],
    reason: 'Direct verbal phrasing',
    tone: 'all'
  },
  {
    pattern: /\ba wide variety of\b/gi,
    replacement: 'various',
    alternatives: ['a diverse range of', 'multiple'],
    reason: 'Reduced redundant adjectives',
    tone: 'all'
  },
  {
    pattern: /\bat a later date\b/gi,
    replacement: 'subsequently',
    alternatives: ['later', 'in due course'],
    reason: 'Professional temporal transition',
    tone: 'professional'
  },
  {
    pattern: /\bin close proximity to\b/gi,
    replacement: 'adjacent to',
    alternatives: ['near', 'proximate to'],
    reason: 'Elevated precision',
    tone: 'professional'
  },
  {
    pattern: /\bprior to\b/gi,
    replacement: 'before',
    alternatives: ['preceding'],
    reason: 'Direct temporal marker',
    tone: 'concise'
  },
  {
    pattern: /\bsubsequent to\b/gi,
    replacement: 'following',
    alternatives: ['after'],
    reason: 'Streamlined sequencing',
    tone: 'all'
  },
  {
    pattern: /\buntil such time as\b/gi,
    replacement: 'until',
    alternatives: ['pending'],
    reason: 'Eliminated redundant filler',
    tone: 'all'
  },
  {
    pattern: /\bin spite of the fact that\b/gi,
    replacement: 'although',
    alternatives: ['even though', 'notwithstanding that'],
    reason: 'Simplified concessive clause',
    tone: 'all'
  },
  {
    pattern: /\bget in touch with\b/gi,
    replacement: 'contact',
    alternatives: ['communicate with', 'reach out to'],
    reason: 'Professional business verb',
    tone: 'professional'
  },
  {
    pattern: /\blet you know\b/gi,
    replacement: 'inform you',
    alternatives: ['notify you', 'advise you'],
    reason: 'Formal executive communication',
    tone: 'professional'
  },
  {
    pattern: /\blook into\b/gi,
    replacement: 'investigate',
    alternatives: ['examine', 'review', 'evaluate'],
    reason: 'Replaced casual phrasal verb',
    tone: 'professional'
  },
  {
    pattern: /\bfind out\b/gi,
    replacement: 'determine',
    alternatives: ['ascertain', 'identify'],
    reason: 'Objective analytical phrasing',
    tone: 'professional'
  },
  {
    pattern: /\bmake sure\b/gi,
    replacement: 'ensure',
    alternatives: ['verify', 'confirm'],
    reason: 'Clear decisive verb',
    tone: 'professional'
  },
  {
    pattern: /\bdeal with\b/gi,
    replacement: 'address',
    alternatives: ['manage', 'resolve'],
    reason: 'Replaced informal phrasal verb',
    tone: 'professional'
  },
  {
    pattern: /\btalk about\b/gi,
    replacement: 'discuss',
    alternatives: ['deliberate on', 'address'],
    reason: 'Elevated meeting/document tone',
    tone: 'professional'
  },
  {
    pattern: /\ba lot of\b/gi,
    replacement: 'numerous',
    alternatives: ['substantial', 'considerable'],
    reason: 'Replaced colloquial quantifier',
    tone: 'professional'
  },
  {
    pattern: /\blots of\b/gi,
    replacement: 'numerous',
    alternatives: ['multiple', 'significant'],
    reason: 'Professional vocabulary',
    tone: 'professional'
  },
  {
    pattern: /\bcheck in\b/gi,
    replacement: 'follow up',
    alternatives: ['request an update'],
    reason: 'Business correspondence standard',
    tone: 'professional'
  },
  {
    pattern: /\bfigure out\b/gi,
    replacement: 'resolve',
    alternatives: ['deduce', 'determine'],
    reason: 'Analytical professional verb',
    tone: 'professional'
  },
  {
    pattern: /\bcome up with\b/gi,
    replacement: 'develop',
    alternatives: ['formulate', 'devise'],
    reason: 'Elevated executive verb',
    tone: 'professional'
  },
  {
    pattern: /\bcarry out\b/gi,
    replacement: 'execute',
    alternatives: ['implement', 'conduct'],
    reason: 'Action-oriented professional phrasing',
    tone: 'professional'
  },
  {
    pattern: /\bpoint out\b/gi,
    replacement: 'highlight',
    alternatives: ['indicate', 'note'],
    reason: 'Formal presentation term',
    tone: 'professional'
  },
  {
    pattern: /\bgive a call\b/gi,
    replacement: 'telephone',
    alternatives: ['contact by phone'],
    reason: 'Formal correspondence standard',
    tone: 'professional'
  },
  {
    pattern: /\bthanks a lot\b/gi,
    replacement: 'thank you sincerely',
    alternatives: ['we greatly appreciate your support'],
    reason: 'Professional courtesy',
    tone: 'professional'
  },
  {
    pattern: /\bI think that\b/gi,
    replacement: 'Our assessment indicates that',
    alternatives: ['Evidence suggests that', 'We anticipate that'],
    reason: 'Substituted subjective phrasing with professional assertion',
    tone: 'professional'
  },
  {
    pattern: /\bin my opinion\b/gi,
    replacement: 'from our perspective',
    alternatives: ['based on our evaluation'],
    reason: 'Professional perspective',
    tone: 'professional'
  },

  // --- Academic Tone Rules ---
  {
    pattern: /\bshows that\b/gi,
    replacement: 'demonstrates that',
    alternatives: ['substantiates that', 'indicates that'],
    reason: 'Academic verification term',
    tone: 'academic'
  },
  {
    pattern: /\bproves that\b/gi,
    replacement: 'empirically validates that',
    alternatives: ['substantiates that'],
    reason: 'Rigorous scientific terminology',
    tone: 'academic'
  },
  {
    pattern: /\bbig difference\b/gi,
    replacement: 'substantial discrepancy',
    alternatives: ['statistically significant variance'],
    reason: 'Elevated academic precision',
    tone: 'academic'
  },
  {
    pattern: /\bgood example\b/gi,
    replacement: 'prime illustration',
    alternatives: ['archetypal paradigm', 'salient case'],
    reason: 'Scholarly rhetoric',
    tone: 'academic'
  },
  {
    pattern: /\bleads to\b/gi,
    replacement: 'precipitates',
    alternatives: ['engenders', 'culminates in'],
    reason: 'Causal academic vocabulary',
    tone: 'academic'
  },
  {
    pattern: /\bmain idea\b/gi,
    replacement: 'central thesis',
    alternatives: ['core premise', 'fundamental postulate'],
    reason: 'Academic framing',
    tone: 'academic'
  },
  {
    pattern: /\bas a result\b/gi,
    replacement: 'consequently',
    alternatives: ['henceforth', 'accordingly'],
    reason: 'Formal discourse connector',
    tone: 'academic'
  },

  // --- Technical / Engineering Tone Rules ---
  {
    pattern: /\bbreak down\b/gi,
    replacement: 'decompose',
    alternatives: ['partition', 'dissect'],
    reason: 'Engineering modular terminology',
    tone: 'technical'
  },
  {
    pattern: /\bsetup\b/gi,
    replacement: 'configure',
    alternatives: ['initialize', 'provision'],
    reason: 'Standard systems engineering term',
    tone: 'technical'
  },
  {
    pattern: /\bspeed up\b/gi,
    replacement: 'optimize performance of',
    alternatives: ['accelerate', 'streamline latency of'],
    reason: 'Technical performance term',
    tone: 'technical'
  },
  {
    pattern: /\brun the code\b/gi,
    replacement: 'execute the program',
    alternatives: ['invoke the script'],
    reason: 'Technical execution phrasing',
    tone: 'technical'
  },
  {
    pattern: /\bfix the bug\b/gi,
    replacement: 'remediate the defect',
    alternatives: ['resolve the issue', 'patch the vulnerability'],
    reason: 'Software quality assurance standard',
    tone: 'technical'
  },
  {
    pattern: /\bstart up\b/gi,
    replacement: 'bootstrap',
    alternatives: ['initialize', 'instantiate'],
    reason: 'Systems engineering standard',
    tone: 'technical'
  },
  {
    pattern: /\bturn on\b/gi,
    replacement: 'enable',
    alternatives: ['activate'],
    reason: 'Standard technical flag terminology',
    tone: 'technical'
  },
  {
    pattern: /\bturn off\b/gi,
    replacement: 'disable',
    alternatives: ['deactivate', 'terminate'],
    reason: 'Standard technical flag terminology',
    tone: 'technical'
  }
];

export const REPHRASE_SAMPLES = {
  businessEmail: {
    name: 'Client Email & Status Update',
    text: `Hey there,
I just wanted to check in and let you know about the project status. In order to make sure we don't run into problems at a later date, we carried out a wide variety of tests.

Due to the fact that we found out a lot of small bugs, our team had to deal with them prior to release. At this point in time, the system has the capability to handle requests smoothly.

Please get in touch with us if you want to talk about the final rollout.`
  },
  technicalSpec: {
    name: 'Technical Architecture & Operations',
    text: `In order to setup the server, you need to make sure you turn on the caching feature.
Subsequent to deployment, this has the capability to speed up response times for a wide variety of users.

If you run into issues, look into the error logs so we can fix the bug and carry out a quick patch.`
  },
  academicReport: {
    name: 'Research Findings & Analysis',
    text: `Due to the fact that prior research had a lot of limitations, this study has the capability to provide a good example of empirical testing.

In order to find out whether the hypothesis holds, we carried out extensive trials. The experiment shows that there is a big difference between both groups, which leads to our central conclusion.`
  }
};

/**
 * Rephrases text deterministically using linguistic rule banks, maintaining capitalization and syntax boundaries.
 */
export function rephraseText(
  source: string,
  tone: RephraseTone = 'professional'
): RephraseResult {
  if (!source || !source.trim()) {
    return {
      rephrasedText: '',
      originalText: '',
      originalWordCount: 0,
      rephrasedWordCount: 0,
      replacements: [],
      readingTimeSeconds: 0,
      wordsReduced: 0
    };
  }

  const originalWords = countWords(source);
  let transformed = source;
  const replacements: ReplacementItem[] = [];
  let replId = 0;

  // Filter applicable rules for selected tone + universal rules
  const activeRules = PHRASE_RULES.filter(
    rule => rule.tone === 'all' || rule.tone === tone
  );

  for (const rule of activeRules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    // Reset regex index
    regex.lastIndex = 0;

    while ((match = regex.exec(transformed)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      // Preserve capitalization style
      const replacementText = matchCapitalization(matchText, rule.replacement);

      replacements.push({
        id: `rep-${++replId}`,
        original: matchText,
        replacement: replacementText,
        alternatives: (rule.alternatives || []).map(alt =>
          matchCapitalization(matchText, alt)
        ),
        startIndex: matchIndex,
        endIndex: matchIndex + matchText.length,
        reason: rule.reason
      });

      // Replace in transformed string
      transformed =
        transformed.slice(0, matchIndex) +
        replacementText +
        transformed.slice(matchIndex + matchText.length);

      // Advance regex search index to prevent infinite loops
      regex.lastIndex = matchIndex + replacementText.length;
    }
  }

  const rephrasedWords = countWords(transformed);
  const wordsReduced = Math.max(0, originalWords - rephrasedWords);
  const readingTimeSeconds = Math.ceil((rephrasedWords / 200) * 60);

  return {
    rephrasedText: transformed,
    originalText: source,
    originalWordCount: originalWords,
    rephrasedWordCount: rephrasedWords,
    replacements,
    readingTimeSeconds,
    wordsReduced
  };
}

/**
 * Matches capitalization of replacement text to the original matched substring.
 */
function matchCapitalization(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;

  // All uppercase: "IN ORDER TO" -> "TO"
  if (original === original.toUpperCase() && original !== original.toLowerCase()) {
    return replacement.toUpperCase();
  }

  // Title case / Sentence case: "In order to" -> "To"
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }

  return replacement.toLowerCase();
}

/**
 * Accurately counts words in text.
 */
function countWords(str: string): number {
  const matches = str.trim().match(/\b[\w'-]+\b/g);
  return matches ? matches.length : 0;
}
