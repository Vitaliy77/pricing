import { prisma } from "@/lib/db";
import EstimateBuilder from "@/components/EstimateBuilder";

export const dynamic = "force-dynamic";

export default async function NewEstimatePage() {
  const [activities, roles, equipment, materials, cfg] = await Promise.all([
    prisma.activity.findMany({ orderBy: { code: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.equipment.findMany({ orderBy: { type: "asc" } }),
    prisma.material.findMany({ orderBy: { sku: "asc" } }),
    prisma.config.findUnique({ where: { id: 1 } })
  ]);
  return (
    <div>
      <h2>New Estimate</h2>
      <EstimateBuilder
        activities={activities}
        roles={roles}
        equipment={equipment}
        materials={materials}
        config={cfg!}
      />
    </div>
  );
}
