import fs from "fs"
import path from "path"

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  reviewed: string   // falls back to date if not present in frontmatter
  tags: string[]
  content: string
  readingTime: number  // estimated minutes at ~200 wpm
}

const BLOG_DIR = path.join(process.cwd(), "content/blog")

function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, content: raw }
  const meta: Record<string, string | string[]> = {}
  match[1].split("\n").forEach(line => {
    const [key, ...rest] = line.split(": ")
    const val = rest.join(": ").trim()
    if (key && val) {
      if (val.startsWith("[")) {
        meta[key.trim()] = val.slice(1, -1).split(",").map(s => s.trim().replace(/"/g, ""))
      } else {
        meta[key.trim()] = val.replace(/^["']|["']$/g, "")
      }
    }
  })
  return { meta, content: match[2].trim() }
}

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const slug = f.replace(/\.md$/, "")
      const raw = fs.readFileSync(path.join(BLOG_DIR, f), "utf8")
      const { meta, content } = parseFrontmatter(raw)
      const date = (meta.date as string) || ""
      return {
        slug,
        title:       (meta.title as string) || slug,
        description: (meta.description as string) || "",
        date,
        reviewed:    (meta.reviewed as string) || date,
        tags:        (meta.tags as string[]) || [],
        content,
        readingTime: calcReadingTime(content),
      }
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf8")
  const { meta, content } = parseFrontmatter(raw)
  const date = (meta.date as string) || ""
  return {
    slug,
    title:       (meta.title as string) || slug,
    description: (meta.description as string) || "",
    date,
    reviewed:    (meta.reviewed as string) || date,
    tags:        (meta.tags as string[]) || [],
    content,
    readingTime: calcReadingTime(content),
  }
}

export function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])/gm, "")
    .replace(/^([^<].+[^>])$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
}
