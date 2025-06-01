import dotenv from "dotenv";
dotenv.config();

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID!;

export const fetchNotionData = async (query: string): Promise<string> => {
  const blocks = await notion.blocks.children.list({
    block_id: PAGE_ID,
    page_size: 50,
  });

  const contents = blocks.results
    .map((block: any) => {
      if (block.type === "paragraph") {
        return block.paragraph.rich_text
          .map((rt: any) => rt.plain_text)
          .join("");
      } else if (
        block.type === "heading_1" ||
        block.type === "heading_2" ||
        block.type === "heading_3"
      ) {
        return block[block.type].rich_text
          .map((rt: any) => rt.plain_text)
          .join("");
      } else if (
        block.type === "bulleted_list_item" ||
        block.type === "numbered_list_item"
      ) {
        return block[block.type].rich_text
          .map((rt: any) => rt.plain_text)
          .join("");
      }
      return ""; // 기타 블록 무시
    })
    .filter(Boolean)
    .join("\n");

  return contents;
};
