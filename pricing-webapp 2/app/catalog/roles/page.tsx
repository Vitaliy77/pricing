import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

async function create(formData: FormData) {
  "use server";
  const baseRate = Number(formData.get("baseRate") || 0);
  const burdenPct = Number(formData.get("burdenPct") || 0);
  await prisma.role.create({
    data: {
      name: String(formData.get("name")||""),
      baseRate,
      burdenPct,
      otMultiplier: Number(formData.get("otMultiplier") || 1.5),
      loadedRate: baseRate*(1+burdenPct)
    }
  });
}

export default async function RolesPage() {
  const items = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h2>Roles</h2>
      <form action={create} style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:8, marginBottom:16}}>
        <input name="name" placeholder="Role Name" required />
        <input name="baseRate" placeholder="Base Rate" type="number" step="0.01" required />
        <input name="burdenPct" placeholder="Burden %" type="number" step="0.01" defaultValue={0.35} />
        <input name="otMultiplier" placeholder="OT x" type="number" step="0.1" defaultValue={1.5} />
        <button type="submit">Add</button>
      </form>
      <table border={1} cellPadding={6}>
        <thead><tr><th>Name</th><th>Base</th><th>Burden%</th><th>Loaded</th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id}><td>{r.name}</td><td>{r.baseRate}</td><td>{r.burdenPct}</td><td>{r.loadedRate.toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
