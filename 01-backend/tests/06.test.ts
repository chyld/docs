import { describe, test, expect } from "bun:test"

interface DocumentResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface AttachmentInfo {
  filename: string
  size: number
  type: string
}

const BASE_URL = "http://localhost:3000"

describe("GET /api/documents/:id/attachments/:filename - Get Attachment", () => {
  test("downloads an uploaded attachment", async () => {
    // Create a document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Download Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    // Upload a file
    const fileContent = "This is the file content to download."
    const file = new File([fileContent], "download.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)

    const uploadRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData,
    })
    const attachment = (await uploadRes.json()) as AttachmentInfo

    // Download the file
    const getRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments/${attachment.filename}`)

    expect(getRes.status).toBe(200)

    const downloadedContent = await getRes.text()
    expect(downloadedContent).toBe(fileContent)
  })

  test("downloads binary file correctly", async () => {
    // Create a document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Binary Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    // Upload binary data (simulated image)
    const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const file = new File([binaryData], "image.png", { type: "image/png" })
    const formData = new FormData()
    formData.append("file", file)

    const uploadRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData,
    })
    const attachment = (await uploadRes.json()) as AttachmentInfo

    // Download the file
    const getRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments/${attachment.filename}`)

    expect(getRes.status).toBe(200)

    const downloadedData = new Uint8Array(await getRes.arrayBuffer())
    expect(downloadedData).toEqual(binaryData)
  })

  test("returns 404 for non-existent document", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000000"
    const res = await fetch(`${BASE_URL}/api/documents/${fakeId}/attachments/somefile.txt`)

    expect(res.status).toBe(404)
  })

  test("returns 404 for non-existent attachment", async () => {
    // Create a document without attachments
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "No Attachments", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    const res = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments/nonexistent.txt`)

    expect(res.status).toBe(404)
  })

  test("returns 400 for invalid document UUID", async () => {
    const res = await fetch(`${BASE_URL}/api/documents/invalid-uuid/attachments/file.txt`)

    expect(res.status).toBe(400)
  })

  test("returns 400 for path traversal attempt", async () => {
    // Create a document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Security Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    const res = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments/..%2F..%2Fetc%2Fpasswd`)

    expect(res.status).toBe(400)
  })
})
