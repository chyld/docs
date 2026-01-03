import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface DocumentWithContent extends DocumentResponse {
  content: string
  attachments: string[]
}

const BASE_URL = "http://localhost:3000"

describe("GET /api/documents/:id - Get Single Document", () => {
  test("retrieves a document by ID with content", async () => {
    // First, create a document
    const newDoc = {
      title: "Test Document for GET",
      content: "# Hello World\n\nThis is test content.",
    }

    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDoc),
    })

    expect(createRes.status).toBe(201)
    const created = (await createRes.json()) as DocumentResponse

    // Now fetch the document by ID
    const getRes = await fetch(`${BASE_URL}/api/documents/${created.id}`)

    expect(getRes.status).toBe(200)

    const doc = (await getRes.json()) as DocumentWithContent
    expect(doc.id).toBe(created.id)
    expect(doc.title).toBe(newDoc.title)
    expect(doc.content).toBe(newDoc.content)
    expect(doc.created_at).toBeDefined()
    expect(doc.updated_at).toBeDefined()
    expect(doc.attachments).toBeInstanceOf(Array)
  })

  test("returns 404 for non-existent document", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000000"
    const res = await fetch(`${BASE_URL}/api/documents/${fakeId}`)

    expect(res.status).toBe(404)
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await fetch(`${BASE_URL}/api/documents/not-a-valid-uuid`)

    expect(res.status).toBe(400)
  })
})
