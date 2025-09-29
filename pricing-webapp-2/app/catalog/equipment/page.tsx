import { prisma } from "@/lib/db";

// Define interface for equipment data based on Prisma schema
interface EquipmentItem {
  id: string; // Adjust to number if your schema uses numeric IDs
  type: string;
  rateUnit: string;
  rate: number;
  fuelPerHour: number;
  maintPerHour: number;
}

// Mark the page as dynamic for server-side rendering
export const dynamic = "force-dynamic";

// Server Action to create a new equipment entry
async function create(formData: FormData) {
  "use server";
  await prisma.equipment.create({
    data: {
      type: String(formData.get("type") || ""),
      rateUnit: String(formData.get("rateUnit") || "hour"),
      rate: Number(formData.get("rate") || 0),
      fuelPerHour: Number(formData.get("fuelPerHour") || 0),
      maintPerHour: Number(formData.get("maintPerHour") || 0),
    },
  });
}

export default async function EquipmentPage() {
  // Fetch equipment data with explicit typing
  const items: EquipmentItem[] = await prisma.equipment.findMany({ orderBy: { type: "asc" } });

  return (
    <div>
      <h2>Equipment</h2>
      <form
        action={create}
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}
      >
        <input name="type" placeholder="Type" required />
        <input name="rateUnit" placeholder="Unit (hour/day)" defaultValue="hour" />
        <input name="rate" placeholder="Rate" type="number" step="0.01" required />
        <input name="fuelPerHour" placeholder="Fuel/hr" type="number" step="0.01" defaultValue={0} />
        <input name="maintPerHour" placeholder="Maint/hr" type="number" step="0.01" defaultValue={0} />
        <button type="submit">Add</button>
      </form>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Type</th>
            <th>RateUnit</th>
            <th>Rate</th>
            <th>Fuel/hr</th>
            <th>Maint/hr</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e: EquipmentItem) => (
            <tr key={e.id}>
              <td>{e.type}</td>
              <td>{e.rateUnit}</td>
              <td>{e.rate}</td>
              <td>{e.fuelPerHour}</td>
              <td>{e.maintPerHour}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
