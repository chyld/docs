import { describe, test, expect, beforeEach } from "bun:test"
import { Database } from "bun:sqlite"
import { rm, readdir } from "fs/promises"
import { join } from "path"

const cleanDatabase = async () => {
  const db = new Database("db/docs.db", { strict: true })
  db.run("DELETE FROM documents")
  db.close()

  const docsDir = "docs"
  const entries = await readdir(docsDir).catch(() => [])
  await Promise.all(entries.map((entry) => rm(join(docsDir, entry), { recursive: true, force: true })))
}

interface DocumentResponse {
  id: string
  title: string
  pinned: number
  created_at: string
  updated_at: string
}

interface DocumentListResponse {
  data: DocumentResponse[]
  pagination: { limit: number; offset: number; total: number }
}

const BASE_URL = "http://localhost:3000"

// SQLite datetime('now') has second-level precision, so we need 1+ second between creates
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("Document pinning", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  test("creates document with pinned: true", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pinned Doc", content: "Test", pinned: true }),
    })

    expect(res.status).toBe(201)

    const doc = (await res.json()) as DocumentResponse
    expect(doc.pinned).toBe(1)
  })

  test("creates document unpinned by default", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Regular Doc", content: "Test" }),
    })

    expect(res.status).toBe(201)

    const doc = (await res.json()) as DocumentResponse
    expect(doc.pinned).toBe(0)
  })

  test("updates document to toggle pinned status", async () => {
    // Create unpinned document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Toggle Pin Test", content: "Test" }),
    })
    const created = (await createRes.json()) as DocumentResponse
    expect(created.pinned).toBe(0)

    // Pin the document
    const pinRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: true }),
    })
    expect(pinRes.status).toBe(200)

    const pinned = (await pinRes.json()) as DocumentResponse
    expect(pinned.pinned).toBe(1)

    // Unpin the document
    const unpinRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: false }),
    })
    expect(unpinRes.status).toBe(200)

    const unpinned = (await unpinRes.json()) as DocumentResponse
    expect(unpinned.pinned).toBe(0)
  })

  test("pinned documents appear first in list", async () => {
    // Create unpinned document first
    const doc1Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unpinned Doc", content: "First created" }),
    })
    const doc1 = (await doc1Res.json()) as DocumentResponse

    await sleep(1100)

    // Create another unpinned document (will be at top by updated_at)
    const doc2Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Another Unpinned", content: "Second created" }),
    })
    const doc2 = (await doc2Res.json()) as DocumentResponse

    // Pin the first (older) document
    await fetch(`${BASE_URL}/api/documents/${doc1.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: true }),
    })

    // Get list - pinned doc should be first even though it's older
    const listRes = await fetch(`${BASE_URL}/api/documents`)
    const list = (await listRes.json()) as DocumentListResponse

    expect(list.data[0]?.id).toBe(doc1.id)
    expect(list.data[0]?.pinned).toBe(1)
    expect(list.data[1]?.id).toBe(doc2.id)
    expect(list.data[1]?.pinned).toBe(0)
  })

  test("pinned documents sorted by updated_at among themselves", async () => {
    // Create 3 pinned documents with delays
    const docARes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pinned A (oldest)", content: "A", pinned: true }),
    })
    const docA = (await docARes.json()) as DocumentResponse

    await sleep(1100)

    const docBRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pinned B (middle)", content: "B", pinned: true }),
    })
    const docB = (await docBRes.json()) as DocumentResponse

    await sleep(1100)

    const docCRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pinned C (newest)", content: "C", pinned: true }),
    })
    const docC = (await docCRes.json()) as DocumentResponse

    // Get list - pinned docs should be sorted by updated_at DESC
    const listRes = await fetch(`${BASE_URL}/api/documents`)
    const list = (await listRes.json()) as DocumentListResponse

    expect(list.data[0]?.id).toBe(docC.id) // newest first
    expect(list.data[1]?.id).toBe(docB.id) // middle
    expect(list.data[2]?.id).toBe(docA.id) // oldest last
  })

  test("unpinned documents sorted by updated_at after pinned ones", async () => {
    // Create unpinned documents
    const unpinned1Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unpinned 1 (oldest)", content: "U1" }),
    })
    const unpinned1 = (await unpinned1Res.json()) as DocumentResponse

    await sleep(1100)

    const unpinned2Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unpinned 2 (newest)", content: "U2" }),
    })
    const unpinned2 = (await unpinned2Res.json()) as DocumentResponse

    await sleep(1100)

    // Create a pinned document (created last but should appear first)
    const pinnedRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pinned", content: "P", pinned: true }),
    })
    const pinned = (await pinnedRes.json()) as DocumentResponse

    // Get list
    const listRes = await fetch(`${BASE_URL}/api/documents`)
    const list = (await listRes.json()) as DocumentListResponse

    // Pinned first, then unpinned sorted by updated_at DESC
    expect(list.data[0]?.id).toBe(pinned.id)
    expect(list.data[0]?.pinned).toBe(1)
    expect(list.data[1]?.id).toBe(unpinned2.id)
    expect(list.data[1]?.pinned).toBe(0)
    expect(list.data[2]?.id).toBe(unpinned1.id)
    expect(list.data[2]?.pinned).toBe(0)
  })
})
