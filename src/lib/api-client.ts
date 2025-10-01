import {
  Game,
  Question,
  Answer,
  CreateGameCommand,
  UpdateGameCommand,
  UpdateGameStateCommand,
  CreateQuestionCommand,
  UpdateQuestionCommand,
  CreateAnswerCommand,
  UpdateAnswerCommand,
  DeleteAnswersCommand,
  GamesQueryParams,
  ApiResponse,
  PaginatedResponse,
  GameState,
  QuestionType,
  GameAnalyze
} from '@/types/api';

// Base API configuration
// Use NEXT_PUBLIC_API_BASE_URL when provided; otherwise default to relative paths so dev preview can use the same origin.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Default headers
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  dataResponseJson: boolean = true
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: defaultHeaders,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    let data = null;
    if (dataResponseJson) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    } 

    return {
      data,
      success: true,
    };
  } catch (error: any) {
    // Network errors (e.g., failed to fetch) are TypeError instances in browsers
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error?.message || String(error) || 'An unexpected error occurred';
    console.error('[apiRequest] Network or API error:', url, message, error);

    // If it's a common fetch network failure, provide a clearer message
    if (message === 'Failed to fetch' || message.includes('NetworkError') || error?.name === 'TypeError') {
      throw new ApiError(`Network error when requesting ${url}: ${message}`, 0, error);
    }

    throw new ApiError(message, 0, error);
  }
}

// Custom Error class
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Analyze API
export const analyzeApi = {
  // GET /api/games/analyze
  async getGameAnalyze(token: string): Promise<ApiResponse<GameAnalyze>> {
    return apiRequest<GameAnalyze>(`/api/games/Analyze`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
}

// Games API
export const gamesApi = {
  // GET /api/Games
  async getGames(token: string, params?: GamesQueryParams): Promise<ApiResponse<Game[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.skip !== undefined) searchParams.set('skip', params.skip.toString());
    if (params?.take !== undefined) searchParams.set('take', params.take.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.state !== undefined) searchParams.set('state', params.state.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortDirection !== undefined) searchParams.set('sortDirection', params.sortDirection.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/Games${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<Game[]>(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
  },

  // POST /api/Games
  async createGame(token: string, command: CreateGameCommand): Promise<ApiResponse<string>> {
    return apiRequest<string>('/api/Games', {
      method: 'POST',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }, false);
  },

  // GET /api/Games/{id}
  async getGame(id: string, token: string): Promise<ApiResponse<Game>> {
    return apiRequest<Game>(`/api/Games/${encodeURIComponent(id)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // PATCH /api/Games/{id}
  async updateGame(token: string, id: string, command: UpdateGameCommand): Promise<ApiResponse<Game>> {
    return apiRequest<Game>(`/api/Games/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
  },

  // DELETE /api/Games/{id}
  async deleteGame(token: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/api/Games/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // PATCH /api/Games/{id}/state
  async updateGameState(token: string, id: string, command: UpdateGameStateCommand): Promise<ApiResponse<Game>> {
    return apiRequest<Game>(`/api/Games/${encodeURIComponent(id)}/state`, {
      method: 'PATCH',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
  },
};

// Questions API
export const questionsApi = {
  // GET /api/games/{gameId}/Questions
  async getQuestions(token:string, gameId: string): Promise<ApiResponse<Question[]>> {
    return apiRequest<Question[]>(`/api/games/${encodeURIComponent(gameId)}/Questions`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });
  },

  // POST /api/games/{gameId}/Questions
  async createQuestion(token: string, gameId: string, command: CreateQuestionCommand): Promise<ApiResponse<string>> {
    return apiRequest<string>(`/api/games/${encodeURIComponent(gameId)}/Questions`, {
      method: 'POST',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }, false);
  },

  // GET /api/games/{gameId}/Questions/{id}
  async getQuestion(gameId: string, id: string): Promise<ApiResponse<Question>> {
    return apiRequest<Question>(`/api/games/${encodeURIComponent(gameId)}/Questions/${encodeURIComponent(id)}`);
  },

  // PATCH /api/games/{gameId}/Questions/{id}
  async updateQuestion(token:string, gameId: string, id: string, command: UpdateQuestionCommand): Promise<ApiResponse<Question>> {
    return apiRequest<Question>(`/api/games/${encodeURIComponent(gameId)}/Questions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
  },

  // DELETE /api/games/{gameId}/Questions/{id}
  async deleteQuestion(token: string, gameId: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/api/games/${encodeURIComponent(gameId)}/Questions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });
  },
};

// Answers API
export const answersApi = {
  // GET /api/games/{gameId}/questions/{questionId}/Answers
  async getAnswers(token: string, gameId: string, questionId: string): Promise<ApiResponse<Answer[]>> {
    return apiRequest<Answer[]>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });
  },

  // GET /api/games/{gameId}/questions/{questionId}/Answers/{Id}
  async getAnswer(gameId: string, questionId: string, id: string): Promise<ApiResponse<Answer>> {
    return apiRequest<Answer>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers/${encodeURIComponent(id)}`);
  },

  // POST /api/games/{gameId}/questions/{questionId}/Answers/create
  async createAnswers(token: string, gameId: string, questionId: string, command: CreateAnswerCommand): Promise<ApiResponse<string>> {
    return apiRequest<string>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers/create`, {
      method: 'POST',
      body: JSON.stringify(command),
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }, false);
  },

  // PATCH /api/games/{gameId}/questions/{questionId}/Answers
  async updateAnswers(gameId: string, questionId: string, command: UpdateAnswerCommand): Promise<ApiResponse<Answer[]>> {
    return apiRequest<Answer[]>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers`, {
      method: 'PATCH',
      body: JSON.stringify(command),
    });
  },

  // POST /api/games/{gameId}/questions/{questionId}/Answers/delete
  async deleteAnswers(gameId: string, questionId: string, command: DeleteAnswersCommand): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers/delete`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  },

  // DELETE /api/games/{gameId}/questions/{questionId}/Answers/{id}
  async deleteAnswer(token: string, gameId: string, questionId: string, id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/api/games/${encodeURIComponent(gameId)}/questions/${encodeURIComponent(questionId)}/Answers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });
  },
};

// Utility functions for common operations
export const apiUtils = {
  // Helper to build query strings
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value.toString());
      }
    });
    
    return searchParams.toString();
  },

  // Helper to handle API errors
  handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  },

  // Helper to get user context (you might want to implement this based on your auth system)
  getUserContext(): { userNTID: string } {
    // This is a placeholder - implement based on your authentication system
    return {
      userNTID: 'current-user-id' // Replace with actual user ID from auth context
    };
  },
};

// Export the ApiError class for use in components
export { ApiError };

// SignalR client
// Lightweight wrapper to interact with GameHub endpoints
import * as signalR from '@microsoft/signalr';

export type SignalRClient = {
  connection: signalR.HubConnection;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  // server invocations
  createGameRoom: (gameId: string, autoShowResults?: boolean) => Promise<void>;
  joinGame: (roomCode: string, userName: string, playerId?: string | null) => Promise<void>;
  startGame: (roomCode: string) => Promise<void>;
  submitAnswer: (answerId: string) => Promise<void>;
  proceedToNextQuestion: (roomCode: string) => Promise<void>;
  showFinalLeaderboard: (roomCode: string) => Promise<void>;
};

export function createSignalRClient(baseUrl: string = API_BASE_URL): SignalRClient {
  const url = `${baseUrl}/gameHub`;

  const build = (transport: signalR.HttpTransportType, skipNegotiation = false) =>
    new signalR.HubConnectionBuilder()
      .withUrl(url, {
        transport,
        skipNegotiation,
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Debug)
      .build();

  // Prefer LongPolling for broad compatibility (proxied/dev envs). We'll upgrade to WS if desired later.
  let connection = build(signalR.HttpTransportType.LongPolling);
  let usingFallback = false; // fallback flag if we ever attempt WS

  const start = async () => {
    // Only start when disconnected
    if (connection.state !== signalR.HubConnectionState.Disconnected) return;
    try {
      await connection.start().then(() => console.log("Connected to hub"));
    } catch (err) {
      // If LP somehow fails (rare), try WebSockets without negotiation
      if (!usingFallback) {
        usingFallback = true;
        connection = build(signalR.HttpTransportType.WebSockets, true);
        await connection.start();
      } else {
        console.error("Failed to connect to hub", err);
        throw err;
      }
    }
  };

  const stop = () => connection.stop();

  const invoke = (method: string, ...args: any[]) => connection.invoke(method, ...args);

  return {
    get connection() { return connection; },
    start,
    stop,
    createGameRoom: async (gameId, autoShowResults = true) => {
      try {
        // Debug logging for diagnostics
        // eslint-disable-next-line no-console
        console.debug('[SignalR] -> CreateGameRoom', { gameId, autoShowResults });
        const res = await invoke('CreateGameRoom', gameId, autoShowResults);
        // eslint-disable-next-line no-console
        console.debug('[SignalR] <- CreateGameRoom ok', res);
        return res;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[SignalR] !! CreateGameRoom failed', err);
        throw err;
      }
    },
    joinGame: (roomCode, userName, playerId) => invoke('JoinGame', roomCode, userName, playerId ?? null),
    startGame: (roomCode) => invoke('StartGame', roomCode),
    submitAnswer: (answerId) => invoke('SubmitAnswer', answerId),
    proceedToNextQuestion: (roomCode) => invoke('ProceedToNextQuestion', roomCode),
    showFinalLeaderboard: (roomCode) => invoke('ShowFinalLeaderboard', roomCode),
  } as SignalRClient;
}
