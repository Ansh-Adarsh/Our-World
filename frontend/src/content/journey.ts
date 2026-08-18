/**
 * Journey content — the single source of truth for everything the guided
 * onboarding journey *says*.
 *
 * Why this file exists: the journey has to feel personal without any personal
 * data living in the repo. So nothing here is a real name, date or private
 * detail — the copy carries `{{placeholders}}` that are filled at runtime from
 * the couple record the user themself created, and the birthday letter falls
 * back through three configurable layers (see buildBirthdayMessage).
 *
 * Edit this file to reword the journey. No component needs to change.
 */
import type { Couple } from '@/types';

// ─── Question model ───────────────────────────────────────────────────────────

/** Which couples-table column a setup answer writes to, if any. */
export type CoupleField = 'couple_name' | 'anniversary_date' | 'partner_name' | 'partner_birthday';

interface JourneyQuestionBase {
  id: string;
  title: string;
  subtitle: string;
  /** 'setup' collects the data the app needs. 'riddles' is the teasing game. */
  chapter: 'setup' | 'riddles';
  /** The last riddle — triggers the door-unlock gateway transition. */
  isGateway?: boolean;
}

/** Setup questions accept any answer. They ask, they never test. */
export interface SetupQuestion extends JourneyQuestionBase {
  chapter: 'setup';
  kind: 'text' | 'date' | 'textarea' | 'partner_details';
  /** Answer may be left blank and still continue. */
  optional?: boolean;
}

/** Pick-one riddle. */
export interface ChoiceQuestion extends JourneyQuestionBase {
  chapter: 'riddles';
  kind: 'choice';
  options: string[];
  correctIndex: number;
  /** Shown in order on each wrong attempt, then the last one repeats. */
  hints: string[];
  /** Reply shown when they get it right. */
  reward: string;
}

/** Typed-answer riddle. */
export interface GuessQuestion extends JourneyQuestionBase {
  chapter: 'riddles';
  kind: 'guess';
  placeholder: string;
  /** Accepted answers, compared loosely (case/spacing/punctuation-insensitive). */
  accept: string[];
  /**
   * Also accept whatever the couple stored in this column. This is how the
   * riddle stays personal without personal data in the repo: the value comes
   * from what the couple entered themselves.
   * If the column is empty, the question accepts any non-empty answer rather
   * than becoming a dead end.
   */
  acceptFromCouple?: CoupleField;
  hints: string[];
  reward: string;
}

export type JourneyQuestion = SetupQuestion | ChoiceQuestion | GuessQuestion;

// ─── Chapter 1: our beginning (preserved from the original onboarding) ─────────
// These four questions and their couples-table bindings are unchanged — they
// still power the "Days Together" counter and the birthday countdown on Home.

const SETUP_QUESTIONS: SetupQuestion[] = [
  {
    id: 'couple_name',
    chapter: 'setup',
    kind: 'text',
    title: 'What shall we call our world?',
    subtitle: 'Give your shared universe a title or pet name',
  },
  {
    id: 'anniversary_date',
    chapter: 'setup',
    kind: 'date',
    title: 'When did your story begin?',
    subtitle: 'Your anniversary date powers your "Days Together" live counter',
  },
  {
    id: 'partner_details',
    chapter: 'setup',
    kind: 'partner_details',
    title: 'Tell us about your partner',
    subtitle: 'Their name and birthday so we can build your cinematic countdown',
  },
  {
    id: 'first_memory',
    chapter: 'setup',
    kind: 'textarea',
    title: 'A favorite memory or promise',
    subtitle: 'What is one thing that always makes you smile when you think of them?',
    optional: true,
  },
];

// ─── Chapter 2: do you really know me? (the teasing game) ─────────────────────
// Deliberately universal. Every "correct" answer is the warm one, so the game
// teases without ever being unfair — and the third question tests only what the
// user just told us themself.

const RIDDLE_QUESTIONS: JourneyQuestion[] = [
  {
    id: 'where_it_started',
    chapter: 'riddles',
    kind: 'choice',
    title: 'Do you remember where our story started?',
    subtitle: 'Think carefully. I remember every version of it.',
    options: [
      'The moment we first talked',
      'The moment we first laughed together',
      'Long before either of us admitted it',
    ],
    correctIndex: 2,
    hints: [
      'Hmm. Earlier than that.',
      'Earlier still… before there were words for it.',
      "It started before either of us was brave enough to say so.",
    ],
    reward: 'Exactly. It was already happening before we noticed.',
  },
  {
    id: 'who_fell_first',
    chapter: 'riddles',
    kind: 'choice',
    title: 'Who fell first?',
    subtitle: 'Be honest. I already know the answer.',
    options: ['You did', 'I did', 'Both of us, at exactly the same time'],
    correctIndex: 2,
    hints: [
      'Careful — this one is a trap.',
      "That's what you always say. Try again.",
      'Neither of us won that race. We tied.',
    ],
    reward: 'A tie. It was always a tie.',
  },
  {
    id: 'the_name',
    chapter: 'riddles',
    kind: 'guess',
    title: 'What name do I keep saved for you?',
    subtitle: 'The one nobody else gets to use.',
    placeholder: 'The name only I call you',
    accept: [],
    acceptFromCouple: 'partner_name',
    hints: [
      'You told me this one yourself, moments ago.',
      'Softer than your real name.',
      'It is the name you asked me to remember.',
    ],
    reward: 'That one. Always that one.',
  },
  {
    id: 'gateway',
    chapter: 'riddles',
    kind: 'choice',
    isGateway: true,
    title: 'Okay… maybe you really do belong here.',
    subtitle: 'One last answer, and the door opens.',
    options: [
      'I already know everything about you',
      'I am still learning you',
      'A little more of you, every single day',
    ],
    correctIndex: 2,
    hints: [
      'Too confident. Try something truer.',
      'Warmer. What does knowing me actually look like?',
      'It is not something finished. It is something continuing.',
    ],
    reward: 'Then come in. This place was built for you.',
  },
];

/** The full ordered journey. `onboarding_step` indexes into this array. */
export const JOURNEY_QUESTIONS: JourneyQuestion[] = [...SETUP_QUESTIONS, ...RIDDLE_QUESTIONS];

/** Chapter-1 only — used when an existing user edits their details from Home. */
export const SETUP_ONLY_QUESTIONS: SetupQuestion[] = SETUP_QUESTIONS;

export const CHAPTER_LABELS: Record<JourneyQuestion['chapter'], string> = {
  setup: 'Chapter One · Our Beginning',
  riddles: 'Chapter Two · Do You Really Know Me?',
};

// ─── Validation ───────────────────────────────────────────────────────────────

/** Loose compare: case, accents, punctuation and spacing are all ignored. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export interface AnswerVerdict {
  correct: boolean;
  /** Playful nudge shown on a wrong answer. Never a scolding. */
  hint?: string;
  /** Warm reply shown on a correct answer. */
  reward?: string;
}

/**
 * Validate one answer.
 *
 * Setup questions always pass (they collect, they do not test).
 * Riddles pass on the warm answer, and hand back a rotating hint otherwise —
 * `attempt` is the number of wrong tries so far, so the nudges escalate gently.
 */
export function validateJourneyAnswer(
  question: JourneyQuestion,
  value: string,
  attempt: number,
  couple: Couple | null,
): AnswerVerdict {
  if (question.chapter === 'setup') {
    return { correct: question.optional ? true : value.trim().length > 0 };
  }

  const hint = question.hints[Math.min(attempt, question.hints.length - 1)];

  if (question.kind === 'choice') {
    const chosen = Number(value);
    return Number.isInteger(chosen) && chosen === question.correctIndex
      ? { correct: true, reward: question.reward }
      : { correct: false, hint };
  }

  const answer = normalize(value);
  if (!answer) return { correct: false, hint };

  const accepted = [...question.accept];
  const fromCouple = question.acceptFromCouple ? couple?.[question.acceptFromCouple] : null;
  if (fromCouple) accepted.push(String(fromCouple));

  // Nothing to compare against (no stored value, no static list): accept any
  // real answer rather than locking the user out of their own journey.
  if (accepted.length === 0) return { correct: true, reward: question.reward };

  const match = accepted.some((candidate) => {
    const target = normalize(candidate);
    return target.length > 0 && (target === answer || target.includes(answer) || answer.includes(target));
  });

  return match ? { correct: true, reward: question.reward } : { correct: false, hint };
}

// ─── Welcome + gateway copy ───────────────────────────────────────────────────

export const JOURNEY_COPY = {
  welcome: {
    eyebrow: 'Our World',
    title: 'You are entering Our World…',
    subtitle: 'But first, prove you belong here ❤️',
    body: 'A few questions. Some of them easy, some of them not. Take your time — there is no way to fail, only to try again.',
    cta: 'I am ready',
  },
  gateway: {
    line1: 'Okay… maybe you really do belong here.',
    line2: 'Welcome to Our World ❤️',
  },
  wrongAnswerFallback: 'Not quite. Try again — I will wait.',
} as const;

// ─── Birthday content ─────────────────────────────────────────────────────────

export interface BirthdayContent {
  eyebrow: string;
  greeting: string;
  paragraphs: string[];
  quote: string;
  candleCount: number;
  candlePrompt: string;
  candleHint: string;
  celebration: string;
  cta: string;
}

/**
 * Resolve `{{placeholders}}`. Unknown keys are left untouched rather than
 * rendering as "undefined".
 */
export function resolveTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => vars[key] ?? whole);
}

const BIRTHDAY_TEMPLATE: BirthdayContent = {
  eyebrow: 'Something has been waiting for this day',
  greeting: 'Happy Birthday, {{partner_name}} ❤️',
  paragraphs: [
    'I built this whole place so there would be somewhere that is only ours — and today it belongs entirely to you.',
    'Today is not just your birthday. It is about celebrating you: every ordinary evening you make feel like something, every time you choose me again without making it sound like a choice.',
  ],
  quote: 'Today is not just your birthday…\nit is about celebrating you.',
  candleCount: 3,
  candlePrompt: 'Make a wish',
  candleHint: 'Tap the candles to blow them out',
  celebration: 'Whatever you wished for — I hope I get to be part of it.',
  cta: "Let's look at our memories ❤️",
};

/**
 * Build the birthday letter. Three configurable layers, most personal first:
 *
 *  1. `promise` — the couple's own words, read from their onboarding answer
 *     (`onboarding_answers.question_key = 'first_memory'`). Their voice, from
 *     their own database row.
 *  2. `VITE_BIRTHDAY_MESSAGE` — optional deploy-time override. Paragraphs are
 *     separated by blank lines. Note this is bundled into the client, so it is
 *     content, not a secret.
 *  3. The template above, with the partner's name filled in.
 */
export function buildBirthdayMessage(input: {
  partnerName?: string | null;
  coupleName?: string | null;
  promise?: string | null;
}): BirthdayContent {
  const vars = {
    partner_name: input.partnerName?.trim() || 'My Love',
    couple_name: input.coupleName?.trim() || 'Our World',
  };

  const override = (import.meta.env.VITE_BIRTHDAY_MESSAGE as string | undefined)?.trim();

  const paragraphs = override
    ? override.split(/\n\s*\n/).map((p) => resolveTemplate(p.trim(), vars))
    : BIRTHDAY_TEMPLATE.paragraphs.map((p) => resolveTemplate(p, vars));

  // Their own promise, in their own words, closes the letter.
  const promise = input.promise?.trim();
  if (promise) paragraphs.push(`And I still think about this: “${promise}”`);

  return {
    ...BIRTHDAY_TEMPLATE,
    greeting: resolveTemplate(BIRTHDAY_TEMPLATE.greeting, vars),
    paragraphs,
    quote: resolveTemplate(BIRTHDAY_TEMPLATE.quote, vars),
  };
}

// ─── Memories chapter content ─────────────────────────────────────────────────

export const MEMORIES_INTRO = {
  eyebrow: 'One more thing',
  title: 'Before we go further…',
  subtitle: "let's remember our journey ❤️",
  body: 'Everything we keep here starts as an ordinary day. Here are the ones we decided to hold on to.',
  cta: 'Show me',
  galleryTitle: 'Our journey so far',
  gallerySubtitle: 'And there is so much room left for more.',
  emptyTitle: 'This part is still blank',
  emptyBody: 'Not a single memory saved yet — which means the best ones are still ahead of us.',
  finalCta: 'Enter Our World ❤️',
} as const;
