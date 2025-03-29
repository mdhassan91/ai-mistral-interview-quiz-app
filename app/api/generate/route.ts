import { NextResponse } from 'next/server';

export const runtime = 'edge';

// CORS headers configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, {
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  // Validate environment configuration first
  if (!process.env.CLOUDFLARE_WORKER_URL) {
    console.error('CLOUDFLARE_WORKER_URL is not configured');
    return NextResponse.json(
      { 
        error: "Server configuration error",
        details: "Cloudflare Worker URL is not configured" 
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }

  // Validate request method
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: "Method not allowed" },
      { 
        status: 405,
        headers: CORS_HEADERS 
      }
    );
  }

  // Parse and validate request body
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Invalid request body",
        details: "Expected JSON payload" 
      },
      { 
        status: 400,
        headers: CORS_HEADERS 
      }
    );
  }

  const { topic, difficulty } = requestBody;

  // Validate required fields
  if (!topic || typeof topic !== 'string') {
    return NextResponse.json(
      { 
        error: "Invalid request",
        details: "Topic is required and must be a string" 
      },
      { 
        status: 400,
        headers: CORS_HEADERS 
      }
    );
  }

  // Validate difficulty level
  const validDifficulties = ['easy', 'medium', 'hard'];
  if (!validDifficulties.includes(difficulty)) {
    return NextResponse.json(
      { 
        error: "Invalid difficulty level",
        details: `Difficulty must be one of: ${validDifficulties.join(', ')}` 
      },
      { 
        status: 400,
        headers: CORS_HEADERS 
      }
    );
  }

  try {
    const response = await fetch(process.env.CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, difficulty }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.quiz || !Array.isArray(data.quiz)) {
      throw new Error("Invalid response format from worker");
    }

    return NextResponse.json(data, {
      headers: CORS_HEADERS,
    });

  } catch (error) {
    console.error('Quiz generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: "Failed to generate quiz",
        details: errorMessage 
      },
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}