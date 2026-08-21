import { supabase, isPlaceholder } from './supabase';
import type { Quiz, QuizAnswer } from '@/types';

export interface CreateQuizInput {
  coupleId: string;
  creatorId: string;
  title: string;
  description?: string;
  questions: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
  }[];
}

export async function fetchQuizzes(coupleId: string): Promise<Quiz[]> {
  if (isPlaceholder) {
    return getDemoQuizzes(coupleId);
  }
  try {
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (quizError) {
      console.error('[QuizzesService] Fetch quizzes error:', quizError.message);
      throw new Error(quizError.message);
    }

    if (!quizData) return [];

    return quizData as Quiz[];
  } catch (err) {
    console.error('[QuizzesService] Exception in fetchQuizzes:', err);
    throw err;
  }
}

export async function createQuiz(input: CreateQuizInput): Promise<Quiz> {
  const { coupleId, creatorId, title, description, questions } = input;

  if (isPlaceholder) {
    const localId = crypto.randomUUID();
    return {
      id: localId,
      couple_id: coupleId,
      creator_id: creatorId,
      title,
      description: description || null,
      questions: questions.map((q, i) => ({
        id: `${localId}-q${i}`,
        quiz_id: localId,
        question_text: q.questionText,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
      })),
      created_at: new Date().toISOString(),
    };
  }

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      couple_id: coupleId,
      creator_id: creatorId,
      title,
      description: description || null,
    })
    .select()
    .single();

  if (quizError || !quiz) {
    console.error('[QuizzesService] Quiz insert error:', quizError?.message);
    throw new Error(quizError?.message || 'Failed to create quiz');
  }

  // Insert questions
  const questionRows = questions.map((q) => ({
    quiz_id: quiz.id,
    question_text: q.questionText,
    options: q.options,
    correct_option_index: q.correctOptionIndex,
  }));

  const { data: createdQuestions, error: questionsError } = await supabase
    .from('quiz_questions')
    .insert(questionRows)
    .select();

  if (questionsError) {
    console.error('[QuizzesService] Quiz questions insert error:', questionsError.message);
  }

  return {
    ...quiz,
    questions: createdQuestions || [],
  };
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  if (isPlaceholder) return true;

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    console.error('[QuizzesService] Delete quiz error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function recordQuizAnswer(
  quizId: string,
  questionId: string,
  userId: string,
  selectedOption: number,
  isCorrect: boolean
): Promise<QuizAnswer | null> {
  if (isPlaceholder) {
    return {
      id: crypto.randomUUID(),
      quiz_id: quizId,
      question_id: questionId,
      user_id: userId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    };
  }

  try {
    const { data, error } = await supabase
      .from('quiz_answers')
      .insert({
        quiz_id: quizId,
        question_id: questionId,
        user_id: userId,
        selected_option: selectedOption,
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (error) {
      console.warn('[QuizzesService] Record answer note:', error.message);
      return null;
    }

    return data as QuizAnswer;
  } catch (err) {
    console.error('[QuizzesService] Error recording answer:', err);
    return null;
  }
}

function getDemoQuizzes(coupleId: string): Quiz[] {
  return [
    {
      id: 'demo-quiz-1',
      couple_id: coupleId,
      creator_id: 'demo-user',
      title: 'Our First Date Trivia! 💕',
      description: 'How well do you remember the details of our very first meeting?',
      created_at: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          quiz_id: 'demo-quiz-1',
          question_text: 'Where did we meet for our first coffee date?',
          options: ['Little Flower Cafe', 'Starbucks Downtown', 'Beachside Bakery', 'Library Bistro'],
          correct_option_index: 0,
        },
      ],
    },
  ];
}
