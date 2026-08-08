import { supabase } from './supabase';
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
  try {
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (quizError || !quizData) {
      console.warn('[QuizzesService] Fetch note:', quizError?.message);
      return getDemoQuizzes(coupleId);
    }

    return (quizData as Quiz[]).length > 0 ? (quizData as Quiz[]) : getDemoQuizzes(coupleId);
  } catch (err) {
    console.error('[QuizzesService] Exception:', err);
    return getDemoQuizzes(coupleId);
  }
}

export async function createQuiz(input: CreateQuizInput): Promise<Quiz | null> {
  const { coupleId, creatorId, title, description, questions } = input;

  try {
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
      console.warn('[QuizzesService] Quiz insert note:', quizError?.message);
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

    // Insert questions
    const questionRows = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.questionText,
      options: q.options,
      correct_option_index: q.correctOptionIndex,
    }));

    const { data: createdQuestions } = await supabase
      .from('quiz_questions')
      .insert(questionRows)
      .select();

    return {
      ...quiz,
      questions: createdQuestions || [],
    };
  } catch (err) {
    console.error('[QuizzesService] Error creating quiz:', err);
    return null;
  }
}

export async function recordQuizAnswer(
  quizId: string,
  questionId: string,
  userId: string,
  selectedOption: number,
  isCorrect: boolean
): Promise<QuizAnswer | null> {
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
        {
          id: 'q-2',
          quiz_id: 'demo-quiz-1',
          question_text: 'What flavor of tea/coffee did I order?',
          options: ['Cinnamon Chai', 'Iced Vanilla Latte', 'Matcha Espresso', 'Hot Chocolate'],
          correct_option_index: 1,
        },
        {
          id: 'q-3',
          quiz_id: 'demo-quiz-1',
          question_text: 'Who said "I love you" first?',
          options: ['Me! 🙋‍♀️', 'You! 🙋‍♂️', 'We said it together! ❤️', 'It was a mystery!'],
          correct_option_index: 0,
        },
      ],
    },
  ];
}
