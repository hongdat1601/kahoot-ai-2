import { useState, useEffect, useCallback } from 'react';
import { answersApi, apiUtils } from '@/lib/api-client';
import { Answer, CreateAnswerCommand, UpdateAnswerCommand, DeleteAnswersCommand } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

// Hook for managing answers list for a question
export const useAnswers = (gameId: string | null, questionId: string | null) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {loading: authLoading, getAccessToken} = useAuth();

  const fetchAnswers = useCallback(async (gameId: string | null, questionId: string | null) => {
    if (!gameId || !questionId) return null;
    if (authLoading) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await answersApi.getAnswers(token!, gameId, questionId);
      if (response.success && response.data) {
        setAnswers(response.data);
        return response.data;
      }
    } catch (err) {
      setError(apiUtils.handleApiError(err));
    } finally {
      setLoading(false);
    }

    return null;
  }, [gameId, questionId, authLoading]);

  useEffect(() => {
    fetchAnswers(gameId, questionId);
  }, [fetchAnswers]);

  return {
    answers,
    loading,
    error,
    refetch: fetchAnswers,
  };
};

// Hook for managing a single answer
export const useAnswer = (gameId: string | null, questionId: string | null, answerId: string | null) => {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswer = useCallback(async () => {
    if (!gameId || !questionId || !answerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await answersApi.getAnswer(gameId, questionId, answerId);
      if (response.success && response.data) {
        setAnswer(response.data);
      }
    } catch (err) {
      setError(apiUtils.handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [gameId, questionId, answerId]);

  useEffect(() => {
    fetchAnswer();
  }, [fetchAnswer]);

  return {
    answer,
    loading,
    error,
    refetch: fetchAnswer,
  };
};

// Hook for answer mutations
export const useAnswerMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {getAccessToken, loading: authLoading} = useAuth();

  const createAnswers = useCallback(async (gameId: string, questionId: string, command: CreateAnswerCommand) => {
    if (!authLoading) {
      setLoading(true);
      setError(null);
      
      try {
        const token = await getAccessToken();
        const response = await answersApi.createAnswers(token!, gameId, questionId, command);
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to create answers');
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    }
    
    return null;
  }, [authLoading]);

  const updateAnswers = useCallback(async (gameId: string, questionId: string, command: UpdateAnswerCommand) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await answersApi.updateAnswers(gameId, questionId, command);
      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to update answers');
    } catch (err) {
      const errorMessage = apiUtils.handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnswers = useCallback(async (gameId: string, questionId: string, command: DeleteAnswersCommand) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await answersApi.deleteAnswers(gameId, questionId, command);
      if (response.success) {
        return true;
      }
      throw new Error('Failed to delete answers');
    } catch (err) {
      const errorMessage = apiUtils.handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnswer = useCallback(async (gameId: string, questionId: string, answerId: string) => {
    if (authLoading) return false;

    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const response = await answersApi.deleteAnswer(token!, gameId, questionId, answerId);
      if (response.success) {
        return true;
      }
      throw new Error('Failed to delete answer');
    } catch (err) {
      const errorMessage = apiUtils.handleApiError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  return {
    loading,
    error,
    createAnswers,
    updateAnswers,
    deleteAnswers,
    deleteAnswer,
  };
};
