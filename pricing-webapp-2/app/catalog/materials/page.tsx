import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const items = await prisma.material.findMany({ orderBy: { sku: "asc" } });

  return (
    <div>
      <h2>Materials</h2>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Price / Unit</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m: any) => (
            <tr key={m.id}>
              <td>{m.sku}</td>
              <td>{m.description}</td>
              <td>{m.unit}</td>
              <td>{m.pricePerUnit ?? m.price_per_unit ?? m.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
