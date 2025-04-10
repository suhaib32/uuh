import { Hono } from "@hono/hono";
import postgres from "postgres";


const BANNED_WORDS = [
  "delete", "update", "insert", "drop", "alter", "create",
  "truncate", "replace", "merge", "grant", "revoke",
  "transaction", "commit", "rollback", "savepoint", "lock",
  "execute", "call", "do", "set", "comment"
];


const query = async (queryText) => {
  for (const word of BANNED_WORDS) {
    if (queryText.toLowerCase().includes(word)) {
      throw new Error(`You cannot ${word} data`);
    }
  }

  const sql = postgres({
    host: Deno.env.get("PGHOST") ?? "database.cs.aalto.fi",
    port: +(Deno.env.get("PGPORT") ?? 54321),
    database: Deno.env.get("PGDATABASE") ?? "database7a350a6b",
    username: Deno.env.get("PGUSER") ?? "user7a350a6b",
    password: Deno.env.get("PGPASSWORD") ?? "supersecret",
    max: 2,
    max_lifetime: 10,
  });

  return await sql.unsafe(queryText);
};

const app = new Hono();

app.get("/*", (c) => {
  return c.html(`
    <html>
      <head>
        <title>Hello, world!</title>
      </head>
      <body>
        <h1>Hello, world!</h1>
        <p>Send a POST request with a JSON query to execute it.</p>
        <p>Example: { "query": "SELECT 1 + 1 AS sum" }</p>
      </body>
    </html>
  `);
});

app.post("/*", async (c) => {
  try {
    const body = await c.req.json();
    const result = await query(body.query);
    return c.json({ result });  
  } catch (err) {
    return c.json({ error: err.message }, 400);
  }
});

Deno.serve(app.fetch);
