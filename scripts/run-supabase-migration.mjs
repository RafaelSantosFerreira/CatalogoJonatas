import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "itulqdxdpwiditvzsemh";

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN ausente.");
  process.exit(1);
}

let sql = readFileSync(new URL("../app.sql", import.meta.url), "utf8");

// Executa o SQL como está no repositório.
// Credenciais sensíveis devem ser aplicadas via .env.local e endpoints de seed seguros.

const response = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const text = await response.text();
console.log(`STATUS=${response.status}`);
console.log(text.slice(0, 1500));

if (!response.ok) {
  process.exit(1);
}
