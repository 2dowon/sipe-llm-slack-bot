import { WebClient } from "@slack/web-api";
import { fetchNotionData } from "./notion";
import { getOpenAIResponse } from "./openai";

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

export const handleSlackEvent = async (event: any) => {
  console.log("📩 Incoming Slack Event:", JSON.stringify(event, null, 2));

  if (event && event.type === "app_mention") {
    console.log("✅ Mention received:", event.text);
    const question = event.text;

    try {
      const notionData = await fetchNotionData(question);
      const answer = await getOpenAIResponse(question, notionData);

      await slackClient.chat.postMessage({
        channel: event.channel,
        text: answer,
      });
    } catch (error) {
      console.error("Slack event handling error:", error);
    }
  }
};
