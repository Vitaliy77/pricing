import { prisma } from "./db";

type RoleUse = { roleId: number; hoursPerUnit: number };
type EquipUse = { equipmentId: number; hoursPerUnit: number };
type MatUse = { materialId: number; qtyPerUnit: number };

export async function getConfig() {
  const cfg = await prisma.config.findUnique({ where: { id: 1 } });
  if (!cfg) throw new Error("Config missing");
  return cfg;
}

export async function getBenchmarks(activityCode: string) {
  const rows: any[] = await prisma.$queryRawUnsafe(`
    select activity_code, 
           percentile_cont(0.5) within group (order by labor_hrs_per_unit) as labor_median,
           percentile_cont(0.5) within group (order by equip_hrs_per_unit) as equip_median,
           percentile_cont(0.5) within group (order by mat_qty_per_unit)   as mat_median
    from "History"
    where activity_code = $1
    group by activity_code
  `, activityCode);
  return rows[0] ?? null;
}
