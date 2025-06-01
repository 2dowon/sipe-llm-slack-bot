import dotenv from "dotenv";
dotenv.config();

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID!;

// 블록에서 텍스트 추출
const extractPlainTextFromBlock = (block: any): string => {
  const type = block.type;
  if (block[type]?.rich_text) {
    return block[type].rich_text.map((rt: any) => rt.plain_text).join("");
  } else if (type === "child_page") {
    return `📄 ${block.child_page.title}`;
  }
  return "";
};

const fetchAllBlocks = async (
  blockId: string,
  indent: number = 0,
): Promise<string[]> => {
  let blocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    blocks = blocks.concat(response.results);
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  const lines: string[] = [];

  for (const block of blocks) {
    const prefix = " ".repeat(indent * 2);
    const text = extractPlainTextFromBlock(block);
    if (text) {
      lines.push(prefix + text);
    }

    if (block.has_children) {
      const childLines = await fetchAllBlocks(block.id, indent + 1);
      lines.push(...childLines);
    }
  }

  return lines;
};

export const fetchNotionData = async (query: string): Promise<string> => {
  const allTexts = await fetchAllBlocks(PAGE_ID);

  const matched = allTexts.filter((text) =>
    text.toLowerCase().includes(query.toLowerCase()),
  );

  return matched.length > 0 ? matched.join("\n") : allTexts.join("\n");
};
