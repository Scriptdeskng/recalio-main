"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Challenge, ChallengePageState, QuizQuestion, QuizResult } from "@/lib/types";
import { XP_PER_CORRECT } from "@/lib/constants";
import { useChallengeTimer } from "@/hooks/useChallengeTimer";
import ChallengeLanding from "@/components/challenge/ChallengeLanding";
import NameModal from "@/components/challenge/NameModal";
import QuizScreen from "@/components/QuizScreen";
import ChallengeResultScreen from "@/components/challenge/ChallengeResultScreen";
import { toast } from "sonner";
import { completeChallenge, createRematchChallenge, getChallenge } from "@/lib/api/challenges";
import { storage } from "@/lib/storage";
import { getWindowHref } from "@/lib/client-utils";

export default function ChallengePage() {
  const params = useParams<{ challengeId: string }>();
  const router = useRouter();
  const challengeId = params?.challengeId;
  const [state, setState] = useState<ChallengePageState>("loading");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengerName, setChallengerName] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [xp, setXp] = useState(0);
  const questionsLengthRef = useRef(0);
  const currentIndexRef = useRef(0);
  const resultsRef = useRef<QuizResult[]>([]);
  const timer = useChallengeTimer();
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    if (!challengeId) { setState("not-found"); return; }
    void fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const c = await getChallenge(challengeId!);
      setChallenge(c);
      if (new Date(c.expires_at) < new Date()) { setState("expired"); return; }
      const myCreations = storage.getMyChallenges();
      if (myCreations.includes(c.id)) { setState("own-link"); return; }
      if (c.challenger_name) { setState("taken"); return; }
      setState("landing");
    } catch {
      setState("not-found");
    }
  };

  const startChallengeQuiz = useCallback(() => {
    if (!challenge) return;
    const qs = challenge.questions;
    setQuestions(qs);
    questionsLengthRef.current = qs.length;
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setResults([]);
    resultsRef.current = [];
    setXp(0);
    timer.reset();
    timer.start();
    setState("quiz");
  }, [challenge, timer]);

  const handleAccept = useCallback(() => {
    const storedName = storage.getPlayerName();
    if (storedName) {
      setChallengerName(storedName);
      startChallengeQuiz();
    } else {
      setState("name-entry");
    }
  }, [startChallengeQuiz]);

  const handleNameSubmit = useCallback((name: string) => {
    setChallengerName(name);
    startChallengeQuiz();
  }, [startChallengeQuiz]);

  const answerQuestion = useCallback((selectedAnswer: number) => {
    const idx = currentIndexRef.current;
    const isCorrect = selectedAnswer === questions[idx].correct;
    const result = { questionIndex: idx, selectedAnswer, isCorrect };
    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);
    if (isCorrect) setXp((prev) => prev + XP_PER_CORRECT);
    return isCorrect;
  }, [questions]);

  const nextQuestion = useCallback(async () => {
    if (currentIndexRef.current + 1 >= questionsLengthRef.current) {
      timer.stop();
      const time = timer.getElapsed();
      const correct = resultsRef.current.filter((r) => r.isCorrect).length;
      const score = Math.round((correct / questionsLengthRef.current) * 100);
      setFinalScore(score);
      setFinalTime(time);
      const name = challengerName || storage.getPlayerName() || "Anonymous";
      
      if (!challenge) {
        console.error("Challenge not loaded");
        toast.error("Failed to submit challenge results");
        setState("error");
        return;
      }
      
      try {
        await completeChallenge(challenge.id, { challenger_name: name, answers: resultsRef.current.map((r) => r.selectedAnswer), duration_seconds: time });
        setState("result");
      } catch (err) {
        console.error("Failed to complete challenge:", err);
        toast.error("Failed to submit challenge results");
        setState("error");
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      currentIndexRef.current += 1;
    }
  }, [timer, challenge, challengerName]);

  const handleRematch = useCallback(async () => {
    if (!challenge) return;
    const name = storage.getPlayerName() || challengerName || "Anonymous";
    try {
      const response = await createRematchChallenge(challenge.id, { creator_name: name, creator_score: finalScore, creator_time: finalTime });
      storage.addMyChallenge(response.challenge_id);
      router.push(`/challenge/${response.challenge_id}`);
      router.refresh();
    } catch {
      toast.error("Failed to create rematch.");
    }
  }, [challenge, challengerName, finalScore, finalTime, router]);

  const topicLabel = challenge?.topic || "";

  if (state === "loading") return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground font-display">Loading challenge…</div></div>;
  if (state === "not-found") return <SimpleState emoji="🤷" title="Challenge Not Found" description="This challenge doesn't exist or the link is invalid." action="Start Your Own Quiz" onClick={() => router.push("/")} />;
  if (state === "expired") return <SimpleState emoji="⏰" title="Challenge Expired" description="This challenge has expired. Start your own!" action="Start Your Own Quiz" onClick={() => router.push("/")} />;
  if (state === "taken") return <SimpleState emoji="🔒" title="Challenge Already Taken" description="Someone already completed this challenge. Start your own!" action="Start Your Own Quiz" onClick={() => router.push("/")} />;
  if (state === "error") return <SimpleState emoji="❌" title="Submission Failed" description="Failed to submit your challenge results. Please try again." action="Back to Home" onClick={() => router.push("/")} />;
  if (state === "own-link") return <OwnLinkState onHome={() => router.push("/")} />;
  if (state === "landing" && challenge) return <div className="min-h-screen bg-background"><ChallengeLanding challenge={challenge} onAccept={handleAccept} /></div>;
  if (state === "name-entry") return <div className="min-h-screen bg-background"><NameModal title="Enter your name" onSubmit={handleNameSubmit} onCancel={() => setState("landing")} /></div>;
  if (state === "quiz" && challenge) return <div className="min-h-screen bg-background"><QuizScreen questions={questions} currentIndex={currentIndex} results={results} xp={xp} topic={topicLabel} onAnswer={answerQuestion} onNext={nextQuestion} onExit={() => router.push("/")} targetScore={challenge.creator_score} timerElapsed={timer.elapsed} /></div>;
  if (state === "result" && challenge) return <div className="min-h-screen bg-background"><ChallengeResultScreen challenge={challenge} challengerName={challengerName || storage.getPlayerName() || "Anonymous"} challengerScore={finalScore} challengerTime={finalTime} onRematch={handleRematch} onHome={() => router.push("/")} /></div>;
  return null;
}

function SimpleState({ emoji, title, description, action, onClick }: { emoji: string; title: string; description: string; action: string; onClick: () => void }) {
  return <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center"><span className="text-5xl mb-4">{emoji}</span><h2 className="font-display text-xl font-800 text-foreground mb-2">{title}</h2><p className="text-muted-foreground text-sm mb-6">{description}</p><button onClick={onClick} className="px-6 py-3 rounded-2xl gradient-teal text-primary-foreground font-display font-700">{action}</button></div>;
}

function OwnLinkState({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center max-w-[420px] mx-auto">
      <span className="text-5xl mb-4">👋</span>
      <h2 className="font-display text-xl font-800 text-foreground mb-2">This Is Your Challenge</h2>
      <p className="text-muted-foreground text-sm mb-6">Share it with a friend to see if they can beat your score!</p>
      <button onClick={async () => { await navigator.clipboard.writeText(getWindowHref()); toast.success("Link copied!"); }} className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg mb-3">📋 Copy Link</button>
      <button onClick={onHome} className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Back to Home</button>
    </div>
  );
}
