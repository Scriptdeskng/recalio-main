"use client";

import { useQuizState } from "@/hooks/useQuizState";
import { useQuizHistory } from "@/hooks/useQuizHistory";
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
import { createChallenge, generateQuiz, completeSession } from "@/lib/api";
import { storage } from "@/lib/storage";

const IndexPage = () => {
  const quiz = useQuizState();
  const quizHistory = useQuizHistory();
  const savedRef = useRef(false);
  const [loadingReady, setLoadingReady] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeCount, setChallengeCount] = useState(0);
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);

  const timerRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ids = storage.getMyChallenges();
    setChallengeCount(ids.length);
  }, [quiz.screen]);

  useEffect(() => {
    if (quiz.screen === "quiz") {
      timerRef.current = 0;
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [quiz.screen]);

  useEffect(() => {
    if (quiz.screen === "complete" && !savedRef.current) {
      savedRef.current = true;
      const correct = quiz.results.filter((r) => r.isCorrect).length;
      const rawLabel = quiz.config.input.trim();
      const inputLabel = rawLabel.length === 0 ? "Untitled Quiz" : rawLabel.length > 40 ? rawLabel.slice(0, 37) + "…" : rawLabel;
      quizHistory.addEntry({
        topic: inputLabel,
        difficulty: quiz.config.difficulty,
        totalQuestions: quiz.questions.length,
        correctAnswers: correct,
        xp: quiz.xp,
        percentage: Math.round((correct / quiz.questions.length) * 100),
      });

      completeSession({
        input: quiz.config.input,
        mode: quiz.config.input.trim().length > 100 ? "notes" : "topic",
        difficulty: quiz.config.difficulty,
        count: quiz.config.count,
        answers: quiz.results.map((r) => r.selectedAnswer),
        duration_seconds: timerRef.current,
        player_name: storage.getPlayerName() || undefined,
        questions: quiz.questions,
      }).then((res) => {
        setLastAttemptId(res.attempt_id);
      }).catch((err) => {
        console.error("Failed to complete session:", err);
        toast.error("Failed to save quiz results");
      });
    }
    if (quiz.screen !== "complete") savedRef.current = false;
  }, [quiz.screen]);

  const handleGenerate = async () => {
    quiz.setScreen("loading");
    setLoadingReady(false);
    try {
      const input = quiz.config.input.trim();
      const isLongForm = input.length > 100;
      const data = await generateQuiz({
        input,
        mode: isLongForm ? "notes" : "topic",
        difficulty: quiz.config.difficulty,
        count: quiz.config.count,
      });
      if (!data?.questions?.length) throw new Error("No questions returned");
      setLoadingReady(true);
      setTimeout(() => quiz.startQuiz(data.questions), 600);
    } catch (err) {
      console.error("Quiz generation failed:", err);
      toast.error("Failed to generate quiz. Please try again.");
      quiz.setScreen("setup");
    }
  };

  const doCreateChallenge = useCallback(async (creatorName: string) => {
    try {
      console.log("Creating challenge with:", { lastAttemptId, creatorName });
      const response = await createChallenge({
        attempt_id: lastAttemptId,
        creator_name: creatorName,
        input: quiz.config.input,
        difficulty: quiz.config.difficulty,
        count: quiz.questions.length,
        questions: quiz.questions,
        answers: quiz.results.map((r) => r.selectedAnswer),
        duration_seconds: timerRef.current,
      });
      console.log("Challenge created:", response);
      storage.addMyChallenge(response.challenge_id);
      setChallengeId(response.challenge_id);
      quiz.setScreen("challenge-created");
    } catch (err) {
      console.error("Failed to create challenge:", err);
      toast.error("Failed to create challenge. Please try again.");
    }
  }, [lastAttemptId, quiz.config, quiz.questions, quiz.results]);

  const handleChallenge = useCallback(async () => {
    console.log("Challenge button clicked");
    const storedName = storage.getPlayerName();
    console.log("Stored name:", storedName);
    if (!storedName) {
      console.log("No name found, showing modal");
      setShowNameModal(true);
      return;
    }
    console.log("Calling doCreateChallenge");
    await doCreateChallenge(storedName);
  }, [doCreateChallenge]);

  const handleNameSubmit = useCallback((name: string) => {
    setShowNameModal(false);
    doCreateChallenge(name);
  }, [doCreateChallenge]);

  const handleNavigate = useCallback((screen: ScreenState) => {
    quiz.setScreen(screen);
  }, [quiz]);

  const topicLabel = quiz.config.input.length > 40 ? quiz.config.input.slice(0, 37) + "…" : quiz.config.input;

  return (
    <>
      {showNameModal && (
        <NameModal
          onSubmit={handleNameSubmit}
          onCancel={() => setShowNameModal(false)}
        />
      )}
      
      {(() => {
        switch (quiz.screen) {
          case "setup":
            return <SetupScreen config={quiz.config} setConfig={quiz.setConfig} onGenerate={handleGenerate} onNavigate={handleNavigate} historyCount={quizHistory.totalQuizzes} challengeCount={challengeCount} recentTopics={quizHistory.recentTopics} />;
          case "loading":
            return <LoadingScreen isReady={loadingReady} />;
          case "quiz":
            return <QuizScreen questions={quiz.questions} currentIndex={quiz.currentIndex} results={quiz.results} xp={quiz.xp} topic={topicLabel} onAnswer={quiz.answerQuestion} onNext={quiz.nextQuestion} onExit={quiz.resetToSetup} />;
          case "complete":
            return <CompletionScreen results={quiz.results} totalQuestions={quiz.questions.length} xp={quiz.xp} timeTaken={timerRef.current} onRetry={quiz.retryQuiz} onNewTopic={quiz.resetToSetup} onChallenge={handleChallenge} />;
          case "challenge-created":
            return challengeId ? <ChallengeCreatedScreen challengeId={challengeId} topic={topicLabel} score={Math.round((quiz.results.filter((r) => r.isCorrect).length / quiz.questions.length) * 100)} onHome={quiz.resetToSetup} /> : null;
          case "history":
            return <HistoryScreen history={quizHistory.history} onBack={() => quiz.setScreen("setup")} onClear={quizHistory.clearHistory} />;
          case "my-challenges":
            return <MyChallengesScreen onBack={() => quiz.setScreen("setup")} />;
          case "profile":
            return <ProfileScreen onBack={() => quiz.setScreen("setup")} totalXp={quizHistory.totalXp} totalQuizzes={quizHistory.totalQuizzes} averageScore={quizHistory.averageScore} />;
          default:
            return null;
        }
      })()}
    </>
  );
};

export default IndexPage;
