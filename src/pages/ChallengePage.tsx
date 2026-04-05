import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Challenge, ChallengePageState, QuizQuestion, QuizResult } from "@/lib/types";
import { XP_PER_CORRECT } from "@/lib/constants";
import { useChallengeTimer } from "@/hooks/useChallengeTimer";
import ChallengeLanding from "@/components/challenge/ChallengeLanding";
import NameModal from "@/components/challenge/NameModal";
import QuizScreen from "@/components/QuizScreen";
import ChallengeResultScreen from "@/components/challenge/ChallengeResultScreen";
import { toast } from "sonner";

export default function ChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<ChallengePageState>("loading");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengerName, setChallengerName] = useState("");

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [xp, setXp] = useState(0);
  const questionsLengthRef = useRef(0);
  const currentIndexRef = useRef(0);
  const resultsRef = useRef<QuizResult[]>([]);
  const timer = useChallengeTimer();

  // Final results
  const [finalScore, setFinalScore] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  useEffect(() => {
    if (!challengeId) { setState("not-found"); return; }
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId!)
      .single();

    if (error || !data) { setState("not-found"); return; }

    const c = data as unknown as Challenge;
    setChallenge(c);

    if (new Date(c.expires_at) < new Date()) { setState("expired"); return; }

    const myCreations = JSON.parse(localStorage.getItem("staysharp_my_challenges") || "[]") as string[];
    if (myCreations.includes(c.id)) { setState("own-link"); return; }

    if (c.challenger_name) { setState("taken"); return; }

    setState("landing");
  };

  const handleAccept = useCallback(() => {
    const storedName = localStorage.getItem("staysharp_player_name");
    if (storedName) {
      setChallengerName(storedName);
      startChallengeQuiz();
    } else {
      setState("name-entry");
    }
  }, [challenge]);

  const handleNameSubmit = useCallback((name: string) => {
    setChallengerName(name);
    startChallengeQuiz();
  }, [challenge]);

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
      const allResults = resultsRef.current;
      const correct = allResults.filter((r) => r.isCorrect).length;
      const score = Math.round((correct / questionsLengthRef.current) * 100);
      setFinalScore(score);
      setFinalTime(time);

      // Save to database
      const name = localStorage.getItem("staysharp_player_name") || "Anonymous";
      try {
        await supabase
          .from("challenges")
          .update({
            challenger_name: name,
            challenger_score: score,
            challenger_time: time,
          } as any)
          .eq("id", challenge!.id);
      } catch (err) {
        console.error("Failed to save challenge result:", err);
      }

      setState("result");
    } else {
      setCurrentIndex((prev) => prev + 1);
      currentIndexRef.current += 1;
    }
  }, [timer, challenge]);

  const handleRematch = useCallback(async () => {
    if (!challenge) return;
    const name = localStorage.getItem("staysharp_player_name") || "Anonymous";
    try {
      const { data, error } = await supabase
        .from("challenges")
        .insert({
          topic: challenge.topic,
          difficulty: challenge.difficulty,
          question_count: challenge.question_count,
          questions: challenge.questions as any,
          creator_name: name,
          creator_score: finalScore,
          creator_time: finalTime,
        } as any)
        .select("id")
        .single();

      if (error) throw error;

      const myCreations = JSON.parse(localStorage.getItem("staysharp_my_challenges") || "[]") as string[];
      myCreations.push((data as any).id);
      localStorage.setItem("staysharp_my_challenges", JSON.stringify(myCreations));

      navigate(`/challenge/${(data as any).id}`);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to create rematch.");
    }
  }, [challenge, finalScore, finalTime, navigate]);

  const topicLabel = challenge?.topic || "";

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-display">Loading challenge…</div>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <span className="text-5xl mb-4">🤷</span>
        <h2 className="font-display text-xl font-800 text-foreground mb-2">Challenge Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">This challenge doesn't exist or the link is invalid.</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-2xl gradient-teal text-primary-foreground font-display font-700">
          Start Your Own Quiz
        </button>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <span className="text-5xl mb-4">⏰</span>
        <h2 className="font-display text-xl font-800 text-foreground mb-2">Challenge Expired</h2>
        <p className="text-muted-foreground text-sm mb-6">This challenge has expired. Start your own!</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-2xl gradient-teal text-primary-foreground font-display font-700">
          Start Your Own Quiz
        </button>
      </div>
    );
  }

  if (state === "taken") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <span className="text-5xl mb-4">🔒</span>
        <h2 className="font-display text-xl font-800 text-foreground mb-2">Challenge Already Taken</h2>
        <p className="text-muted-foreground text-sm mb-6">Someone already completed this challenge. Start your own!</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-2xl gradient-teal text-primary-foreground font-display font-700">
          Start Your Own Quiz
        </button>
      </div>
    );
  }

  if (state === "own-link") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center max-w-[420px] mx-auto">
        <span className="text-5xl mb-4">👋</span>
        <h2 className="font-display text-xl font-800 text-foreground mb-2">This Is Your Challenge</h2>
        <p className="text-muted-foreground text-sm mb-6">Share it with a friend to see if they can beat your score!</p>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
          }}
          className="w-full py-4 rounded-2xl gradient-teal text-primary-foreground font-display font-700 text-base shadow-lg mb-3"
        >
          📋 Copy Link
        </button>
        <button onClick={() => navigate("/")} className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to Home
        </button>
      </div>
    );
  }

  if (state === "landing" && challenge) {
    return (
      <div className="min-h-screen bg-background">
        <ChallengeLanding challenge={challenge} onAccept={handleAccept} />
      </div>
    );
  }

  if (state === "name-entry") {
    return (
      <div className="min-h-screen bg-background">
        <NameModal
          title="Enter your name"
          onSubmit={handleNameSubmit}
          onCancel={() => setState("landing")}
        />
      </div>
    );
  }

  if (state === "quiz" && challenge) {
    return (
      <div className="min-h-screen bg-background">
        <QuizScreen
          questions={questions}
          currentIndex={currentIndex}
          results={results}
          xp={xp}
          topic={topicLabel}
          onAnswer={answerQuestion}
          onNext={nextQuestion}
          onExit={() => navigate("/")}
          targetScore={challenge.creator_score}
          timerElapsed={timer.elapsed}
        />
      </div>
    );
  }

  if (state === "result" && challenge) {
    return (
      <div className="min-h-screen bg-background">
        <ChallengeResultScreen
          challenge={challenge}
          challengerName={challengerName || localStorage.getItem("staysharp_player_name") || "Anonymous"}
          challengerScore={finalScore}
          challengerTime={finalTime}
          onRematch={handleRematch}
          onHome={() => navigate("/")}
        />
      </div>
    );
  }

  return null;
}
