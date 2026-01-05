import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface DeleteResponse {
  success?: boolean
  error?: string
}

const BASE_URL = "http://localhost:3000"

describe("DELETE /api/documents/:id - Delete Document", () => {
  test("deletes unedited document successfully", async () => {
    // Create a document (created_at === updated_at)
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Delete Test", content: "Test content" }),
    })
    const doc = (await createRes.json()) as DocumentResponse
    expect(createRes.status).toBe(201)

    // Delete the document
    const deleteRes = await fetch(`${BASE_URL}/api/documents/${doc.id}`, {
      method: "DELETE",
    })
    expect(deleteRes.status).toBe(200)

    const body = (await deleteRes.json()) as DeleteResponse
    expect(body.success).toBe(true)

    // Verify document no longer exists
    const getRes = await fetch(`${BASE_URL}/api/documents/${doc.id}`)
    expect(getRes.status).toBe(404)
  })

  test("returns 409 when trying to delete edited document", async () => {
    // Create a document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Edit Then Delete", content: "Initial" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Edit the document (updates updated_at)
    await fetch(`${BASE_URL}/api/documents/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Updated content" }),
    })

    // Try to delete - should fail
    const deleteRes = await fetch(`${BASE_URL}/api/documents/${doc.id}`, {
      method: "DELETE",
    })
    expect(deleteRes.status).toBe(409)

    const body = (await deleteRes.json()) as DeleteResponse
    expect(body.error).toBe("Cannot delete edited document")
  })

  test("returns 404 for non-existent document", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000000"
    const res = await fetch(`${BASE_URL}/api/documents/${fakeId}`, {
      method: "DELETE",
    })

    expect(res.status).toBe(404)
  })

  test("returns 400 for invalid UUID", async () => {
    const res = await fetch(`${BASE_URL}/api/documents/invalid-uuid`, {
      method: "DELETE",
    })

    expect(res.status).toBe(400)
  })
})
