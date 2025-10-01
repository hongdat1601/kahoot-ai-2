"use client";

import { useState, useRef, useEffect, use } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Play,
  Plus,
  Image as ImageIcon,
  X,
  Check,
  Edit,
} from "lucide-react";
import React from "react";
import { useGame, useGameMutations, useGames } from "@/hooks/useGames";
import { useAuth } from "@/context/AuthContext";
import {
  useQuestion,
  useQuestionMutations,
  useQuestions,
} from "@/hooks/useQuestions";
import Loading from "@/app/loading";
import { useAnswer, useAnswerMutations, useAnswers } from "@/hooks/useAnswers";
import { Answer as AnswerType, GameState, QuestionType } from "@/types/api";
import { GameAnswer } from "@/types/game";

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  isSaved: boolean;
}

interface Slide {
  id: string;
  question: string;
  answers: Answer[];
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  backgroundImage?: string;
  questionType: QuestionType;
  timeLimit: number;
  points: number;
}

type Params = { id: string };
type SearchParams = { tempId: string };

export default function GameEditPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const { tempId } = React.use(searchParams);

  const isNew = !id || id === "new";
  const gameId = isNew ? tempId : id;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTool, setSelectedTool] = useState("select");
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slides, setSlides] = useState<Slide[]>([]);

  const [gameTitle, setGameTitle] = useState("Untitled Game");
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(gameTitle);
  const [gameState, setGameState] = useState<GameState>(GameState.Draft);

  const { refetch: refetchGame } = useGame(gameId);
  const { refetch: refetchQuestion } = useQuestions(gameId);
  const { updateGame, loading: gameMutLoading, updateGameState } = useGameMutations();
  const { refetch: refetchAnswers } = useAnswers(null, null);
  const { loading: authLoading, getAccessToken } = useAuth();
  const { createQuestion, deleteQuestion, updateQuestion } = useQuestionMutations();
  const { createAnswers, deleteAnswer } = useAnswerMutations();

  // debound question title
  const [questionTitle, setQuestionTitle] = useState("");
  const [deboundQuestionTitle, setDeboundQuestionTitle] = useState(questionTitle);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDeboundQuestionTitle(questionTitle);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [questionTitle]);

  useEffect(() => {
    let update = async () => {
      if (deboundQuestionTitle) {
        try {
          let isSuccess = await updateQuestion(gameId, slides[currentSlide]!.id!, {
            timeLimitSeconds: slides[currentSlide]!.timeLimit,
            title: deboundQuestionTitle
          });

          if (!isSuccess) {
            throw Error("Update failed.");
          }
        } catch (err) {
          console.error(err);
          window.alert("Something went wrong!");
        }
      }
    }

    update();
  }, [deboundQuestionTitle]);

  // debound question time
  const [questionTime, setQuestionTime] = useState(0);
  const [deboundQuestionTime, setDeboundQuestionTime] = useState(questionTime);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDeboundQuestionTime(questionTime);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [questionTime]);

  useEffect(() => {
    let update = async () => {
      if (questionTime) {
        try {
          let isSuccess = await updateQuestion(gameId, slides[currentSlide]!.id!, {
            timeLimitSeconds: questionTime,
            title: slides[currentSlide]!.question
          });

          if (!isSuccess) {
            throw Error("Update failed.");
          }
        } catch (err) {
          console.error(err);
          window.alert("Something went wrong!");
        }
      }
    }

    update();
  }, [deboundQuestionTime]);


  useEffect(() => {
    if (!authLoading) getAccessToken().then(data => console.log(data));
  }, [authLoading])

  useEffect(() => {
    const fetchGame = async () => {
      if (authLoading) return;

      try {
        // fetch game
        let game = await refetchGame(gameId);

        if (game === null || game === undefined)
          throw new Error("Game is null.");

        setGameTitle(game?.title ?? "Untitled Game");
        setGameState(game?.state ?? GameState.Draft);

        // fetch questions
        let questions = await refetchQuestion(gameId);

        if (questions === null || questions === undefined)
          throw new Error("Questions is null.");

        let tempSlide: Slide[] = [];

        for (let question of questions!) {
          let answers = await refetchAnswers(gameId, question.id!);

          tempSlide.push({
            id: question.id!,
            question: question.title!,
            timeLimit: question.timeLimitSeconds!,
            answers: answers!.map((answer) => {
              return {
                id: answer.id,
                text: answer.title,
                isCorrect: answer.isCorrect,
                isSaved: true
              } as Answer;
            }),
            backgroundColor: "#ffffff",
            questionType: QuestionType.SingleChoice,
            textColor: "#000000",
            fontSize: "text-2xl",
            points: 100,
          });
        }

        if (tempSlide.length <= 0) throw new Error("Questions length <= 0.");

        setSlides(tempSlide);
      } catch (err) {
        console.error(err);
        window.alert("Something went wrong!");
        router.push("/admin");
      }
    };

    fetchGame();
  }, [authLoading]);

  const updateSlide = (slideIndex: number, updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((slide, index) =>
        index === slideIndex ? { ...slide, ...updates } : slide
      )
    );
  };

  const addAnswer = () => {    
    const newAnswer: Answer = {
      id: `a${Date.now()}`,
      text: "New Answer",
      isCorrect: false,
      isSaved: false
    };

    updateSlide(currentSlide, {
      answers: [...slides[currentSlide]!.answers, newAnswer],
    });
  };

  const removeAnswer = async (answerId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        let isSuccess = await deleteAnswer(gameId, slides[currentSlide]!.id, answerId);
        if (!isSuccess) throw Error("Cannot handle answers");
      }

      updateSlide(currentSlide, {
        answers: slides[currentSlide]!.answers.filter((a) => a.id !== answerId),
      });
      
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const updateAnswer = (answerId: string, text: string) => {
    updateSlide(currentSlide, {
      answers: slides[currentSlide]!.answers.map((a) =>
        a.id === answerId ? { ...a, text } : a
      ),
    });
  };

  const updateTitle = async () => {
    setGameTitle(draftTitle);

    try {
      await updateGame(gameId, {
        title: draftTitle,
      });
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }

    setEditingTitle(false);
  };

  const toggleCorrectAnswer = (answerId: string) => {
    let count = 0;

    for(let answer of slides[currentSlide]!.answers) {
      if (answer.isCorrect) {
        count++;
      }
    }

    updateSlide(currentSlide, {
      answers: slides[currentSlide]!.answers.map((a) =>
        a.id === answerId ? { ...a, isCorrect: count <= 1 && a.isCorrect ? a.isCorrect: !a.isCorrect } : a
      ),
    });
  };

  const addSlide = async () => {
    try {
      let questionId = await createQuestion(gameId, {
        gameId: gameId,
        timeLimitSeconds: 30,
        title: "New Question",
        type: QuestionType.SingleChoice,
      });

      if (questionId === null || questionId === undefined)
        throw new Error("Question Id is null!");

      let answerIds = await createAnswers(gameId, questionId, {
        gameId: gameId,
        questionId: questionId,
        questionType: 0,
        answers: [
          {
            gameId: gameId,
            questionId: questionId,
            title: "Answer 1",
            isCorrect: true,
          },
          {
            gameId: gameId,
            questionId: questionId,
            title: "Answer 2",
            isCorrect: false,
          },
        ],
      });

      if (answerIds === null || answerIds === undefined)
        throw new Error("Answer Ids is null!");

      const newSlide: Slide = {
        id: questionId,
        question: "New Question",
        answers: [
          { id: answerIds.split("/")[0]!, text: "Answer 1", isCorrect: true, isSaved: true },
          { id: answerIds.split("/")[1]!, text: "Answer 2", isCorrect: false, isSaved: true },
        ],
        backgroundColor: "#ffffff",
        textColor: "#000000",
        fontSize: "text-2xl",
        questionType: QuestionType.SingleChoice,
        timeLimit: 30,
        points: 100,
      };

      setSlides((prev) => [...prev, newSlide]);
      setCurrentSlide(slides.length);
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const removeSlide = async (slideIndex: number) => {
    if (slides.length === 1) return;

    try {
      let isSuccess = await deleteQuestion(gameId, slides[slideIndex]!.id!);

      if (!isSuccess) {
        throw Error("Delete failed.");
      }

      setSlides((prev) => prev.filter((_, index) => index !== slideIndex));
      if (currentSlide >= slideIndex && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }
  };

  const handleQuestionTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let time = parseInt(e.target.value);
    setQuestionTime(time);
    updateSlide(currentSlide, {
      timeLimit: time,
    });
  }

  const handleQuestionTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let title = e.target.value;
    setQuestionTitle(title);
    updateSlide(currentSlide, { question: title });
  }

  const handleQuestionTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
     try {
      let questionType = Number(e.target.value) as QuestionType;

      if (questionType === QuestionType.TrueFalse) {
        for (let answer of slides[currentSlide]!.answers) {
          await removeAnswer(answer.id, answer.isSaved);
        }

        updateSlide(currentSlide, {
          answers: [
            {
              id: "true",
              text: "True",
              isCorrect: true,
              isSaved: false
            },
            {
              id: "false",
              text: "False",
              isCorrect: false,
              isSaved: false
            },
          ],
        }); 
      }

      //TODO: Handle update question type here.

      updateSlide(currentSlide, {
      questionType: questionType
    });
    } catch (err) {
      console.error(err);
      window.alert("Something went wrong!");
    }

  }

  const handleSave = async () => {
    try {
      // handle answers
      for (let question of slides) {
        let answers: AnswerType[] = []

        for (let answer of question.answers) {
          if (answer.isSaved) {
            let isSuccess = await deleteAnswer(gameId, question.id, answer.id);
            if (!isSuccess) throw Error("Cannot handle answers");
          }

          answers.push({
            gameId: gameId,
            questionId: question.id,
            isCorrect: answer.isCorrect,
            title: answer.text
          });
        }

        let answerIds = await createAnswers(gameId, question.id, {
          gameId: gameId,
          questionId: question.id,
          questionType: question.questionType,
          answers: answers,
        });

        if (answerIds === null || answerIds === undefined)
          throw new Error("Failed to handle Answers");

      }

      // handle game state
      if (gameState !== GameState.Active) {
        let isSuccess = await updateGameState(gameId, {currentState: gameState, targetState: GameState.Active});
        if (!isSuccess) throw Error("Cannot update game state");
      }

      if (isNew) {
        alert("Game created successfully!");
        router.push(`/admin/game/${gameId}`);
        return;
      }

      alert("Game saved successfully!");
      window.location.reload();
    } catch (err) {
      console.log(err);
      alert("Some thing went wrong! Back to home page." + err);
      router.push("/admin");
    }
  };

  const handleBackToAdmin = () => {
    try {
      router.push("/admin");
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/admin";
    }
  };

  const handleBackgroundImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateSlide(currentSlide, {
          backgroundImage: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (slides.length <= 0) return <Loading />;

  const currentSlideData = slides?.[currentSlide];

  if (showPreview) {
    const previewQuestion = slides[previewSlideIndex];

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold">Preview Mode</h2>
              <span className="text-gray-500">
                Game {previewSlideIndex + 1} of {slides.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setPreviewSlideIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={previewSlideIndex === 0}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPreviewSlideIndex((prev) =>
                    Math.min(slides.length - 1, prev + 1)
                  )
                }
                disabled={previewSlideIndex === slides.length - 1}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewSlideIndex(0);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Exit Preview
              </button>
            </div>
          </div>

          <div
            className="relative aspect-video rounded-b-lg overflow-hidden"
            style={{
              backgroundColor: previewQuestion!.backgroundColor,
              backgroundImage: previewQuestion!.backgroundImage
                ? `url(${previewQuestion!.backgroundImage})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-8">
                <h1
                  className={`${previewQuestion!.fontSize} font-bold mb-4`}
                  style={{ color: previewQuestion!.textColor }}
                >
                  {previewQuestion!.question}
                </h1>
              </div>

              {previewQuestion!.questionType === QuestionType.TrueFalse ? (
                <div className="flex gap-8">
                  <button className="px-8 py-4 bg-green-500 text-white font-semibold text-lg rounded-lg hover:opacity-80 transition-colors">
                    True
                  </button>
                  <button className="px-8 py-4 bg-red-500 text-white font-semibold text-lg rounded-lg hover:opacity-80 transition-colors">
                    False
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-4 w-full max-w-2xl ${
                    previewQuestion!.answers.length <= 2
                      ? "grid-cols-1"
                      : "grid-cols-2"
                  }`}
                >
                  {previewQuestion!.answers.map((answer, index) => (
                    <button
                      key={answer.id}
                      className={`p-4 rounded-lg text-white font-semibold text-lg transition-colors hover:opacity-80 ${
                        [
                          "bg-red-500",
                          "bg-blue-500",
                          "bg-yellow-500",
                          "bg-green-500",
                          "bg-purple-500",
                          "bg-orange-500",
                        ][index % 6]
                      }`}
                    >
                      {answer.text}
                    </button>
                  ))}
                </div>
              )}

              {/* <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">{previewQuestion.timeLimit}s • {previewQuestion.points} pts</div> */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                {previewQuestion!.timeLimit}s
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToAdmin}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin</span>
            </button>
            {isNew ? (
              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold text-gray-900">
                  Create New Game:
                </span>
                {editingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="text-xl font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={updateTitle}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDraftTitle(gameTitle);
                        setEditingTitle(false);
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {gameTitle}
                    </span>
                    <button
                      onClick={() => {
                        setDraftTitle(gameTitle);
                        setEditingTitle(true);
                      }}
                      className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                      aria-label="Edit title"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-1">Edit</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold text-gray-900">
                  Edit Game:
                </span>
                {editingTitle ? (
                  <div className="flex items-center space-x-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="text-xl font-semibold text-gray-900 bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    />
                    <button
                      onClick={() => {
                        setGameTitle(draftTitle);
                        setEditingTitle(false);
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDraftTitle(gameTitle);
                        setEditingTitle(false);
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {gameTitle}
                    </span>
                    <button
                      onClick={() => {
                        setDraftTitle(gameTitle);
                        setEditingTitle(true);
                      }}
                      className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                      aria-label="Edit title"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-1">Edit</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (!isNew) router.push(`/admin/game/${id}/history`);
              }}
              className={`flex items-center space-x-2 px-4 py-2 ${
                isNew || gameState !== GameState.Active
                  ? "bg-gray-500 text-white opacity-60 cursor-not-allowed"
                  : "bg-gray-600 text-white hover:bg-gray-700"
              } rounded-lg transition-colors`}
              disabled={isNew || gameState !== GameState.Active}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>History</span>
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => {
                if (!isNew) router.push(`/admin/game/${id}/play`);
              }}
              className={`flex items-center space-x-2 px-4 py-2 ${
                isNew || gameState !== GameState.Active
                  ? "bg-purple-500 text-white opacity-60 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              } rounded-lg transition-colors`}
              disabled={isNew || gameState !== GameState.Active}
            >
              <Play className="h-4 w-4" />
              <span>Start Lobby</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isNew ? "Create" : "Save"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Slides</h3>
            <button
              onClick={addSlide}
              className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`relative p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  currentSlide === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setCurrentSlide(index)}
              >
                <div className="text-sm font-medium text-gray-900 truncate">
                  {slide.question}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {slide.answers.length} answers
                </div>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(index);
                    }}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-6 flex-wrap gap-y-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Type:
                </label>
                <select
                  value={currentSlideData!.questionType}
                  onChange={(e) => handleQuestionTypeChange(e)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={QuestionType.SingleChoice}>
                    Single Choice
                  </option>
                  <option value={QuestionType.MultipleChoice}>
                    Multiple Choice
                  </option>
                  <option value={QuestionType.TrueFalse}>True/False</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Time:
                </label>
                <input
                  type="number"
                  value={currentSlideData!.timeLimit}
                  onChange={(e) => handleQuestionTimeChange(e)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="5"
                  max="30"
                />
                <span className="text-sm text-gray-500">sec</span>
              </div>

              {/* <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Points:</label>
                <input type="number" value={currentSlideData.points} onChange={(e) => updateSlide(currentSlide, { points: parseInt(e.target.value) })} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min="10" max="2000" step="10" />
              </div> */}

              {/* <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"><ImageIcon className="h-4 w-4" /><span className="text-sm">Background Image</span></button> */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex-1 p-8 bg-gray-100">
            <div className="max-w-4xl mx-auto">
              <div
                className="relative aspect-video rounded-lg shadow-lg overflow-hidden"
                style={{
                  backgroundColor: currentSlideData!.backgroundColor,
                  backgroundImage: currentSlideData!.backgroundImage
                    ? `url(${currentSlideData!.backgroundImage})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute top-4 left-8 right-8">
                  <textarea
                    value={currentSlideData!.question}
                    onChange={(e) =>
                      handleQuestionTitleChange(e)
                    }
                    className={`w-full bg-transparent border-2 border-dashed border-gray-300 rounded p-3 ${
                      currentSlideData!.fontSize
                    } font-bold text-center resize-none focus:border-blue-500 focus:outline-none`}
                    style={{ color: currentSlideData!.textColor }}
                    placeholder="Enter your question here..."
                    rows={2}
                  />
                </div>

                <div className="absolute left-8 right-8 bottom-8">
                  {currentSlideData!.questionType === QuestionType.TrueFalse ? (
                    <div className="flex justify-center gap-8">
                      <div className="relative group">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-green-500/20 min-w-[120px]">
                          <div
                            className="text-center font-semibold"
                            style={{ color: currentSlideData!.textColor }}
                          >
                            True
                          </div>
                          <button
                            onClick={() => {
                              updateSlide(currentSlide, {
                                answers: [
                                  { id: "true", text: "True", isCorrect: true, isSaved: false },
                                  {
                                    id: "false",
                                    text: "False",
                                    isCorrect: false,
                                    isSaved: false
                                  },
                                ],
                              });
                            }}
                            className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                              currentSlideData!.answers.find(
                                (a) => a.id === "true"
                              )?.isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-red-500/20 min-w-[120px]">
                          <div
                            className="text-center font-semibold"
                            style={{ color: currentSlideData!.textColor }}
                          >
                            False
                          </div>
                          <button
                            onClick={() => {
                              updateSlide(currentSlide, {
                                answers: [
                                  {
                                    id: "true",
                                    text: "True",
                                    isCorrect: false,
                                    isSaved: false,
                                  },
                                  {
                                    id: "false",
                                    text: "False",
                                    isCorrect: true,
                                    isSaved: false
                                  },
                                ],
                              });
                            }}
                            className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                              currentSlideData!.answers.find(
                                (a) => a.id === "false"
                              )?.isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`grid gap-4 ${
                        currentSlideData!.answers.length <= 2
                          ? "grid-cols-1"
                          : "grid-cols-2"
                      }`}
                    >
                      {currentSlideData!.answers.map((answer, index) => (
                        <div key={answer.id} className="relative group">
                          <div
                            className={`p-4 rounded-lg border-2 border-dashed border-gray-300 ${
                              [
                                "bg-red-500/20",
                                "bg-blue-500/20",
                                "bg-yellow-500/20",
                                "bg-green-500/20",
                                "bg-purple-500/20",
                                "bg-orange-500/20",
                              ][index % 6]
                            }`}
                          >
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) =>
                                updateAnswer(answer.id, e.target.value)
                              }
                              className="w-full bg-transparent text-center font-semibold focus:outline-none"
                              style={{ color: currentSlideData!.textColor }}
                              placeholder={`Answer ${index + 1}`}
                            />
                            <button
                              onClick={() => {
                                if (
                                  currentSlideData!.questionType ===
                                  QuestionType.SingleChoice
                                ) {
                                  updateSlide(currentSlide, {
                                    answers: currentSlideData!.answers.map(
                                      (a) => ({
                                        ...a,
                                        isCorrect: a.id === answer.id,
                                      })
                                    ),
                                  });
                                } else {
                                  toggleCorrectAnswer(answer.id);
                                }
                              }}
                              className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                                answer.isCorrect
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            {currentSlideData!.answers.length > 2 && (
                              <button
                                onClick={() => removeAnswer(answer.id, answer.isSaved)}
                                className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {currentSlideData!.answers.length < 6 &&
                        currentSlideData!.questionType !==
                          QuestionType.TrueFalse && (
                          <button
                            onClick={addAnswer}
                            className="p-4 border-2 border-dashed border-gray-400 rounded-lg text-gray-600 hover:border-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center"
                          >
                            <Plus className="h-6 w-6" />
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
