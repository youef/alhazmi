import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: { uploads: { access: "private" } },
  functions: {
    diwanapi: { name: "Diwan Alhazmi secure services API", source: "backend/neon/api.js" },
    diwanfiles: { name: "Diwan Alhazmi private documents", source: "backend/neon/uploads.js" },
    diwanmembers: { name: "Diwan Alhazmi members portal", source: "backend/neon/members.js" }
  }
});
