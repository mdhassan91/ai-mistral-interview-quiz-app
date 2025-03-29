// Example API route (pages/api/test-ollama.js)
export default async function handler(req, res) {
    try {
      const ollamaResponse = await fetch(`${process.env.OLLAMA_URL}/api/tags`);
      const data = await ollamaResponse.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Ollama connection failed!" });
    }
  }