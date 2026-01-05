import {
  createDocument,
  deleteDocument,
  getAllDocuments,
  getAttachment,
  getDocument,
  updateDocument,
  uploadAttachment,
} from "./src/handlers";

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  routes: {
    "/api/documents": {
      GET: getAllDocuments,
      POST: createDocument,
    },
    "/api/documents/:id": {
      GET: getDocument,
      PUT: updateDocument,
      DELETE: deleteDocument,
    },
    "/api/documents/:id/attachments": {
      POST: uploadAttachment,
    },
    "/api/documents/:id/attachments/:filename": {
      GET: getAttachment,
    },
  },
  fetch() {
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
