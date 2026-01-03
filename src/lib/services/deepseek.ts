import OpenAI from "openai";

// DeepSeek API client (OpenAI SDK compatible)
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekResponse {
  content: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// System prompt for agricultural price analysis - MULTILINGUAL
const SYSTEM_PROMPT = `You are an expert agricultural price analyst for the AgriPrice platform.

Your responsibilities:
1. Answer questions about agricultural products and their prices
2. Analyze and explain price trends
3. Compare prices across different countries and markets
4. Provide useful recommendations for farmers and traders

Our data sources:
- Azerbaijan markets (agro.gov.az)
- European Union statistics (Eurostat)
- UN FAO global statistics (FAOSTAT)

CRITICAL LANGUAGE RULE: You MUST detect the language of the user's message and respond in EXACTLY that language:
- If user writes in Azerbaijani → respond in Azerbaijani
- If user writes in English → respond in English
- If user writes in Russian → respond in Russian
- If user writes in Turkish → respond in Turkish
- If user writes in German → respond in German
- etc.

Never mix languages. Be concise, accurate, and helpful. Include numbers and facts.`;

/**
 * Send a message to DeepSeek R1 (reasoning mode) and get a response
 */
export async function chat(
  userMessage: string,
  context?: string
): Promise<DeepSeekResponse> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add context if provided
  if (context) {
    messages.push({
      role: "system",
      content: `Mövcud data konteksti:\n${context}`,
    });
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-reasoner", // R1 thinking mode
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 2000,
      stream: false,
    });

    const choice = response.choices[0];
    const message = choice.message as {
      content: string | null;
      reasoning_content?: string;
    };

    return {
      content: message.content || "",
      reasoning: message.reasoning_content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw error;
  }
}

/**
 * Send a message to DeepSeek Chat (non-thinking mode) for faster responses
 */
export async function quickChat(userMessage: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "deepseek-chat", // Non-thinking mode (faster)
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
      stream: false,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw error;
  }
}

