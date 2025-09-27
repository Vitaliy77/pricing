import { prisma } from "@/lib/db";
import type { Activity } from "@prisma/client";
import type { Activity as ActivityRow } from "@prisma/client";


export const dynamic = "force-dynamic";

type Activity = { code: string; name: string; unit: string };

async function create(formData: FormData) {
  "use server";
  const code = String(formData.get("code")||"");
  const name = String(formData.get("name")||"");
  const unit = String(formData.get("unit")||"");
  const items: Activity[] = await prisma.activity.findMany({ orderBy: { code: "asc" } });
  await prisma.activity.create({ data: { code, name, unit }});
}

export default async function ActivitiesPage() {
  const items = await prisma.activity.findMany({ orderBy: { code: "asc" } });
  return (
    <div>
      <h2>Activities</h2>
      <form action={create} style={{display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:8, marginBottom:16}}>
        <input name="code" placeholder="Code" required />
        <input name="name" placeholder="Name" required />
        <input name="unit" placeholder="Unit" required />
        <button type="submit">Add</button>
      </form>
      <table border={1} cellPadding={6}>
        <thead><tr><th>Code</th><th>Name</th><th>Unit</th></tr></thead>
        <tbody>
          {items.map((a: ActivityRow) => (
  <tr key={a.id}>
    <td>{a.code}</td>
    <td>{a.name}</td>
    <td>{a.unit}</td>
  </tr>
))}



        </tbody>
      </table>
    </div>
  )
}
