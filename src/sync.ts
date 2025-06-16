import { fetchNotionBlocks, groupStructuredBlocks } from "./notion";
import { upsertDocuments } from "./vector";

const printBlocks = (blocks: any[]) => {
  console.log("\n📦 Raw Blocks Structure:");
  console.log("-".repeat(50));
  blocks.forEach((block, i) => {
    console.log(`\n[${i + 1}] Block:`);
    console.log(`  ID: ${block.id}`);
    console.log(`  Type: ${block.type}`);
    console.log(`  Level: ${block.level}`);
    console.log(`  Text: ${block.text}`);
    console.log(`  Parent ID: ${block.parent_id}`);
    console.log(`  Path: ${block.path.join(" > ")}`);
  });
};

const printGroups = (groups: any[]) => {
  console.log("\n🏗️  Grouped Blocks Structure:");
  console.log("-".repeat(50));
  groups.forEach((group, i) => {
    console.log(`\n[${i + 1}] Group:`);
    console.log(`  Group ID: ${group.block_group_id}`);
    console.log(`  Context Path: ${group.context_path.join(" > ")}`);
    console.log(`  Combined Text: ${group.text.slice(0, 100)}...`);
    console.log(`  Block Count: ${group.blocks.length}`);
    console.log("\n  Blocks in Group:");
    group.blocks.forEach((block: any, j: number) => {
      console.log(
        `    [${j + 1}] ${"  ".repeat(block.level - 1)}- (${block.type}) ${
          block.text
        }`,
      );
    });
  });
};

export const syncNotionToVector = async () => {
  try {
    console.log("🔄 Starting sync process...");

    console.log("\n📥 Fetching Notion blocks...");
    const blocks = await fetchNotionBlocks();
    console.log(`✅ Fetched ${blocks.length} blocks`);
    printBlocks(blocks);

    console.log("\n🔨 Grouping blocks...");
    const groups = groupStructuredBlocks(blocks);
    console.log(`✅ Created ${groups.length} groups`);
    printGroups(groups);

    console.log("\n🚀 Uploading to Qdrant...");
    await upsertDocuments(groups);
    console.log("✅ Upload completed successfully");

    return { success: true, message: "Sync completed successfully" };
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return { success: false, message: "Sync failed", error };
  }
};

// 실행 코드 추가
if (require.main === module) {
  syncNotionToVector()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        console.error("Sync failed:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exit(1);
    });
}
