import dotenv from "dotenv";
dotenv.config();

import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAGE_ID = process.env.NOTION_PAGE_ID!;

export type StructuredBlock = {
  id: string;
  text: string;
  type: string;
  level: number;
  parent_id: string | null;
  path: string[];
};

export type BlockGroup = {
  block_group_id: string;
  context_path: string[];
  text: string;
  blocks: StructuredBlock[];
};

const extractPlainTextFromBlock = (block: BlockObjectResponse): string => {
  const type = block.type as keyof BlockObjectResponse;
  const data: any = (block as any)[type];

  if (data?.rich_text) {
    return data.rich_text.map((rt: any) => rt.plain_text).join("");
  } else if (block.type === "child_page") {
    return `📄 ${(block as any).child_page.title}`;
  } else if (data?.title) {
    return data.title.map((rt: any) => rt.plain_text).join("");
  }
  return "";
};

const parseBlocksToTree = async (
  blockId: string,
  parentId: string | null = null,
  path: string[] = [],
): Promise<StructuredBlock[]> => {
  const nodes: StructuredBlock[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if (!("type" in block)) continue;

      const text = extractPlainTextFromBlock(block).trim();
      if (!text) continue;

      const type = block.type;
      const headingLevel =
        type === "heading_1"
          ? 1
          : type === "heading_2"
          ? 2
          : type === "heading_3"
          ? 3
          : 4;

      const currentPath = [...path, text];
      const node: StructuredBlock = {
        id: block.id,
        text,
        type,
        level: headingLevel,
        parent_id: parentId,
        path: currentPath,
      };

      nodes.push(node);

      if (block.has_children) {
        const children = await parseBlocksToTree(
          block.id,
          block.id,
          currentPath,
        );
        nodes.push(...children);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return nodes;
};

export const groupStructuredBlocks = (
  blocks: StructuredBlock[],
): BlockGroup[] => {
  const groups: BlockGroup[] = [];
  const headingStack: StructuredBlock[] = [];
  let currentGroup: BlockGroup | null = null;

  const closeGroup = () => {
    if (currentGroup) {
      groups.push(currentGroup);
      currentGroup = null;
    }
  };

  for (const block of blocks) {
    const isHeading = block.type.startsWith("heading_");

    if (isHeading) {
      const headingLevel = block.level;

      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= headingLevel
      ) {
        headingStack.pop();
      }

      closeGroup();
      headingStack.push(block);

      currentGroup = {
        block_group_id: block.id,
        context_path: headingStack.map((h) => h.text),
        text: block.text,
        blocks: [block],
      };
    } else if (currentGroup) {
      currentGroup.text += "\n" + block.text;
      currentGroup.blocks.push(block);
    }
  }

  closeGroup();

  return groups;
};

export const fetchNotionBlocks = async (): Promise<StructuredBlock[]> => {
  const blocks = await parseBlocksToTree(PAGE_ID);
  return blocks;
};
