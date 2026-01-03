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

interface AttachmentInfo {
  filename: string
  size: number
  type: string
}

const BASE_URL = "http://localhost:3000"

describe("POST /api/documents/:id/attachments - Upload Attachment", () => {
  test("uploads a text file attachment", async () => {
    // Create a document first
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Attachment Test", content: "Test doc" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    // Upload a text file
    const fileContent = "Hello, this is a test file."
    const file = new File([fileContent], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)

    const uploadRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData,
    })

    expect(uploadRes.status).toBe(201)

    const attachment = (await uploadRes.json()) as AttachmentInfo
    expect(attachment.filename).toMatch(/^[0-9a-f-]+\.txt$/i)
    expect(attachment.size).toBe(fileContent.length)
    expect(attachment.type).toStartWith("text/plain")
  })

  test("uploads multiple attachments to same document", async () => {
    // Create a document
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Multi Attachment Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    // Upload first file
    const file1 = new File(["File 1 content"], "file1.txt", { type: "text/plain" })
    const formData1 = new FormData()
    formData1.append("file", file1)

    const res1 = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData1,
    })
    expect(res1.status).toBe(201)

    // Upload second file
    const file2 = new File(["File 2 content"], "file2.md", { type: "text/markdown" })
    const formData2 = new FormData()
    formData2.append("file", file2)

    const res2 = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData2,
    })
    expect(res2.status).toBe(201)

    // Verify both attachments appear in document
    const getRes = await fetch(`${BASE_URL}/api/documents/${doc.id}`)
    const fullDoc = (await getRes.json()) as DocumentWithContent
    expect(fullDoc.attachments.length).toBe(2)
  })

  test("preserves file extension in UUID filename", async () => {
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Extension Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    const file = new File(["image data"], "photo.jpg", { type: "image/jpeg" })
    const formData = new FormData()
    formData.append("file", file)

    const uploadRes = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData,
    })

    const attachment = (await uploadRes.json()) as AttachmentInfo
    expect(attachment.filename).toEndWith(".jpg")
  })

  test("returns 404 for non-existent document", async () => {
    const fakeId = "00000000-0000-4000-8000-000000000000"
    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${BASE_URL}/api/documents/${fakeId}/attachments`, {
      method: "POST",
      body: formData,
    })

    expect(res.status).toBe(404)
  })

  test("returns 400 for invalid UUID", async () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${BASE_URL}/api/documents/invalid-uuid/attachments`, {
      method: "POST",
      body: formData,
    })

    expect(res.status).toBe(400)
  })

  test("returns 400 when no file provided", async () => {
    const createRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "No File Test", content: "" }),
    })
    const doc = (await createRes.json()) as DocumentResponse

    const formData = new FormData()
    // Not appending any file

    const res = await fetch(`${BASE_URL}/api/documents/${doc.id}/attachments`, {
      method: "POST",
      body: formData,
    })

    expect(res.status).toBe(400)
  })
})
