import { useAuth } from "@/context/AuthContext";
import { analyzeApi, apiUtils } from "@/lib/api-client";
import { GameAnalyze } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

export const useAnalyze = () => {
  const { getAccessToken, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameAnalyze, setGameAnalyze] = useState<GameAnalyze>();

  const fetchGameAnalyze = useCallback(async () => {
    if (!authLoading) {
      setLoading(true);
      setError(null);

      try {
        let token = await getAccessToken();
        let response = await analyzeApi.getGameAnalyze(token!);

        setGameAnalyze(response.data);
      } catch (err) {
        setError(apiUtils.handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [authLoading]);

  useEffect(() => {
    fetchGameAnalyze();
  }, [fetchGameAnalyze]);

  return {
    gameAnalyze,
    fetchGameAnalyze,
    loading,
    error
  };
};
