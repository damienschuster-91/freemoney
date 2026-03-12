import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const BLOG_DIR = path.join(process.cwd(), "content/blog")

export async function POST(req: NextRequest) {
  const { slug, title, description, date, tags, content } = await req.json()
  if (!slug || !title) return NextResponse.json({ error: "missing slug or title" }, { status: 400 })

  const fm = [
    `---`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${(description || title).replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]`,
    `---`,
    ``,
    content || "",
  ].join("\n")

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true })
  fs.writeFileSync(path.join(BLOG_DIR, `${slug}.md`), fm, "utf8")
  return NextResponse.json({ ok: true, slug })
}

export async function DELETE(req: NextRequest) {
  const { slug } = await req.json()
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  return NextResponse.json({ ok: true })
}
