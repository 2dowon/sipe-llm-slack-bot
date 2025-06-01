import dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getOpenAIResponse = async (
  question: string,
  context: string,
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "너는 노션의 데이터를 참고해서 답변하는 친절한 슬랙 챗봇이야.",
      },
      { role: "user", content: `질문: ${question}\n관련 정보: ${context}` },
    ],
  });

  return completion.choices[0].message.content || "답변을 생성할 수 없습니다.";
};
