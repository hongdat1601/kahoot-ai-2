import { useState, useEffect, useCallback, useMemo } from "react";
import { gamesApi, apiUtils } from "@/lib/api-client";
import {
  Game,
  CreateGameCommand,
  UpdateGameCommand,
  UpdateGameStateCommand,
  GamesQueryParams,
  SortDirection,
} from "@/types/api";
import { useAuth } from "@/context/AuthContext";

// Hook for managing games list
export const useGames = () => {
  const { getAccessToken, loading: authLoading } = useAuth();
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const fetchRecentGames = useCallback(async () => {
    if (!authLoading) {
      setLoading(true);
      setError(null);

      try {
        let token = await getAccessToken();
        const response = await gamesApi.getGames(token!, {
          sortBy: "updatedOn",
          take: 3,
          sortDirection: SortDirection.Descending,
        });
        setRecentGames(response.data ?? []);
      } catch (err) {
        setError(apiUtils.handleApiError(err));
      } finally {
        setLoading(false);
      }
    }
  }, [authLoading]);

  const fetchGames = useCallback(
    async (gameParams?: GamesQueryParams) => {
      if (!authLoading) {
        setLoading(true);
        setError(null);

        try {
          let token = await getAccessToken();
          const response = await gamesApi.getGames(token!, gameParams);

          setGames(response.data ?? []);
        } catch (err) {
          setError(apiUtils.handleApiError(err));
        } finally {
          setLoading(false);
        }
      }
    },
    [authLoading]
  );

  useEffect(() => {
    fetchRecentGames();
  }, [fetchRecentGames]);

  return {
    games,
    recentGames,
    loading,
    error,
    pagination,
    refetch: fetchGames,
    refetchAll: async () => {
      await fetchRecentGames();
      await fetchGames();
    },
  };
};

// Hook for managing a single game
export const useGame = (id: string | null) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getAccessToken, loading: authLoading } = useAuth();

  const fetchGame = useCallback(async (id: string | null) => {
    if (!id) return;
    if (authLoading) return;

    setLoading(true);
    setError(null);

    try {
        const token = await getAccessToken();
        const response = await gamesApi.getGame(id, token!);
        if (response.success && response.data) {
          setGame(response.data);
          return response.data
        }

    } catch (err) {
      setError(apiUtils.handleApiError(err));
    } finally {
      setLoading(false);
    }

    return null;
  }, [id, authLoading]);

  useEffect(() => {
    fetchGame(id);
  }, [fetchGame]);

  return {
    game,
    loading,
    error,
    refetch: fetchGame,
  };
};

// Hook for game mutations
export const useGameMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken, loading: authLoading } = useAuth();

  const createGame = useCallback(async (command: CreateGameCommand) => {
    if (!authLoading) {
      setLoading(true);
      setError(null);

      try {
        if (!authLoading) {
          let token = await getAccessToken();
          const response = await gamesApi.createGame(token!, command);
          if (response.success) {
            return response.data;
          }

          throw new Error("Failed to create game");
        }

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

  const updateGame = useCallback(
    async (id: string, command: UpdateGameCommand) => {
      if (authLoading) return false;

      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const response = await gamesApi.updateGame(token!, id, command);
        if (response.success) {
          return true;
        }
        throw new Error("Failed to update game");
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [authLoading]
  );

  const updateGameState = useCallback(
    async (id: string, command: UpdateGameStateCommand) => {
      if (authLoading) return false;
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const response = await gamesApi.updateGameState(token!, id, command);
        if (response.success) {
          return true;
        }
        throw new Error("Failed to update game state");
      } catch (err) {
        const errorMessage = apiUtils.handleApiError(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [authLoading]
  );

  const deleteGame = useCallback(
    async (id: string) => {
      if (!authLoading) {
        setLoading(true);
        setError(null);

        try {
          if (!authLoading) {
            let token = await getAccessToken();
            const response = await gamesApi.deleteGame(token!, id);
            if (response.success) {
              return;
            }

            throw new Error("Failed to delete game");
          }

        } catch (err) {
          const errorMessage = apiUtils.handleApiError(err);
          setError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      }
    },
    [authLoading]
  );

  return {
    loading,
    error,
    createGame,
    updateGame,
    updateGameState,
    deleteGame,
  };
};
