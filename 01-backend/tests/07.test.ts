import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  color: string
  created_at: string
  updated_at: string
}

const BASE_URL = "http://localhost:3000"

describe("Color metadata", () => {
  test("creates document with custom color", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Colored Doc", content: "Test", color: "ff5733" }),
    })

    expect(res.status).toBe(201)

    const doc = (await res.json()) as DocumentResponse
    expect(doc.color).toBe("ff5733")
  })

  test("creates document with default color when not provided", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Default Color Doc", content: "Test" }),
    })

    expect(res.status).toBe(201)

    const doc = (await res.json()) as DocumentResponse
    expect(doc.color).toBe("ffffff")
  })

  test("updates document color", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Update Color Test", content: "Test" }),
    })
    const created = (await createRes.json()) as DocumentResponse
    expect(created.color).toBe("ffffff")

    // Update the color
    const updateRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color: "00ff00" }),
    })

    expect(updateRes.status).toBe(200)

    const updated = (await updateRes.json()) as DocumentResponse
    expect(updated.color).toBe("00ff00")
  })

  test("returns 400 for invalid hex color on create", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bad Color", content: "Test", color: "invalid" }),
    })

    expect(res.status).toBe(400)
  })

  test("returns 400 for invalid hex color on update", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Invalid Update Test", content: "Test" }),
    })
    const created = (await createRes.json()) as DocumentResponse

    // Try to update with invalid color
    const updateRes = await fetch(`${BASE_URL}/api/documents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color: "gggggg" }),
    })

    expect(updateRes.status).toBe(400)
  })

  test("returns 400 for color with wrong length", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Short Color", content: "Test", color: "fff" }),
    })

    expect(res.status).toBe(400)
  })
})
