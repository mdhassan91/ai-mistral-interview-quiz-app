import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { topic, difficulty } = await req.json();

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: "Missing topic or difficulty parameter" },
        { status: 400 }
      );
    }

    const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11436";
    const questionCount = 5;

    const prompt = `<s>[INST] <<SYS>>
    Generate a ${questionCount}-question multiple-choice quiz on "${topic}". Use this strict JSON format:
    {
      "quiz": [
        {
          "question": "MCQ question?",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Correct option"
        }
      ]
    }
    Rules:
    1. Only MCQs (no coding questions)
    2. Strict JSON format only (no markdown, explanations, or extra text)
    <</SYS>>[/INST]`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral:7b-instruct-q4_K_M",
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
          num_ctx: 2048,
          stop: ["</s>"],
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${await response.text()}`);
    }

    const data = await response.json();
    const rawResponse = data.response.trim();

    // Extract only valid JSON part
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const jsonStr = rawResponse.slice(jsonStart, jsonEnd);

    const quiz = JSON.parse(jsonStr);

    if (!quiz?.quiz || !Array.isArray(quiz.quiz)) {
      throw new Error("Invalid quiz format received from AI response");
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Quiz generation failed:", error);

    return NextResponse.json(
      {
        quiz: [],
        error: "Failed to generate quiz",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
