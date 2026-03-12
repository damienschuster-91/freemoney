import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO || "damienschuster-91/freemoney"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main"
const BLOG_DIR = path.join(process.cwd(), "content/blog")

function buildFrontmatter(title: string, description: string, date: string, tags: string[], content: string) {
  return [
    `---`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${(description || title).replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `tags: [${(tags || []).map((t: string) => `"${t}"`).join(", ")}]`,
    `---`,
    ``,
    content || "",
  ].join("\n")
}

async function githubPut(filePath: string, content: string, message: string) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  }

  // Get existing SHA if file exists (required for updates)
  let sha: string | undefined
  const check = await fetch(`${url}?ref=${GITHUB_BRANCH}`, { headers })
  if (check.ok) sha = (await check.json()).sha

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error((await res.json()).message)
}

async function githubDelete(filePath: string, message: string) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  }

  const check = await fetch(`${url}?ref=${GITHUB_BRANCH}`, { headers })
  if (!check.ok) return // already gone
  const { sha } = await check.json()

  await fetch(url, {
    method: "DELETE",
    headers,
    body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
  })
}

export async function POST(req: NextRequest) {
  const { slug, title, description, date, tags, content } = await req.json()
  if (!slug || !title) return NextResponse.json({ error: "missing slug or title" }, { status: 400 })

  const fm = buildFrontmatter(title, description, date, tags, content)
  const filePath = `content/blog/${slug}.md`

  try {
    if (GITHUB_TOKEN) {
      await githubPut(filePath, fm, `cms: publish "${title}"`)
    } else {
      // Local dev fallback
      if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true })
      fs.writeFileSync(path.join(BLOG_DIR, `${slug}.md`), fm, "utf8")
    }
    return NextResponse.json({ ok: true, slug })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { slug } = await req.json()
  const filePath = `content/blog/${slug}.md`

  try {
    if (GITHUB_TOKEN) {
      await githubDelete(filePath, `cms: unpublish "${slug}"`)
    } else {
      const localPath = path.join(BLOG_DIR, `${slug}.md`)
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath)
    }
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
