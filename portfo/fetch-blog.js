import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Client } from "@notionhq/client"; 
import { NotionToMarkdown } from "notion-to-md";

dotenv.config();

const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize converter
const notion = new Client({ auth: NOTION_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

async function fetchMarkdown() {
  console.log("⏳ Fetching and converting to Markdown...");

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: { property: "Status", status: { equals: "Published" } }
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const postsDir = path.join(__dirname, "public/posts");
    const dataDir = path.join(__dirname, "src/data");
    
    // Ensure directories exist
    [postsDir, dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const postMetadata = [];

    for (const page of data.results) {
      const title = page.properties.Name?.title[0]?.plain_text || "Untitled";
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const tags = page.properties.Tags?.multi_select?.map(tag => tag.name) || [];
      
      console.log(`Converting: ${title}...`);

      const mdblocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdblocks);

      fs.writeFileSync(path.join(postsDir, `${slug}.md`), mdString.parent);

      postMetadata.push({
        id: page.id,
        title: title,
        slug: slug,
        date: page.properties.Date?.date?.start || "No Date",
        readTime: page.properties.ReadTime?.rich_text[0]?.plain_text || "5 min read",
        description: page.properties.Description?.rich_text[0]?.plain_text || "",
        tags: tags,
        color: ["bg-[#fff06b]", "bg-[#a0c4ff]", "bg-[#ffcccc]"][Math.floor(Math.random() * 3)]
      });
    }

    fs.writeFileSync(
      path.join(dataDir, "blog-posts.json"),
      JSON.stringify(postMetadata, null, 2)
    );
    
    console.log(`✅ Success! Generated ${postMetadata.length} markdown files.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fetchMarkdown();