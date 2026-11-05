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
 * Comprehensive linguistic rule dictionary for deterministic in-browser text transformation.
 * Evaluates contextual multi-word idioms, pleonasms, academic vocabulary, and common plain verbs.
 */
export const PHRASE_RULES: PhraseRule[] = [
  // --- High-Level Multi-Word Phrasal Idioms & Collocations ---
  {
    pattern: /\bthe importance of\b/gi,
    replacement: 'the significance of',
    alternatives: ['the vital role of', 'the pivotal importance of'],
    reason: 'Elevated formal rhetoric',
    tone: 'all'
  },
  {
    pattern: /\bin our daily lives\b/gi,
    replacement: 'in modern daily life',
    alternatives: ['in contemporary society', 'in everyday life'],
    reason: 'Elevated contextual scope',
    tone: 'professional'
  },
  {
    pattern: /\bour daily lives\b/gi,
    replacement: 'everyday life',
    alternatives: ['daily existence', 'contemporary living'],
    reason: 'Objective formal phrasing',
    tone: 'all'
  },
  {
    pattern: /\bdaily lives\b/gi,
    replacement: 'everyday routines',
    alternatives: ['daily activities'],
    reason: 'Professional precision',
    tone: 'all'
  },
  {
    pattern: /\bbecome an important part of\b/gi,
    replacement: 'become an essential component of',
    alternatives: ['become integral to', 'become a cornerstone of'],
    reason: 'Elevated idiom to executive prose',
    tone: 'all'
  },
  {
    pattern: /\ban important part of\b/gi,
    replacement: 'an integral facet of',
    alternatives: ['a vital element of', 'a key component of'],
    reason: 'Elevated vocabulary',
    tone: 'all'
  },
  {
    pattern: /\bimportant part\b/gi,
    replacement: 'integral component',
    alternatives: ['crucial element', 'vital facet'],
    reason: 'Sophisticated professional phrasing',
    tone: 'all'
  },
  {
    pattern: /\bwith the help of\b/gi,
    replacement: 'enabled by',
    alternatives: ['through the facilitation of', 'via'],
    reason: 'Direct agency attribution',
    tone: 'all'
  },
  {
    pattern: /\beasily connect with\b/gi,
    replacement: 'seamlessly communicate with',
    alternatives: ['collaborate directly with', 'interface with'],
    reason: 'Professional capability descriptor',
    tone: 'professional'
  },
  {
    pattern: /\bconnect with others\b/gi,
    replacement: 'collaborate globally',
    alternatives: ['interact with peers', 'communicate internationally'],
    reason: 'Professional collaboration phrasing',
    tone: 'all'
  },
  {
    pattern: /\bdifferent parts of the world\b/gi,
    replacement: 'across the globe',
    alternatives: ['internationally', 'worldwide'],
    reason: 'Streamlined global descriptor',
    tone: 'all'
  },
  {
    pattern: /\battend online classes\b/gi,
    replacement: 'participate in virtual courses',
    alternatives: ['engage in digital learning', 'attend remote lectures'],
    reason: 'Contemporary educational vocabulary',
    tone: 'all'
  },
  {
    pattern: /\blearn new skills\b/gi,
    replacement: 'acquire valuable competencies',
    alternatives: ['develop new proficiencies', 'build modern capabilities'],
    reason: 'Professional skill acquisition terminology',
    tone: 'all'
  },
  {
    pattern: /\bfind useful information\b/gi,
    replacement: 'access relevant knowledge',
    alternatives: ['retrieve critical data', 'locate valuable insights'],
    reason: 'Formal data retrieval terminology',
    tone: 'all'
  },
  {
    pattern: /\buseful information\b/gi,
    replacement: 'valuable insights',
    alternatives: ['relevant data', 'critical information'],
    reason: 'Elevated professional terminology',
    tone: 'all'
  },
  {
    pattern: /\bwithin seconds\b/gi,
    replacement: 'instantaneously',
    alternatives: ['in real time', 'rapidly'],
    reason: 'Precise temporal adverb',
    tone: 'all'
  },
  {
    pattern: /\bfaster and more efficient\b/gi,
    replacement: 'more expedited and productive',
    alternatives: ['more agile and streamlined', 'highly optimized'],
    reason: 'Executive business terminology',
    tone: 'professional'
  },
  {
    pattern: /\bmanual work\b/gi,
    replacement: 'manual labor',
    alternatives: ['routine manual operations', 'labor-intensive tasks'],
    reason: 'Industry-standard terminology',
    tone: 'all'
  },
  {
    pattern: /\bexcessive use of\b/gi,
    replacement: 'overreliance on',
    alternatives: ['disproportionate usage of', 'inordinate dependence upon'],
    reason: 'Analytical critique phrasing',
    tone: 'all'
  },
  {
    pattern: /\bwaste time\b/gi,
    replacement: 'deplete productivity',
    alternatives: ['consume valuable time', 'diminish efficiency'],
    reason: 'Professional productivity framing',
    tone: 'all'
  },
  {
    pattern: /\baffect our health\b/gi,
    replacement: 'adversely impact personal well-being',
    alternatives: ['compromise physical health', 'negatively influence wellness'],
    reason: 'Formal health impact terminology',
    tone: 'all'
  },
  {
    pattern: /\bwe should use\b/gi,
    replacement: 'we must employ',
    alternatives: ['organizations should utilize', 'individuals ought to leverage'],
    reason: 'Authoritative recommendation',
    tone: 'all'
  },
  {
    pattern: /\bwe should\b/gi,
    replacement: 'it is advisable to',
    alternatives: ['we ought to', 'it is recommended that we'],
    reason: 'Objective advisory phrasing',
    tone: 'professional'
  },
  {
    pattern: /\bpositive benefits\b/gi,
    replacement: 'tangible advantages',
    alternatives: ['constructive benefits', 'favorable outcomes'],
    reason: 'Eliminated redundant modifier (pleonasm)',
    tone: 'all'
  },
  {
    pattern: /\bbrings to our lives\b/gi,
    replacement: 'confers upon modern living',
    alternatives: ['provides to daily society', 'delivers to our everyday experience'],
    reason: 'Elevated concluding rhetoric',
    tone: 'all'
  },
  {
    pattern: /\buse it for\b/gi,
    replacement: 'utilize it for',
    alternatives: ['employ it for', 'leverage it toward'],
    reason: 'Elevated formal verb',
    tone: 'all'
  },

  // --- Corporate & Wordiness Reduction (Plain English & Business) ---
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
    pattern: /\btake into account\b/gi,
    replacement: 'consider',
    alternatives: ['factor in', 'evaluate'],
    reason: 'Concise verb replacement',
    tone: 'all'
  },
  {
    pattern: /\btake advantage of\b/gi,
    replacement: 'capitalize on',
    alternatives: ['leverage', 'maximize'],
    reason: 'Executive business phrasing',
    tone: 'professional'
  },
  {
    pattern: /\ball of a sudden\b/gi,
    replacement: 'abruptly',
    alternatives: ['unexpectedly', 'instantaneously'],
    reason: 'Single formal adverb',
    tone: 'all'
  },
  {
    pattern: /\bat the end of the day\b/gi,
    replacement: 'ultimately',
    alternatives: ['in conclusion', 'fundamentally'],
    reason: 'Replaced conversational cliché',
    tone: 'all'
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

  // --- Common Verbs & Adverbs Transformed to Professional Equivalents ---
  {
    pattern: /\bwisely\b/gi,
    replacement: 'judiciously',
    alternatives: ['prudently', 'strategically'],
    reason: 'Elevated professional adverb',
    tone: 'all'
  },
  {
    pattern: /\bimportant\b/gi,
    replacement: 'vital',
    alternatives: ['crucial', 'essential', 'pivotal'],
    reason: 'More impactful adjective',
    tone: 'all'
  },
  {
    pattern: /\buseful\b/gi,
    replacement: 'valuable',
    alternatives: ['beneficial', 'instrumental'],
    reason: 'Professional value adjective',
    tone: 'all'
  },
  {
    pattern: /\butilize\b/gi,
    replacement: 'employ',
    alternatives: ['leverage', 'utilize'],
    reason: 'Direct formal verb',
    tone: 'concise'
  },
  {
    pattern: /\buse\b/gi,
    replacement: 'utilize',
    alternatives: ['employ', 'leverage'],
    reason: 'Elevated formal verb',
    tone: 'professional'
  },
  {
    pattern: /\buses\b/gi,
    replacement: 'utilizes',
    alternatives: ['employs', 'leverages'],
    reason: 'Elevated formal verb',
    tone: 'professional'
  },
  {
    pattern: /\bused\b/gi,
    replacement: 'utilized',
    alternatives: ['employed', 'leveraged'],
    reason: 'Elevated formal verb',
    tone: 'professional'
  },
  {
    pattern: /\busing\b/gi,
    replacement: 'utilizing',
    alternatives: ['employing', 'leveraging'],
    reason: 'Elevated formal participle',
    tone: 'professional'
  },
  {
    pattern: /\bhelp\b/gi,
    replacement: 'assist',
    alternatives: ['facilitate', 'support'],
    reason: 'Elevated professional verb',
    tone: 'professional'
  },
  {
    pattern: /\bhelps\b/gi,
    replacement: 'facilitates',
    alternatives: ['assists', 'enables'],
    reason: 'Elevated professional verb',
    tone: 'professional'
  },
  {
    pattern: /\bhelped\b/gi,
    replacement: 'facilitated',
    alternatives: ['assisted', 'supported'],
    reason: 'Elevated professional verb',
    tone: 'professional'
  },
  {
    pattern: /\bhelping\b/gi,
    replacement: 'facilitating',
    alternatives: ['assisting', 'supporting'],
    reason: 'Elevated professional verb',
    tone: 'professional'
  },
  {
    pattern: /\bfocus on\b/gi,
    replacement: 'prioritize',
    alternatives: ['emphasize', 'concentrate on'],
    reason: 'Decisive executive phrasing',
    tone: 'all'
  },
  {
    pattern: /\bfocuses on\b/gi,
    replacement: 'prioritizes',
    alternatives: ['emphasizes', 'concentrates on'],
    reason: 'Decisive executive phrasing',
    tone: 'all'
  },
  {
    pattern: /\bfocused on\b/gi,
    replacement: 'prioritized',
    alternatives: ['emphasized', 'concentrated on'],
    reason: 'Decisive executive phrasing',
    tone: 'all'
  },
  {
    pattern: /\bfocusing on\b/gi,
    replacement: 'prioritizing',
    alternatives: ['emphasizing', 'concentrating on'],
    reason: 'Decisive executive phrasing',
    tone: 'all'
  },
  {
    pattern: /\bbig\b/gi,
    replacement: 'substantial',
    alternatives: ['considerable', 'extensive'],
    reason: 'Formal magnitude descriptor',
    tone: 'professional'
  },
  {
    pattern: /\bgood\b/gi,
    replacement: 'favorable',
    alternatives: ['advantageous', 'commendable'],
    reason: 'Nuanced professional evaluation',
    tone: 'professional'
  },
  {
    pattern: /\bbad\b/gi,
    replacement: 'adverse',
    alternatives: ['detrimental', 'unfavorable'],
    reason: 'Formal critical adjective',
    tone: 'professional'
  },
  {
    pattern: /\beasily\b/gi,
    replacement: 'readily',
    alternatives: ['effortlessly', 'seamlessly'],
    reason: 'Professional adverb',
    tone: 'all'
  },
  {
    pattern: /\bneed to\b/gi,
    replacement: 'must',
    alternatives: ['are required to', 'ought to'],
    reason: 'Direct actionable verb',
    tone: 'all'
  },
  {
    pattern: /\bstart\b/gi,
    replacement: 'commence',
    alternatives: ['initiate', 'launch'],
    reason: 'Formal project initiation verb',
    tone: 'professional'
  },
  {
    pattern: /\bstarted\b/gi,
    replacement: 'commenced',
    alternatives: ['initiated', 'launched'],
    reason: 'Formal verb',
    tone: 'professional'
  },
  {
    pattern: /\bstop\b/gi,
    replacement: 'cease',
    alternatives: ['discontinue', 'halt'],
    reason: 'Formal cessation verb',
    tone: 'professional'
  },
  {
    pattern: /\bstopped\b/gi,
    replacement: 'ceased',
    alternatives: ['discontinued', 'halted'],
    reason: 'Formal cessation verb',
    tone: 'professional'
  },
  {
    pattern: /\bkeep\b/gi,
    replacement: 'maintain',
    alternatives: ['retain', 'preserve'],
    reason: 'Formal continuation verb',
    tone: 'professional'
  },
  {
    pattern: /\bkeeps\b/gi,
    replacement: 'maintains',
    alternatives: ['retains', 'preserves'],
    reason: 'Formal continuation verb',
    tone: 'professional'
  },
  {
    pattern: /\bbuy\b/gi,
    replacement: 'procure',
    alternatives: ['acquire', 'purchase'],
    reason: 'Commercial procurement term',
    tone: 'professional'
  },
  {
    pattern: /\bchanges\b/gi,
    replacement: 'modifications',
    alternatives: ['adaptations', 'revisions'],
    reason: 'Professional noun',
    tone: 'professional'
  },

  // --- Academic Tone Specifics ---
  {
    pattern: /\bshows that\b/gi,
    replacement: 'demonstrates that',
    alternatives: ['substantiates that', 'indicates that'],
    reason: 'Academic verification term',
    tone: 'academic'
  },
  {
    pattern: /\bbig difference\b/gi,
    replacement: 'substantial discrepancy',
    alternatives: ['significant variance', 'marked distinction'],
    reason: 'Elevated academic precision',
    tone: 'all'
  },
  {
    pattern: /\bproves that\b/gi,
    replacement: 'empirically validates that',
    alternatives: ['substantiates that'],
    reason: 'Rigorous scientific terminology',
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

  // --- Technical / Engineering Tone Specifics ---
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
  technologyEssay: {
    name: 'Technology in Daily Life (User Essay)',
    text: `The Importance of Technology in Our Daily Lives

Technology has become an important part of our daily lives. We use it for education, communication, business, and entertainment. With the help of the internet, people can easily connect with others from different parts of the world. Students can attend online classes, learn new skills, and find useful information within seconds. Technology has also made businesses faster and more efficient by reducing manual work. However, excessive use of technology can waste time and affect our health. Therefore, we should use technology wisely and focus on the positive benefits it brings to our lives.`
  },
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
 * Rules are sorted by pattern length descending to guarantee multi-word phrases match before single-word tokens.
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

  // CRITICAL: Sort by pattern source length descending so longest multi-word expressions match FIRST
  activeRules.sort((a, b) => b.pattern.source.length - a.pattern.source.length);

  for (const rule of activeRules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

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
