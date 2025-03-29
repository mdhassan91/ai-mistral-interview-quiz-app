"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Define the structure of a quiz question
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string; // Added explanation field
}

// Ensure userAnswers is indexed correctly
type UserAnswers = Record<number, string>;

export default function QuizApp() {
  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchQuiz = async () => {
    setShowResults(false);
    setLoading(true);
    setQuiz(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!res.ok) throw new Error("Failed to fetch quiz");

      const data = await res.json();
      setQuiz(data.quiz || []);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setQuiz([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [index]: answer }));
  };

  const checkAnswers = () => {
    if (!quiz) return;
    let correctCount = 0;

    quiz.forEach((q, index) => {
      if (userAnswers[index]?.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <motion.div
        className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold mb-4">Prepare for Interview With Help of AI</h1>
        <Input
          placeholder="Enter quiz topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded-lg my-3"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <Button onClick={fetchQuiz} className="w-full" disabled={loading}>
          {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : "Generate Quiz"}
        </Button>
      </motion.div>

      {loading && (
        <motion.div
          className="mt-6 text-lg font-semibold text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Generating your quiz... ⏳
        </motion.div>
      )}

      {quiz && !loading && quiz.length > 0 && (
        <motion.div
          className="mt-6 w-full max-w-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {quiz.map((q, index) => (
            <Card key={index} className="my-4">
              <CardContent>
                <p className="font-semibold mb-2">{q.question}</p>
                {q.options.map((opt) => (
                  <label key={opt} className="block my-1 flex items-center gap-2">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={opt}
                      onChange={() => handleAnswerChange(index, opt)}
                      disabled={showResults}
                    />
                    {opt}
                  </label>
                ))}
                {showResults && (
                  <div className="mt-3 space-y-2">
                    <p
                      className={`font-bold ${
                        userAnswers[index]?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {userAnswers[index]?.trim().toLowerCase() === q.answer.trim().toLowerCase()
                        ? "✅ Correct"
                        : `❌ Correct Answer: ${q.answer}`}
                    </p>
                    {q.explanation && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Explanation:</span> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button onClick={checkAnswers} className="w-full" disabled={showResults}>
            Check Answers
          </Button>
          {showResults && (
            <p className="mt-4 font-bold text-lg">🎯 You scored {score} / {quiz.length}!</p>
          )}
        </motion.div>
      )}
    </div>
  );
}