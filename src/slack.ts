import { WebClient } from "@slack/web-api";
import { getOpenAIResponse } from "./openai";
import { searchSimilarDocuments } from "./vector";

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export const handleSlackEvent = async (event: any) => {
  console.log("📩 Incoming Slack Event:", JSON.stringify(event, null, 2));

  if (event && event.type === "app_mention") {
    const question = event.text;

    try {
      const relatedGroups = await searchSimilarDocuments(question);

      const context = relatedGroups
        .map((group: any) => {
          const header = `Context: ${group.payload.context_path.join(" > ")}`;
          const body = `Content:\n${group.payload.text.trim()}`;
          return `${header}\n\n${body}`;
        })
        .join("\n\n---\n\n");

      const answer = await getOpenAIResponse(question, context);

      await slackClient.chat.postMessage({
        channel: event.channel,
        text: answer,
      });
    } catch (error) {
      console.error("Slack event handling error:", error);
      await slackClient.chat.postMessage({
        channel: event.channel,
        text: "⚠️ 질문 처리 중 오류가 발생했습니다.",
      });
    }
  }
};
