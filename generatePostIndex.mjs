/* 
  This is no longer used, but kept for reference
  This script scans the blogPosts directory for folders, reads metaData.json and content.md files,
  and generates an allPosts.json file with the combined data.
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogPostsDir = path.join(__dirname, "src", "blogPosts");
const outputFile = path.join(blogPostsDir, "allPosts.json");

export function generatePostIndex() {
  console.log("🔍 Scanning blog posts directory...");

  if (!fs.existsSync(blogPostsDir)) {
    console.error(`❌ blogPosts directory not found at ${blogPostsDir}`);
    return;
  }

  const folders = fs
    .readdirSync(blogPostsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const posts = [];

  for (const folder of folders) {
    const folderPath = path.join(blogPostsDir, folder);
    const metaPath = path.join(folderPath, "metaData.json");
    const contentPath = path.join(folderPath, "content.md");

    if (!fs.existsSync(metaPath)) {
      console.warn(`⚠️ Skipping ${folder} (no metaData.json)`);
      continue;
    }

    if (!fs.existsSync(contentPath)) {
      console.warn(`⚠️ Skipping ${folder} (no content.md)`);
      continue;
    }

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const content = fs.readFileSync(contentPath, "utf-8");

      posts.push({
        ...meta,
        folderName: folder,
        content,
      });
    } catch (err) {
      console.error(`❌ Error reading post in ${folder}:`, err);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
  console.log(`✅ Wrote ${posts.length} blog post entries to ${outputFile}`);
}

generatePostIndex();
