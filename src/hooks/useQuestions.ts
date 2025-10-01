import { useState, useEffect, useCallback } from 'react';
import { questionsApi, apiUtils } from '@/lib/api-client';
import { Question, CreateQuestionCommand, UpdateQuestionCommand } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

// Hook for managing questions list for a game
export const useQuestions = (gameId: string | null) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {getAccessToken, loading: authLoading} = useAuth();

  const fetchQuestions = useCallback(async (gameId: string | null) => {
    if (!gameId) return null;
    if (authLoading) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await questionsApi.getQuestions(token!, gameId);
      if (response.success && response.data) {
        setQuestions(response.data);
        return response.data;
      }
    } catch (err) {
      let errMessage = apiUtils.handleApiError(err);
      setError(errMessage);

    } finally {
      setLoading(false);
    }

    return null;
  }, [gameId, authLoading]);

  useEffect(() => {
    fetchQuestions(gameId);
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions,
  };
};

// Hook for managing a single question
export const useQuestion = (gameId: string | null, questionId: string | null) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    if (!gameId || !questionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionsApi.getQuestion(gameId, questionId);
      if (response.success && response.data) {
        setQuestion(response.data);
      }
    } catch (err) {
      setError(apiUtils.handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [gameId, questionId]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  return {
    question,
    loading,
    error,
    refetch: fetchQuestion,
  };
};

// Hook for question mutations
export const useQuestionMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {getAccessToken, loading: authLoading} = useAuth();

  const createQuestion = useCallback(async (gameId: string, command: CreateQuestionCommand) => {
    if (!authLoading) {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const response = await questionsApi.createQuestion(token!, gameId, command);
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to create question');
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    } 

    return null;
    
  }, [authLoading]);

  const updateQuestion = useCallback(async (gameId: string, questionId: string, command: UpdateQuestionCommand) => {
    if (!authLoading) {
      setLoading(true);
      setError(null);
      
      try {
        const token = await getAccessToken();
        const response = await questionsApi.updateQuestion(token!, gameId, questionId, command);
        if (response.success) {
          return true;
        }
        throw new Error('Failed to update question');
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    return false;

  }, [authLoading]);

  const deleteQuestion = useCallback(async (gameId: string, questionId: string) => {
    if (!authLoading) {
      setLoading(true);
      setError(null);
      
      try {
        const token = await getAccessToken();
        const response = await questionsApi.deleteQuestion(token!, gameId, questionId);
        if (response.success) {
          return true;
        }
        throw new Error('Failed to delete question');
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    return false;
  }, [authLoading]);

  return {
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
};
