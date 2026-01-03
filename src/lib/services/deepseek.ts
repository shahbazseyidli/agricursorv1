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

// System prompt for agricultural price analysis
const SYSTEM_PROMPT = `Sən Azərbaycan kənd təsərrüfatı qiymət analizi mütəxəssisisən. AgriPrice platformasının AI köməkçisisən.

Sənin vəzifələrin:
1. İstifadəçilərin kənd təsərrüfatı məhsulları haqqında suallarına cavab vermək
2. Qiymət trendlərini analiz etmək və izah etmək
3. Müxtəlif ölkələr və bazarlar arasında müqayisələr aparmaq
4. Fermer və tacirlərə faydalı tövsiyələr vermək

Data mənbələrimiz:
- Azərbaycan bazarları (agro.gov.az)
- Avropa İttifaqı statistikası (Eurostat)
- BMT FAO qlobal statistikası (FAOSTAT)

Cavablarını Azərbaycan dilində ver. Qısa, dəqiq və faydalı ol. Rəqəmləri və faktları göstər.`;

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
      max_tokens: 800,
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
      max_tokens: 800,
      stream: false,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    throw error;
  }
}

