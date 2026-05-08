const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "itulqdxdpwiditvzsemh";

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN ausente.");
  process.exit(1);
}

const query = `
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'products','product_colors','product_sizes','product_volumes',
    'customers','cart_items','orders','order_items',
    'company_settings','whatsapp_logs','profiles','user_roles'
  )
order by table_name;
`;

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const text = await res.text();
console.log(`STATUS=${res.status}`);
console.log(text);

if (!res.ok) process.exit(1);
