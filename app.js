import { Hono } from "@hono/hono";
import postgres from "postgres";

const BANNED_WORDS = ["delete", "update", "insert", "drop", "alter", "create"];

const query = async (query) => {
 
  for (const word of BANNED_WORDS) {
    if (query.toLowerCase().includes(word)) {
      throw new Error(`Query contains forbidden word: ${word}`);
    }
  }

 
  const sql = postgres({
    host: Deno.env.get("PGHOST") || "database.cs.aalto.fi",
    port: parseInt(Deno.env.get("PGPORT") || "54321"),
    database: Deno.env.get("PGDATABASE"),
    username: Deno.env.get("PGUSER"),
    password: Deno.env.get("PGPASSWORD"),
    max: 2,
    max_lifetime: 10,
    ssl: { rejectUnauthorized: false } // Needed for Aalto's database
  });

  try {
    const result = await sql.unsafe(query);
    return result;
  } finally {
    await sql.end(); // Close the connection
  }
};

const app = new Hono();

app.get("/", (c) => c.html(`
  <html>
    <body>
      <h1>SQL Query Service</h1>
      <p>POST JSON with {"query": "SELECT..."}</p>
      <p>Current database: ${Deno.env.get("PGDATABASE")}</p>
    </body>
  </html>
`));

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.query) throw new Error("Missing query parameter");
    
    const result = await query(body.query);
    return c.json({ result });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

Deno.serve({
  port: 8000,
  onListen: () => console.log("Server running on http://localhost:8000")
}, app.fetch);
