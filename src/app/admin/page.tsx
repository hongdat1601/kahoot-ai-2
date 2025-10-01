"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { DashboardSidebar } from "@/components/admin/DashboardSidebar";
import GameItem from "@/components/ui/GameItem";
import {
  Users,
  SquarePlus,
  Gamepad2,
  BarChart3,
  X,
  Grid3X3,
  List,
  Filter,
  ArrowUpDown,
  User as UserIcon,
  Mail,
  Hash,
  ChevronDown,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";
import { useAuth } from "@/context/AuthContext";
import { GameState, QuestionType, SortDirection } from "@/types/api";
import { GameSortBy } from "@/types/game";
import { useGameMutations, useGames } from "@/hooks/useGames";
import { useAnalyze } from "@/hooks/useAnalyze";
import { useQuestionMutations } from "@/hooks/useQuestions";
import { useAnswerMutations } from "@/hooks/useAnswers";

export interface SortItem {
  id: string;
  label: string;
  sortBy: GameSortBy;
  direction: SortDirection;
}

export interface FilterItem {
  id: GameState;
  lable: string;
}

interface AiAnswerPlan {
  text: string;
  isCorrect: boolean;
}

interface AiQuestionPlan {
  title: string;
  type: QuestionType;
  answers: AiAnswerPlan[];
}

interface AiGamePlan {
  title: string;
  description: string;
  questions: AiQuestionPlan[];
}

interface AiChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
  gamePlan?: AiGamePlan;
}

const questionTypeDisplayMap: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: "Single Choice",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.TrueFalse]: "True/False",
};

const createChatMessageId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const toTitleCase = (text: string) =>
  text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const extractThemeFromPrompt = (prompt: string) => {
  const cleaned = prompt.replace(/[.!?]/g, " ").trim();
  if (!cleaned) {
    return "General Knowledge";
  }

  const keywords = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");

  return toTitleCase(keywords);
};

const buildAiGameResponse = (prompt: string): { message: string; plan: AiGamePlan } => {
  const theme = extractThemeFromPrompt(prompt);
  const title = `${theme} Challenge`;
  const description = `An interactive quiz that helps players explore key ideas about ${theme.toLowerCase()}.`;

  const singleChoiceAnswers: AiAnswerPlan[] = [
    {
      text: `Core fact about ${theme.toLowerCase()}`,
      isCorrect: true,
    },
    {
      text: `Common misconception about ${theme.toLowerCase()}`,
      isCorrect: false,
    },
    {
      text: `Advanced detail loosely related to ${theme.toLowerCase()}`,
      isCorrect: false,
    },
    {
      text: `Introductory concept in ${theme.toLowerCase()}`,
      isCorrect: false,
    },
  ];

  const multipleChoiceAnswers: AiAnswerPlan[] = [
    {
      text: `Fundamental principle of ${theme.toLowerCase()}`,
      isCorrect: true,
    },
    {
      text: `Supporting detail for ${theme.toLowerCase()}`,
      isCorrect: true,
    },
    {
      text: `Detail that doesn't apply to ${theme.toLowerCase()}`,
      isCorrect: false,
    },
    {
      text: "Unrelated fact for contrast",
      isCorrect: false,
    },
  ];

  const trueFalseAnswers: AiAnswerPlan[] = [
    {
      text: `${theme} always follows the same pattern`,
      isCorrect: false,
    },
    {
      text: `${theme} can vary based on context`,
      isCorrect: true,
    },
  ];

  const questions: AiQuestionPlan[] = [
    {
      title: `What best describes ${theme.toLowerCase()}?`,
      type: QuestionType.SingleChoice,
      answers: singleChoiceAnswers,
    },
    {
      title: `Select the statements that are true about ${theme.toLowerCase()}.`,
      type: QuestionType.MultipleChoice,
      answers: multipleChoiceAnswers,
    },
    {
      title: `True or False: ${theme} is always interpreted the same way by everyone.`,
      type: QuestionType.TrueFalse,
      answers: trueFalseAnswers,
    },
  ];

  return {
    message: "Here is the game created based on the request:",
    plan: {
      title,
      description,
      questions,
    },
  };
};

const sortOptions: SortItem[] = [
  {
    id: "created_desc",
    label: "Created: Newest First",
    sortBy: "createdOn",
    direction: SortDirection.Descending,
  },
  {
    id: "created_asc",
    label: "Created: Oldest First",
    sortBy: "createdOn",
    direction: SortDirection.Ascending,
  },
  {
    id: "modified_desc",
    label: "Modified: Newest First",
    sortBy: "updatedOn",
    direction: SortDirection.Descending,
  },
  {
    id: "modified_asc",
    label: "Modified: Oldest First",
    sortBy: "updatedOn",
    direction: SortDirection.Ascending,
  },
  {
    id: "title_asc",
    label: "Title: A → Z",
    sortBy: "title",
    direction: SortDirection.Ascending,
  },
  {
    id: "title_desc",
    label: "Title: Z → A",
    sortBy: "title",
    direction: SortDirection.Descending,
  },
];

const sortTable: Record<string, SortItem> = {
  created_desc: {
    id: "created_desc",
    label: "Created: Newest First",
    sortBy: "createdOn",
    direction: SortDirection.Descending,
  },
  created_asc: {
    id: "created_asc",
    label: "Created: Oldest First",
    sortBy: "createdOn",
    direction: SortDirection.Ascending,
  },
  modified_desc: {
    id: "modified_desc",
    label: "Modified: Newest First",
    sortBy: "updatedOn",
    direction: SortDirection.Descending,
  },
  modified_asc: {
    id: "modified_asc",
    label: "Modified: Oldest First",
    sortBy: "updatedOn",
    direction: SortDirection.Ascending,
  },
  title_asc: {
    id: "title_asc",
    label: "Title: A → Z",
    sortBy: "title",
    direction: SortDirection.Ascending,
  },
  title_desc: {
    id: "title_desc",
    label: "Title: Z → A",
    sortBy: "title",
    direction: SortDirection.Descending,
  },
};

const filterOptions: FilterItem[] = [
  {
    id: GameState.Active,
    lable: "Active",
  },
  {
    id: GameState.InActive,
    lable: "In-Active",
  },
  {
    id: GameState.Draft,
    lable: "Draft",
  },
  {
    id: GameState.InLobby,
    lable: "In-Lobby",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentQuestionPage, setCurrentQuestionPage] = useState(1);
  const [questionViewMode, setQuestionViewMode] = useState<"card" | "list">(
    "card"
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiInputValue, setAiInputValue] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isCreatingFromAi, setIsCreatingFromAi] = useState(false);
  const aiResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [questionFilter, setQuestionFilter] = useState<number[]>([
    GameState.Active,
    GameState.Draft,
    GameState.InActive,
    GameState.InLobby,
  ]);

  const [questionSort, setQuestionSort] = useState<string>("created_desc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const questionsPerPage = 6;

  const { games, recentGames, refetch, refetchAll } = useGames();
  const {account, loading: authLoading} = useAuth();
  const {deleteGame, createGame} = useGameMutations();
  const {createQuestion} = useQuestionMutations();
  const {createAnswers} = useAnswerMutations();
  const {gameAnalyze} = useAnalyze();
  const {  updateGameState } = useGameMutations();

  useEffect(() => {
    if (!authLoading) {
      refetch({
        sortBy: sortTable[questionSort]?.sortBy!,
        sortDirection: sortTable[questionSort]?.direction!,
      });
    }
  }, [questionSort, questionFilter, authLoading]);

  useEffect(() => {
    return () => {
      if (aiResponseTimerRef.current) {
        clearTimeout(aiResponseTimerRef.current);
      }
    };
  }, []);

  // Filter and sort logic
  const sortedQuestions = useMemo(() => {
    return games.filter((game) => questionFilter.includes(game.state));
  }, [games, questionFilter]);

  const totalQuestionPages = useMemo(() => {
    return Math.ceil(sortedQuestions.length / questionsPerPage);
  }, [sortedQuestions]);

  const currentQuestions = useMemo(() => {
    return sortedQuestions.slice(
      (currentQuestionPage - 1) * questionsPerPage,
      currentQuestionPage * questionsPerPage
    );
  }, [sortedQuestions, currentQuestionPage]);

  const latestAiGamePlan = useMemo(() => {
    for (let index = aiMessages.length - 1; index >= 0; index -= 1) {
      const message = aiMessages[index];
      if (message.role === "ai" && message.gamePlan) {
        return message.gamePlan;
      }
    }
    return null;
  }, [aiMessages]);

  const handleFilterChange = (status: number) => {
    setQuestionFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setCurrentQuestionPage(1); // Reset to first page when filter changes
  };

  const handleEditQuestion = (questionId: string) => {
    handleEditQuestionNavigation(questionId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    let isDelete = window.confirm("Are you sure to delete this game?");

    if (isDelete) {
      try {
        await deleteGame(questionId);
        await refetchAll();

      } catch (err) {
        console.error(err);
        window.alert("Something went wrong!");
      }
    }
  };

  const handleCloseQuestion = async (gameId: string, gameState: GameState) => {
    try {
      let isSuccess = await updateGameState(gameId, {currentState: gameState, targetState: GameState.InActive});
      if (!isSuccess) throw Error("Cannot update game state");

      await refetchAll();
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const handleReactiveQuestion = async (gameId: string, gameState: GameState) => {
    try {
      let isSuccess = await updateGameState(gameId, {currentState: gameState, targetState: GameState.Active});
      if (!isSuccess) throw Error("Cannot update game state");

      await refetchAll();
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const handleToggleQuestionStatus = (questionId: string) => {
    console.log(`Toggling status for question ${questionId}`);
  };

  const handleCreateQuestion = async () => {
    try {
      let gameId = await createGame({
        title: "Untitled Game",
        description: "" 
      });

      if (gameId === null || gameId === undefined) throw new Error("Game Id is null!");

      let questionId = await createQuestion(gameId, {
        gameId: gameId,
        timeLimitSeconds: 30,
        title: "Question 1",
        type: 0
      });

      if (questionId === null || questionId === undefined) throw new Error("Question Id is null!");

      let answerIds = await createAnswers(gameId, questionId, {
        gameId: gameId,
        questionId: questionId,
        questionType: 0,
        answers: [
          {
            gameId: gameId,
            questionId: questionId,
            title: "Answer 1",
            isCorrect: true
          },
          {
            gameId: gameId,
            questionId: questionId,
            title: "Answer 2",
            isCorrect: false
          }
        ]
      })

    if (answerIds === null || answerIds === undefined) throw new Error("Answer Ids is null!");

    // Use window.location for more reliable navigation
    window.location.href = `/admin/game/new?tempId=${gameId}`;

    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const handleEditQuestionNavigation = (questionId: string) => {
    // Use window.location for more reliable navigation
    window.location.href = `/admin/game/${questionId}`;
  };

  const handleQuestionCardClick = (questionId: string) => {
    // Use window.location for more reliable navigation
    window.location.href = `/admin/game/${questionId}`;
  };

  const handleCloseAiModal = () => {
    if (aiResponseTimerRef.current) {
      clearTimeout(aiResponseTimerRef.current);
      aiResponseTimerRef.current = null;
    }
    setIsAiResponding(false);
    setShowAiModal(false);
  };

  const handleAiMessageSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = aiInputValue.trim();

    if (!trimmedMessage || isAiResponding) {
      return;
    }

    const userMessage: AiChatMessage = {
      id: createChatMessageId(),
      role: "user",
      content: trimmedMessage,
      createdAt: Date.now(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiInputValue("");
    setIsAiResponding(true);

    aiResponseTimerRef.current = setTimeout(() => {
      const response = buildAiGameResponse(trimmedMessage);
      const aiMessage: AiChatMessage = {
        id: createChatMessageId(),
        role: "ai",
        content: response.message,
        createdAt: Date.now(),
        gamePlan: response.plan,
      };

      setAiMessages((prev) => [...prev, aiMessage]);
      setIsAiResponding(false);
      aiResponseTimerRef.current = null;
    }, 1200);
  };

  const handleCreateAiGameFromPlan = async () => {
    if (!latestAiGamePlan || isCreatingFromAi) {
      return;
    }

    try {
      setIsCreatingFromAi(true);
      const gameId = await createGame({
        title: latestAiGamePlan.title,
        description: latestAiGamePlan.description,
      });

      if (!gameId) {
        throw new Error("Failed to create game");
      }

      for (const questionPlan of latestAiGamePlan.questions) {
        const questionId = await createQuestion(gameId, {
          gameId,
          title: questionPlan.title,
          timeLimitSeconds:
            questionPlan.type === QuestionType.TrueFalse ? 20 : 30,
          type: questionPlan.type,
        });

        if (!questionId) {
          throw new Error("Failed to create question");
        }

        await createAnswers(gameId, questionId, {
          gameId,
          questionId,
          questionType: questionPlan.type,
          answers: questionPlan.answers.map((answer) => ({
            gameId,
            questionId,
            title: answer.text,
            isCorrect: answer.isCorrect,
          })),
        });
      }

      window.location.href = `/admin/game/${gameId}`;
    } catch (error) {
      console.error(error);
      window.alert("Unable to create game from AI suggestions. Please try again.");
    } finally {
      setIsCreatingFromAi(false);
    }
  };

  // Refs for sections
  const dashboardRef = useRef<HTMLElement>(null);
  const questionsRef = useRef<HTMLElement>(null);
  const analyticsRef = useRef<HTMLElement>(null);

  const scrollToSection = (sectionId: string) => {
    const refs = {
      dashboard: dashboardRef,
      questions: questionsRef,
      analytics: analyticsRef,
    };

    const targetRef = refs[sectionId as keyof typeof refs];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    // <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <DashboardHeader
          adminName={account?.name ?? "Admin"}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Main layout với sidebar và content */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <DashboardSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onMenuClick={scrollToSection}
          />

          {/* Main Content */}
          <main
            className={`flex-1 overflow-auto transition-all duration-300 ${
              sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
            }`}
          >
            <div className="max-w-7xl mx-auto p-6 space-y-12">
              {/* Dashboard Section */}
              <section
                ref={dashboardRef}
                id="dashboard"
                className="scroll-mt-6"
              >
                {/* Dashboard stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Total Session Started
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">{gameAnalyze?.gameSessionsStarted}</p>
                    <p className="text-sm text-gray-500">
                      {(gameAnalyze?.gameSessionsStartedChangePercent ?? 0) >= 0 ? '+': '-'}{gameAnalyze?.gameSessionsStartedChangePercent} from last month
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Total Game Created
                    </h3>
                    <p className="text-3xl font-bold text-green-600">{gameAnalyze?.gamesCreated}</p>
                    <p className="text-sm text-gray-500">{(gameAnalyze?.gameSessionsStartedChangePercent ?? 0) >= 0 ? '+': '-'}{gameAnalyze?.gamesCreatedChangePercent} from last month</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Average Players Join
                    </h3>
                    <p className="text-3xl font-bold text-purple-600">{gameAnalyze?.averagePlayersPerSession}</p>
                    <p className="text-sm text-gray-500">per room session</p>
                  </div>
                </div>
              </section>

              {/* Game Section */}
              <section
                ref={questionsRef}
                id="questions"
                className="scroll-mt-6"
              >
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Gamepad2 className="h-6 w-6 text-green-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Game</h2>
                    </div>
                    <button
                      onClick={handleCreateQuestion}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <SquarePlus className="h-4 w-4" />
                      <span>Create Game</span>
                    </button>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Recent Game Subsection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Games
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentGames &&
                          recentGames.map((game) => (
                            <GameItem
                              key={game.id}
                              game={game}
                              view="card"
                              onClick={(id) => handleQuestionCardClick(id)}
                              onEdit={(id) => handleEditQuestion(id)}
                              onToggleStatus={(id) =>
                                game.state === GameState.Active
                                  ? handleCloseQuestion(id, game.state)
                                  : handleReactiveQuestion(id, game.state)
                              }
                              onDelete={(id) => handleDeleteQuestion(id)}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Game Bank Subsection */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Game List
                        </h3>

                        {/* Controls */}
                        <div className="flex items-center space-x-4">
                          {/* Filter Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowFilterDropdown(!showFilterDropdown)
                              }
                              className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <Filter className="h-4 w-4 text-gray-500" />
                              <span>Filter ({questionFilter.length})</span>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>

                            {showFilterDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowFilterDropdown(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[70]">
                                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Status Filter
                                  </div>
                                  {filterOptions.map((filter) => (
                                    <label
                                      key={filter.id}
                                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={questionFilter.includes(
                                          filter.id
                                        )}
                                        onChange={() =>
                                          handleFilterChange(filter.id)
                                        }
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="ml-2 text-sm text-gray-700 capitalize">
                                        {filter.lable}
                                      </span>
                                      <span
                                        className={`ml-auto w-2 h-2 rounded-full ${
                                          filter.id === GameState.Active
                                            ? "bg-green-500"
                                            : filter.id === GameState.Draft
                                            ? "bg-yellow-500"
                                            : filter.id === GameState.InLobby
                                            ? "bg-purple-500"
                                            : "bg-gray-500"
                                        }`}
                                      ></span>
                                    </label>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Sort Dropdown */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowSortDropdown(!showSortDropdown)
                              }
                              className="flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <ArrowUpDown className="h-4 w-4 text-gray-500" />
                              <span>{sortTable[questionSort]?.label}</span>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>

                            {showSortDropdown && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowSortDropdown(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[70]">
                                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Sort Options
                                  </div>
                                  {sortOptions.map((option) => (
                                    <button
                                      key={option.id}
                                      onClick={() => {
                                        setQuestionSort(option.id);
                                        setShowSortDropdown(false);
                                        setCurrentQuestionPage(1);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                        questionSort === option.id
                                          ? "bg-blue-50 text-blue-700 font-medium"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* View Mode Toggle */}
                          <div className="flex border border-gray-300 rounded-md">
                            <button
                              onClick={() => setQuestionViewMode("card")}
                              className={`p-2 transition-colors ${
                                questionViewMode === "card"
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setQuestionViewMode("list")}
                              className={`p-2 transition-colors ${
                                questionViewMode === "list"
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <List className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Questions Display */}
                      {questionViewMode === "card" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {currentQuestions &&
                            currentQuestions.map((question) => (
                              <GameItem
                                key={question.id}
                                game={question}
                                view="card"
                                onClick={(id) => handleQuestionCardClick(id)}
                                onEdit={(id) => handleEditQuestion(id)}
                                onToggleStatus={(id) =>
                                  question.state === GameState.Active
                                    ? handleCloseQuestion(id, question.state)
                                    : handleReactiveQuestion(id, question.state)
                                }
                                onDelete={(id) => handleDeleteQuestion(id)}
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="space-y-2 mb-6">
                          {currentQuestions.map((question) => (
                            <GameItem
                              key={question.id}
                              game={question}
                              view="list"
                              onClick={(id) => handleQuestionCardClick(id)}
                              onEdit={(id) => handleEditQuestion(id)}
                              onToggleStatus={(id) =>
                                question.state === GameState.Active
                                    ? handleCloseQuestion(id, question.state)
                                    : handleReactiveQuestion(id, question.state)
                              }
                              onDelete={(id) => handleDeleteQuestion(id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Pagination for Question Bank */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Showing{" "}
                          {(currentQuestionPage - 1) * questionsPerPage + 1} to{" "}
                          {Math.min(
                            currentQuestionPage * questionsPerPage,
                            sortedQuestions.length
                          )}{" "}
                          of {sortedQuestions.length} questions
                          {sortedQuestions.length !== games.length && (
                            <span className="text-blue-600 ml-1">
                              (filtered from {games.length})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setCurrentQuestionPage((prev) =>
                                Math.max(prev - 1, 1)
                              )
                            }
                            disabled={currentQuestionPage === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Previous
                          </button>

                          <div className="flex space-x-1">
                            {Array.from(
                              { length: totalQuestionPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentQuestionPage(page)}
                                className={`px-3 py-1 text-sm border rounded ${
                                  currentQuestionPage === page
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentQuestionPage((prev) =>
                                Math.min(prev + 1, totalQuestionPages)
                              )
                            }
                            disabled={
                              currentQuestionPage === totalQuestionPages
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Analytics Section */}
              <section
                ref={analyticsRef}
                id="analytics"
                className="scroll-mt-6"
              >
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-3">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Analytics (Comming Soon)
                    </h2>
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Monthly Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Questions Created This Month */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900">
                              Questions Created
                            </h3>
                            <p className="text-sm text-blue-600">This Month</p>
                          </div>
                          <Gamepad2 className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-blue-800 mb-2">
                          156
                        </div>
                        <div className="text-sm text-green-600">
                          +23% from last month
                        </div>
                      </div>

                      {/* Lobbies Created This Month */}
                      <div className="bg-green-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-green-900">
                              Lobbies Created
                            </h3>
                            <p className="text-sm text-green-600">This Month</p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="text-3xl font-bold text-green-800 mb-2">
                          89
                        </div>
                        <div className="text-sm text-green-600">
                          +12% from last month
                        </div>
                      </div>

                      {/* Players Joined This Month */}
                      <div className="bg-purple-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-purple-900">
                              Players Joined
                            </h3>
                            <p className="text-sm text-purple-600">
                              This Month
                            </p>
                          </div>
                          <UserIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="text-3xl font-bold text-purple-800 mb-2">
                          2,847
                        </div>
                        <div className="text-sm text-green-600">
                          +18% from last month
                        </div>
                      </div>
                    </div>

                    {/* Questions Created Chart (Last 6 Months) */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Questions Created (Last 6 Months)
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-end justify-between h-48 space-x-4">
                          {[
                            { month: "Aug", value: 89 },
                            { month: "Sep", value: 124 },
                            { month: "Oct", value: 167 },
                            { month: "Nov", value: 143 },
                            { month: "Dec", value: 189 },
                            { month: "Jan", value: 156 },
                          ].map((data, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center flex-1"
                            >
                              <div
                                className="bg-blue-600 rounded-t w-full transition-all duration-300 hover:bg-blue-700 flex items-end justify-center pb-2"
                                style={{
                                  height: `${(data.value / 200) * 100}%`,
                                  minHeight: "30px",
                                }}
                              >
                                <span className="text-xs text-white font-semibold">
                                  {data.value}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600 mt-2 font-medium">
                                {data.month}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lobbies and Players Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Lobbies Created Chart */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Lobbies Created (Last 6 Months)
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-end justify-between h-32 space-x-2">
                            {[
                              { month: "Aug", value: 45 },
                              { month: "Sep", value: 67 },
                              { month: "Oct", value: 83 },
                              { month: "Nov", value: 72 },
                              { month: "Dec", value: 94 },
                              { month: "Jan", value: 89 },
                            ].map((data, index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center flex-1"
                              >
                                <div
                                  className="bg-green-600 rounded-t w-full transition-all duration-300 hover:bg-green-700 flex items-end justify-center pb-1"
                                  style={{
                                    height: `${(data.value / 100) * 100}%`,
                                    minHeight: "20px",
                                  }}
                                >
                                  <span className="text-xs text-white font-semibold">
                                    {data.value}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600 mt-1">
                                  {data.month}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Players Joined Chart */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Players Joined (Last 6 Months)
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-end justify-between h-32 space-x-2">
                            {[
                              { month: "Aug", value: 1890 },
                              { month: "Sep", value: 2234 },
                              { month: "Oct", value: 2567 },
                              { month: "Nov", value: 2123 },
                              { month: "Dec", value: 2989 },
                              { month: "Jan", value: 2847 },
                            ].map((data, index) => (
                              <div
                                key={index}
                                className="flex flex-col items-center flex-1"
                              >
                                <div
                                  className="bg-purple-600 rounded-t w-full transition-all duration-300 hover:bg-purple-700 flex items-end justify-center pb-1"
                                  style={{
                                    height: `${(data.value / 3000) * 100}%`,
                                    minHeight: "20px",
                                  }}
                                >
                                  <span className="text-xs text-white font-semibold">
                                    {Math.round((data.value / 1000) * 10) / 10}k
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600 mt-1">
                                  {data.month}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            567
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Questions
                          </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            234
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Lobbies
                          </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            12.4k
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Players
                          </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            8.5 min
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg Session
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    // </ProtectedPage>
  );
}
