import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface DocumentWithNavigation extends DocumentResponse {
  content: string
  attachments: string[]
  prev_id: string | null
  next_id: string | null
}

const BASE_URL = "http://localhost:3000"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("Previous/Next navigation", () => {
  test("returns prev_id and next_id fields", async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nav Test Doc", content: "Test" }),
    })
    const doc = (await res.json()) as DocumentResponse

    const getRes = await fetch(`${BASE_URL}/api/documents/${doc.id}`)
    const fullDoc = (await getRes.json()) as DocumentWithNavigation

    expect(fullDoc).toHaveProperty("prev_id")
    expect(fullDoc).toHaveProperty("next_id")
  })

  test("navigates correctly through multiple documents", async () => {
    // Create 3 documents with slight delays to ensure different updated_at times
    const doc1Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nav Doc 1 (oldest)", content: "First" }),
    })
    const doc1 = (await doc1Res.json()) as DocumentResponse

    await sleep(50)

    const doc2Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nav Doc 2 (middle)", content: "Second" }),
    })
    const doc2 = (await doc2Res.json()) as DocumentResponse

    await sleep(50)

    const doc3Res = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nav Doc 3 (newest)", content: "Third" }),
    })
    const doc3 = (await doc3Res.json()) as DocumentResponse

    // List order is by updated_at DESC: doc3 -> doc2 -> doc1
    // So: doc3.prev = null, doc3.next = doc2
    //     doc2.prev = doc3, doc2.next = doc1
    //     doc1.prev = doc2, doc1.next = null (or could be an older doc)

    // Get doc3 (newest - first in list)
    const get3 = await fetch(`${BASE_URL}/api/documents/${doc3.id}`)
    const full3 = (await get3.json()) as DocumentWithNavigation
    expect(full3.prev_id).toBeNull() // No document before the newest
    expect(full3.next_id).toBe(doc2.id) // Next is doc2

    // Get doc2 (middle)
    const get2 = await fetch(`${BASE_URL}/api/documents/${doc2.id}`)
    const full2 = (await get2.json()) as DocumentWithNavigation
    expect(full2.prev_id).toBe(doc3.id) // Previous is doc3
    expect(full2.next_id).toBe(doc1.id) // Next is doc1

    // Get doc1 (oldest of these 3)
    const get1 = await fetch(`${BASE_URL}/api/documents/${doc1.id}`)
    const full1 = (await get1.json()) as DocumentWithNavigation
    expect(full1.prev_id).toBe(doc2.id) // Previous is doc2
    // next_id might be null or another older doc from previous tests
  })

  test("updating a document changes its position in navigation", async () => {
    // Create 2 documents
    const docARes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Update Nav A", content: "A" }),
    })
    const docA = (await docARes.json()) as DocumentResponse

    await sleep(50)

    const docBRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Update Nav B", content: "B" }),
    })
    const docB = (await docBRes.json()) as DocumentResponse

    // Initially: docB (newer) -> docA (older)
    // docB should have no prev, docA should have prev = docB
    const getB1 = await fetch(`${BASE_URL}/api/documents/${docB.id}`)
    const fullB1 = (await getB1.json()) as DocumentWithNavigation
    expect(fullB1.next_id).toBe(docA.id)

    await sleep(50)

    // Update docA to make it newer
    await fetch(`${BASE_URL}/api/documents/${docA.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "A updated" }),
    })

    // Now: docA (newer) -> docB (older)
    const getA2 = await fetch(`${BASE_URL}/api/documents/${docA.id}`)
    const fullA2 = (await getA2.json()) as DocumentWithNavigation
    expect(fullA2.next_id).toBe(docB.id)

    const getB2 = await fetch(`${BASE_URL}/api/documents/${docB.id}`)
    const fullB2 = (await getB2.json()) as DocumentWithNavigation
    expect(fullB2.prev_id).toBe(docA.id)
  })
})
