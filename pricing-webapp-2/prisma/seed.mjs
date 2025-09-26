import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.config.upsert({ where: { id: 1 }, update: {}, create: {} });

  const roles = [
    { name: "Project Manager", baseRate:95, burdenPct:0.35, otMultiplier:1.5, loadedRate:95*1.35 },
    { name: "Superintendent", baseRate:85, burdenPct:0.35, otMultiplier:1.5, loadedRate:85*1.35 },
    { name: "Foreman", baseRate:70, burdenPct:0.35, otMultiplier:1.5, loadedRate:70*1.35 },
    { name: "Journeyman", baseRate:55, burdenPct:0.35, otMultiplier:1.5, loadedRate:55*1.35 },
    { name: "Apprentice", baseRate:40, burdenPct:0.30, otMultiplier:1.5, loadedRate:40*1.30 },
    { name: "Laborer", baseRate:35, burdenPct:0.30, otMultiplier:1.5, loadedRate:35*1.30 }
  ];
  for (const r of roles) await prisma.role.upsert({ where: { name: r.name }, update: r, create: r });

  const equipment = [
    { type:"Excavator", rateUnit:"hour", rate:145, fuelPerHour:12, maintPerHour:8 },
    { type:"Loader", rateUnit:"hour", rate:120, fuelPerHour:10, maintPerHour:7 },
    { type:"Crane 60T", rateUnit:"hour", rate:350, fuelPerHour:25, maintPerHour:20 },
    { type:"Pickup Truck", rateUnit:"day", rate:120, fuelPerHour:0, maintPerHour:0 },
    { type:"Generator 20kW", rateUnit:"day", rate:45, fuelPerHour:0, maintPerHour:0 },
    { type:"Scissor Lift", rateUnit:"day", rate:90, fuelPerHour:0, maintPerHour:0 }
  ];
  for (const e of equipment) await prisma.equipment.create({ data: e });

  const materials = [
    { sku:"CONC-CY", description:"Concrete (cubic yard)", unit:"CY", unitCost:165, wastePct:0.05 },
    { sku:"REBAR-TON", description:"Rebar (ton)", unit:"TON", unitCost:1050, wastePct:0.03 },
    { sku:"LUM-2x4", description:"Lumber 2x4 (ea)", unit:"EA", unitCost:5.2, wastePct:0.03 },
    { sku:"ELEC-CONDUIT-1in", description:"Electrical Conduit 1\" (ft)", unit:"FT", unitCost:2.1, wastePct:0.02 },
    { sku:"FAST-ANCHOR", description:"Anchor Fasteners (ea)", unit:"EA", unitCost:1.5, wastePct:0.02 },
    { sku:"PIPE-PVC-4in", description:"PVC Pipe 4\" (ft)", unit:"FT", unitCost:3.0, wastePct:0.02 }
  ];
  for (const m of materials) await prisma.material.create({ data: m });

  const rolesAll = await prisma.role.findMany();
  const eqAll = await prisma.equipment.findMany();
  const matAll = await prisma.material.findMany();

  const findRole = (name) => rolesAll.find(r => r.name===name)?.id;
  const findEq = (t) => eqAll.find(e => e.type===t)?.id;
  const findMat = (sku) => matAll.find(m => m.sku===sku)?.id;

  const activities = [
    {
      code:"EXC-001", name:"Excavation", unit:"CY",
      defaultRolesJson: [{roleId: findRole("Foreman"), hoursPerUnit:0.05},{roleId: findRole("Laborer"), hoursPerUnit:0.05}],
      defaultEquipJson: [{equipmentId: findEq("Excavator"), hoursPerUnit:0.20}],
      defaultMaterialsJson: []
    },
    {
      code:"FORM-001", name:"Formwork", unit:"SF",
      defaultRolesJson: [{roleId: findRole("Journeyman"), hoursPerUnit:0.08},{roleId: findRole("Laborer"), hoursPerUnit:0.05}],
      defaultEquipJson: [{equipmentId: findEq("Scissor Lift"), hoursPerUnit:0.02}],
      defaultMaterialsJson: [{materialId: findMat("LUM-2x4"), qtyPerUnit:0.12}]
    },
    {
      code:"REBAR-001", name:"Reinforcing Steel", unit:"TON",
      defaultRolesJson: [{roleId: findRole("Journeyman"), hoursPerUnit:0.40},{roleId: findRole("Laborer"), hoursPerUnit:0.15}],
      defaultEquipJson: [{equipmentId: findEq("Crane 60T"), hoursPerUnit:0.10}],
      defaultMaterialsJson: [{materialId: findMat("REBAR-TON"), qtyPerUnit:1.00}]
    },
    {
      code:"CONC-001", name:"Concrete Placement", unit:"CY",
      defaultRolesJson: [{roleId: findRole("Foreman"), hoursPerUnit:0.05},{roleId: findRole("Laborer"), hoursPerUnit:0.02}],
      defaultEquipJson: [],
      defaultMaterialsJson: [{materialId: findMat("CONC-CY"), qtyPerUnit:1.00}]
    },
    {
      code:"ELEC-001", name:"Conduit Install", unit:"LF",
      defaultRolesJson: [{roleId: findRole("Journeyman"), hoursPerUnit:0.06},{roleId: findRole("Apprentice"), hoursPerUnit:0.05}],
      defaultEquipJson: [{equipmentId: findEq("Scissor Lift"), hoursPerUnit:0.02}],
      defaultMaterialsJson: [{materialId: findMat("ELEC-CONDUIT-1in"), qtyPerUnit:1.00}]
    }
  ];
  for (const a of activities) await prisma.activity.create({ data: a });

  console.log("Seeded!");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
