import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

const BASE_URL = "http://localhost:3000"

describe("POST /api/documents - Create Documents", () => {
  test("creates 3 documents successfully", async () => {
    const documents = [
      { title: "First Document", content: "# First\n\nThis is the first document." },
      { title: "Second Document", content: "# Second\n\nThis is the second document." },
      { title: "Third Document", content: "# Third\n\nThis is the third document." },
    ]

    const createdDocs: DocumentResponse[] = []

    for (const doc of documents) {
      const res = await fetch(`${BASE_URL}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      })

      expect(res.status).toBe(201)

      const body = (await res.json()) as DocumentResponse
      expect(body.id).toBeDefined()
      expect(body.title).toBe(doc.title)
      expect(body.created_at).toBeDefined()
      expect(body.updated_at).toBeDefined()

      createdDocs.push(body)
    }

    // Verify all 3 documents have unique IDs
    const ids = createdDocs.map((d) => d.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(3)

    // Verify IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    for (const id of ids) {
      expect(id).toMatch(uuidRegex)
    }
  })
})
