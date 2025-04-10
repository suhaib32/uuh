import { Hono } from "@hono/hono";
import { query } from "./db.js";

const app = new Hono();

app.get("/*", (c) => c.html(`
  <html>
    <body>
      <h1>SQL Query Service</h1>
      <p>POST JSON with {"query": "SELECT..."}</p>
    </body>
  </html>
`));

app.post("/*", async (c) => {
  try {
    const body = await c.req.json();
    const result = await query(body.query);
    return c.json({ result }); 
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

Deno.serve(app.fetch);
