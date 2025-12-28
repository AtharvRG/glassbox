// Puter.js LLM helper for client-side usage
interface ChatResponse {
  message?: {
    role: string;
    content: string;
  };
  toString(): string;
}

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<ChatResponse>;
      };
    };
  }
}

export async function callLLM(prompt: string): Promise<string> {
  // Wait for Puter to be available
  if (typeof window === 'undefined') {
    throw new Error('Puter.js can only be used in the browser');
  }

  // Wait for puter to load
  let attempts = 0;
  while (!window.puter && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.puter) {
    throw new Error('Puter.js failed to load');
  }

  const response = await window.puter.ai.chat(prompt, {
    model: 'claude-sonnet-4-5'
  });

  // Puter.js returns: response.message.content = [{ type: "text", text: "..." }]
  const contentArray = (response as any).message?.content;
  if (Array.isArray(contentArray) && contentArray.length > 0 && contentArray[0].text) {
    return contentArray[0].text;
  }
  
  // Fallback
  throw new Error('Unexpected response format from Puter.js');
}

export async function parseJSONResponse(prompt: string): Promise<any> {
  const response = await callLLM(prompt);
  // Clean up any markdown code blocks
  const cleanJson = response.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson);
}
