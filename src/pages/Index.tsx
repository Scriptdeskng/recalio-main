import { useQuizState } from "@/hooks/useQuizState";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { supabase } from "@/integrations/supabase/client";
import SetupScreen from "@/components/SetupScreen";
import LoadingScreen from "@/components/LoadingScreen";
import QuizScreen from "@/components/QuizScreen";
import CompletionScreen from "@/components/CompletionScreen";
import HistoryScreen from "@/components/HistoryScreen";
import MyChallengesScreen from "@/components/MyChallengesScreen";
import ProfileScreen from "@/components/ProfileScreen";
import ChallengeCreatedScreen from "@/components/challenge/ChallengeCreatedScreen";
import NameModal from "@/components/challenge/NameModal";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ScreenState } from "@/lib/types";

const Index = () => {
  const quiz = useQuizState();
  const quizHistory = useQuizHistory();
  const savedRef = useRef(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeCount, setChallengeCount] = useState(0);

  // Timer for solo quiz (used for challenges)
  const timerRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Count challenges from localStorage
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("staysharp_my_challenges") || "[]") as string[];
    setChallengeCount(ids.length);
  }, [quiz.screen]);

  // Start timer when quiz begins
  useEffect(() => {
    if (quiz.screen === "quiz") {
      timerRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [quiz.screen]);

  // Save result when quiz completes
  useEffect(() => {
    if (quiz.screen === "complete" && !savedRef.current) {
      savedRef.current = true;
      const correct = quiz.results.filter((r) => r.isCorrect).length;
      const rawLabel = quiz.config.input.trim();
      const inputLabel = rawLabel.length === 0
        ? "Untitled Quiz"
        : rawLabel.length > 40
          ? rawLabel.slice(0, 37) + "…"
          : rawLabel;
      quizHistory.addEntry({
        topic: inputLabel,
        difficulty: quiz.config.difficulty,
        totalQuestions: quiz.questions.length,
        correctAnswers: correct,
        xp: quiz.xp,
        percentage: Math.round((correct / quiz.questions.length) * 100),
      });
    }
    if (quiz.screen !== "complete") {
      savedRef.current = false;
    }
  }, [quiz.screen]);




  const handleGenerate = async () => {
    quiz.setScreen("loading");
    setLoadingReady(false);
    try {
      const input = quiz.config.input.trim();
      const isLongForm = input.length > 100;

      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          mode: isLongForm ? "notes" : "topic",
          topic: isLongForm ? undefined : input,
          notes: isLongForm ? input : undefined,
          difficulty: quiz.config.difficulty,
          count: quiz.config.count,
        },
      });
      if (error) throw error;
      if (!data?.questions?.length) throw new Error("No questions returned");
      setLoadingReady(true);
      setTimeout(() => quiz.startQuiz(data.questions), 600);
    } catch (err: any) {
      console.error("Quiz generation failed:", err);
      toast.error("Failed to generate quiz. Please try again.");
      quiz.setScreen("setup");
    }
  };

  const handleChallenge = useCallback(async () => {
    const storedName = localStorage.getItem("staysharp_player_name");
    if (!storedName) {
      setShowNameModal(true);
      return;
    }
    await createChallenge(storedName);
  }, [quiz.questions, quiz.results, quiz.config, quiz.xp]);

  const createChallenge = useCallback(async (creatorName: string) => {
    const correct = quiz.results.filter((r) => r.isCorrect).length;
    const score = Math.round((correct / quiz.questions.length) * 100);
    const rawLabel = quiz.config.input.trim();
    const topicLabel = rawLabel.length === 0
      ? "Untitled Quiz"
      : rawLabel.length > 40
        ? rawLabel.slice(0, 37) + "…"
        : rawLabel;

    try {
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          topic: topicLabel,
          difficulty: quiz.config.difficulty,
          question_count: quiz.questions.length,
          questions: quiz.questions as any,
          creator_name: creatorName,
          creator_score: score,
          creator_time: timerRef.current,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      const id = (data as any).id;
      const myCreations = JSON.parse(localStorage.getItem("staysharp_my_challenges") || "[]") as string[];
      myCreations.push(id);
      localStorage.setItem("staysharp_my_challenges", JSON.stringify(myCreations));

      setChallengeId(id);
      quiz.setScreen("challenge-created");
    } catch (err) {
      console.error("Failed to create challenge:", err);
      toast.error("Failed to create challenge. Please try again.");
    }
  }, [quiz.questions, quiz.results, quiz.config]);

  const handleNameSubmit = useCallback((name: string) => {
    setShowNameModal(false);
    createChallenge(name);
  }, [createChallenge]);

  const handleNavigate = useCallback((screen: ScreenState) => {
    quiz.setScreen(screen);
  }, [quiz]);

  const topicLabel = quiz.config.input.length > 40
    ? quiz.config.input.slice(0, 37) + "…"
    : quiz.config.input;

  const renderScreen = () => {
    switch (quiz.screen) {
      case "setup":
        return (
          <SetupScreen
            key="setup"
            config={quiz.config}
            setConfig={quiz.setConfig}
            onGenerate={handleGenerate}
            onNavigate={handleNavigate}
            historyCount={quizHistory.totalQuizzes}
            challengeCount={challengeCount}
            recentTopics={quizHistory.recentTopics}
          />
        );
      case "loading":
        return <LoadingScreen key="loading" isReady={loadingReady} />;
      case "quiz":
        return (
          <QuizScreen
            key="quiz"
            questions={quiz.questions}
            currentIndex={quiz.currentIndex}
            results={quiz.results}
            xp={quiz.xp}
            topic={topicLabel}
            onAnswer={quiz.answerQuestion}
            onNext={quiz.nextQuestion}
            onExit={quiz.resetToSetup}
          />
        );
      case "complete":
        return (
          <CompletionScreen
            key="complete"
            results={quiz.results}
            totalQuestions={quiz.questions.length}
            xp={quiz.xp}
            timeTaken={timerRef.current}
            onRetry={quiz.retryQuiz}
            onNewTopic={quiz.resetToSetup}
            onChallenge={handleChallenge}
          />
        );
      case "challenge-created":
        return challengeId ? (
          <ChallengeCreatedScreen
            key="challenge-created"
            challengeId={challengeId}
            topic={topicLabel}
            score={Math.round((quiz.results.filter((r) => r.isCorrect).length / quiz.questions.length) * 100)}
            onHome={quiz.resetToSetup}
          />
        ) : null;
      case "history":
        return (
          <HistoryScreen
            key="history"
            history={quizHistory.history}
            onBack={() => quiz.setScreen("setup")}
            onClear={quizHistory.clearHistory}
          />
        );
      case "my-challenges":
        return (
          <MyChallengesScreen
            key="my-challenges"
            onBack={() => quiz.setScreen("setup")}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            key="profile"
            onBack={() => quiz.setScreen("setup")}
            totalXp={quizHistory.totalXp}
            totalQuizzes={quizHistory.totalQuizzes}
            averageScore={quizHistory.averageScore}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderScreen()}
      {showNameModal && (
        <NameModal
          title="What's your name?"
          onSubmit={handleNameSubmit}
          onCancel={() => setShowNameModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
