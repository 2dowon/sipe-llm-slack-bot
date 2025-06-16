import { QdrantClient } from "@qdrant/js-client-rest";
import { BlockGroup } from "./notion";
import { getEmbeddings } from "./openai";

const COLLECTION_NAME = "notion_blocks";
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

export const upsertDocuments = async (groups: BlockGroup[]) => {
  try {
    await qdrant.getCollection(COLLECTION_NAME);
  } catch {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 1536,
        distance: "Cosine",
      },
    });
  }

  const texts = groups.map(
    (g) =>
      `Context: ${g.context_path.join(" > ")}\n\nContent:\n${g.text.trim()}`,
  );

  const vectors = await getEmbeddings(texts);

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: groups.map((group, i) => ({
      id: group.block_group_id,
      vector: vectors[i],
      payload: {
        text: group.text,
        context_path: group.context_path,
        block_group_id: group.block_group_id,
        full_text: texts[i],
      },
    })),
  });
};

export const searchSimilarDocuments = async (query: string, topK = 4) => {
  const [embedding] = await getEmbeddings([query]);

  const result = await qdrant.search(COLLECTION_NAME, {
    vector: embedding,
    limit: topK,
    with_payload: true,
  });

  return result;
};
