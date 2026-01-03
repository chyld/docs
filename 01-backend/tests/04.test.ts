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

describe("PUT /api/documents/:id - Update Document", () => {
  test("updates document title", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Original Title", content: "Original content" }),
    })
    const created = (await createRes.json()) as DocumentResponse

    // Update the title
    const updateRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    })

    expect(updateRes.status).toBe(200)

    const updated = (await updateRes.json()) as DocumentResponse
    expect(updated.id).toBe(created.id)
    expect(updated.title).toBe("Updated Title")
    expect(updated.updated_at).toBeDefined()
  })

  test("updates document content", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Content Test", content: "Initial content" }),
    })
    const created = (await createRes.json()) as DocumentResponse

    // Update the content
    const updateRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "# Updated Content\n\nNew content here." }),
    })

    expect(updateRes.status).toBe(200)

    // Verify content was updated by fetching the document
    const getRes = await fetch(`${BASE_URL}/api/documents/${created.id}`)
    const doc = (await getRes.json()) as DocumentWithContent
    expect(doc.content).toBe("# Updated Content\n\nNew content here.")
  })

  test("updates both title and content", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Both Test", content: "Old content" }),
    })
    const created = (await createRes.json()) as DocumentResponse

    // Update both
    const updateRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title", content: "New content" }),
    })

    expect(updateRes.status).toBe(200)

    const updated = (await updateRes.json()) as DocumentResponse
    expect(updated.title).toBe("New Title")

    // Verify content
    const getRes = await fetch(`${BASE_URL}/api/documents/${created.id}`)
    const doc = (await getRes.json()) as DocumentWithContent
    expect(doc.content).toBe("New content")
  })

  test("returns 404 for non-existent document", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000000"
    const res = await fetch(`${BASE_URL}/api/documents/${fakeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    })

    expect(res.status).toBe(404)
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await fetch(`${BASE_URL}/api/documents/invalid-uuid`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    })

    expect(res.status).toBe(400)
  })
})
