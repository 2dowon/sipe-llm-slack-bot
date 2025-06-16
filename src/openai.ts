import dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 사용자 질문과 context 기반 GPT 응답 생성
 */
export const getOpenAIResponse = async (
  question: string,
  context: string,
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `너는 사용자의 질문에 대해 노션 데이터를 기반으로 정확하고 사실에 입각한 답변을 해야 해.`,
      },
      {
        role: "user",
        content: `질문: ${question}\n관련 정보:\n${context}`,
      },
    ],
  });

  return completion.choices[0].message.content || "답변을 생성할 수 없습니다.";
};

/**
 * 여러 개의 텍스트를 OpenAI Embedding으로 변환
 */
export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
};
