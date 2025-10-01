```typescript
import { prisma } from "@/lib/db"; // Ensure ./lib/db.ts exports prisma correctly

// Define interface for material data based on Prisma schema
interface MaterialItem {
  id: string; // UUID from Supabase
  sku: string;
  description: string;
  unit: string;
  unitCost: number;
  wastePct: number;
}

// Mark the page as dynamic for server-side rendering
export const dynamic = "force-dynamic";

// Server Action to create a new material entry
async function create(formData: FormData) {
  "use server";
  await prisma.material.create({
    data: {
      sku: String(formData.get("sku") || ""),
      description: String(formData.get("description") || ""),
      unit: String(formData.get("unit") || ""),
      unitCost: Number(formData.get("unitCost") || 0),
      wastePct: Number(formData.get("wastePct") || 0),
    },
  });
}

export default async function MaterialsPage() {
  // Fetch material data with explicit typing
  const items: MaterialItem[] = await prisma.material.findMany({ orderBy: { sku: "asc" } });

  return (
    <div>
      <h2>Materials</h2>
      <form
        action={create}
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}
      >
        <input name="sku" placeholder="SKU" required />
        <input name="description" placeholder="Description" required />
        <input name="unit" placeholder="Unit" required />
        <input name="unitCost" placeholder="Unit Cost" type="number" step="0.01" required />
        <input name="wastePct" placeholder="Waste %" type="number" step="0.01" defaultValue={0.02} />
        <button type="submit">Add</button>
      </form>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Unit Cost</th>
            <th>Waste %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m: MaterialItem) => (
            <tr key={m.id}>
              <td>{m.sku}</td>
              <td>{m.description}</td>
              <td>{m.unit}</td>
              <td>{m.unitCost}</td>
              <td>{m.wastePct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
