"use client";
import { useEffect, useMemo, useState } from "react";
type IdName = { id: number; name?: string; sku?: string; type?: string; unit?: string; description?: string; loadedRate?: number; rate?: number; unitCost?: number; wastePct?: number };
type Activity = { id: number; code: string; name: string; unit: string; defaultRolesJson?: any; defaultEquipJson?: any; defaultMaterialsJson?: any };
type Config = { gnaPct:number; fieldOhPerDay:number; contingencyPct:number; salesTaxMatPct:number; profitMarginPct:number; varianceAlertPct:number };
type RoleUse = { roleId: number; hoursPerUnit: number };
type EquipUse = { equipmentId: number; hoursPerUnit: number };
type MatUse = { materialId: number; qtyPerUnit: number };
function currency(n: number) { return n.toLocaleString(undefined, {maximumFractionDigits:2}); }
export default function EstimateBuilder({ activities, roles, equipment, materials, config }:
  { activities: Activity[], roles: IdName[], equipment: IdName[], materials: IdName[], config: Config }) {
  const [activityId, setActivityId] = useState<number>(activities[0]?.id);
  const [quantity, setQuantity] = useState<number>(100);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [rolesUse, setRolesUse] = useState<RoleUse[]>([]);
  const [equipUse, setEquipUse] = useState<EquipUse[]>([]);
  const [matsUse, setMatsUse] = useState<MatUse[]>([]);
  const act = useMemo(() => activities.find(a => a.id === activityId), [activities, activityId]);
  useEffect(() => {
    if (!act) return;
    setRolesUse((act.defaultRolesJson ?? []) as RoleUse[]);
    setEquipUse((act.defaultEquipJson ?? []) as EquipUse[]);
    setMatsUse((act.defaultMaterialsJson ?? []) as MatUse[]);
  }, [activityId]);
  const price = useMemo(() => {
    const roleMap = Object.fromEntries(roles.map(r => [r.id, r]));
    const eqMap = Object.fromEntries(equipment.map(e => [e.id, e]));
    const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
    let unitLabor = 0;
    rolesUse.forEach(r => { const rr = roleMap[r.roleId]; if (rr?.loadedRate) unitLabor += r.hoursPerUnit * rr.loadedRate; });
    let unitEquip = 0;
    equipUse.forEach(e => { const ee = eqMap[e.equipmentId]; if (ee?.rate) unitEquip += e.hoursPerUnit * ee.rate; });
    let unitMat = 0;
    matsUse.forEach(m => { const mm = matMap[m.materialId]; if (mm?.unitCost != null) unitMat += m.qtyPerUnit * (mm.unitCost) * (1 + (mm.wastePct ?? 0)); });
    const unitDirect = unitLabor + unitEquip + unitMat;
    const direct = unitDirect * quantity + otherCosts;
    const allocatedIndirect = direct * config.gnaPct + config.fieldOhPerDay * durationDays;
    const matSubtotal = matsUse.reduce((acc, m) => {
      const mm = matMap[m.materialId];
      if (!mm) return acc;
      return acc + m.qtyPerUnit * (mm.unitCost) * (1 + (mm.wastePct ?? 0));
    }, 0) * quantity;
    const tax = matSubtotal * config.salesTaxMatPct;
    const contingency = direct * config.contingencyPct;
    const total = (direct + allocatedIndirect + tax + contingency) * (1 + config.profitMarginPct);
    const unitPrice = total / Math.max(quantity, 1e-9);
    return { unitLabor, unitEquip, unitMat, unitDirect, direct, allocatedIndirect, tax, contingency, total, unitPrice };
  }, [rolesUse, equipUse, matsUse, quantity, otherCosts, durationDays, config, roles, equipment, materials]);
  const [bench, setBench] = useState<{ labor_median:number, equip_median:number, mat_median:number } | null>(null);
  useEffect(() => { (async () => {
      if (!act?.code) { setBench(null); return; }
      const res = await fetch(`/api/benchmarks?activityCode=${encodeURIComponent(act.code)}`);
      if (res.ok) setBench(await res.json()); else setBench(null);
  })(); }, [act?.code]);
  const variancePct = useMemo(() => {
    if (!bench) return null;
    const unitDirect = price.unitDirect;
    const benchUnitDirect = (bench.labor_median ?? 0) * avgLoadedRate(rolesUse, roles)
      + (bench.equip_median ?? 0) * avgEquipRate(equipUse, equipment)
      + (bench.mat_median ?? 0)   * avgMatCost(matsUse, materials);
    if (benchUnitDirect === 0) return null;
    return (unitDirect - benchUnitDirect) / benchUnitDirect;
  }, [bench, price.unitDirect, rolesUse, equipUse, matsUse, roles, equipment, materials]);
  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:12, marginBottom:12}}>
        <label>Activity:
          <select value={activityId} onChange={e => setActivityId(Number(e.target.value))}>
            {activities.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </label>
        <label>Quantity: <input type="number" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
        <label>Duration (days): <input type="number" value={durationDays} onChange={e=>setDurationDays(Number(e.target.value))}/></label>
        <label>Other Costs: <input type="number" value={otherCosts} onChange={e=>setOtherCosts(Number(e.target.value))}/></label>
      </div>
      <h4>Labor (hours per unit)</h4>
      <LineRoles roles={roles} rolesUse={rolesUse} setRolesUse={setRolesUse}/>
      <h4>Equipment (hours per unit)</h4>
      <LineEquip equipment={equipment} equipUse={equipUse} setEquipUse={setEquipUse}/>
      <h4>Materials (qty per unit)</h4>
      <LineMats materials={materials} matsUse={matsUse} setMatsUse={setMatsUse}/>
      <div style={{marginTop:16, padding:12, border:"1px solid #ccc"}}>
        <b>Unit direct:</b> ${currency(price.unitDirect)} &nbsp; 
        <span style={{opacity:0.8}}>Labor ${currency(price.unitLabor)} | Equip ${currency(price.unitEquip)} | Mat ${currency(price.unitMat)}</span>
        <br/>
        <b>Direct:</b> ${currency(price.direct)} &nbsp; 
        <b>Indirect:</b> ${currency(price.allocatedIndirect)} &nbsp; 
        <b>Tax:</b> ${currency(price.tax)} &nbsp; 
        <b>Contingency:</b> ${currency(price.contingency)} <br/>
        <b>Total:</b> ${currency(price.total)} &nbsp; <b>Unit Price:</b> ${currency(price.unitPrice)}
        {variancePct!=null && (
          <div style={{marginTop:8}}>
            Benchmark variance (unit direct): <b style={{color: Math.abs(variancePct) >= (config.varianceAlertPct ?? 0.15) ? "crimson":"inherit"}}>
              {(variancePct*100).toFixed(1)}%
            </b>
          </div>
        )}
      </div>
    </div>
  );
}
function LineRoles({ roles, rolesUse, setRolesUse }:{ roles: IdName[], rolesUse: any[], setRolesUse: (x:any)=>void }){
  return (
    <table border={1} cellPadding={6} style={{marginBottom:12}}>
      <thead><tr><th>Role</th><th>Hours / unit</th><th></th></tr></thead>
      <tbody>
        {rolesUse.map((r,idx)=>(
          <tr key={idx}>
            <td><select value={r.roleId} onChange={e=>{
              const copy=[...rolesUse]; copy[idx]={...copy[idx], roleId:Number(e.target.value)}; setRolesUse(copy);
            }}>{roles.map(rr=><option key={rr.id} value={rr.id}>{rr.name}</option>)}</select></td>
            <td><input type="number" step="0.01" value={r.hoursPerUnit} onChange={e=>{
              const copy=[...rolesUse]; copy[idx]={...copy[idx], hoursPerUnit:Number(e.target.value)}; setRolesUse(copy);
            }}/></td>
            <td><button onClick={()=>setRolesUse(rolesUse.filter((_,i)=>i!==idx))}>Remove</button></td>
          </tr>
        ))}
        <tr><td colSpan={3}><button onClick={()=>setRolesUse([...rolesUse,{roleId:roles[0]?.id, hoursPerUnit:0}])}>+ Add Role</button></td></tr>
      </tbody>
    </table>
  );
}
function LineEquip({ equipment, equipUse, setEquipUse }:{ equipment: IdName[], equipUse: any[], setEquipUse: (x:any)=>void }){
  return (
    <table border={1} cellPadding={6} style={{marginBottom:12}}>
      <thead><tr><th>Equipment</th><th>Hours / unit</th><th></th></tr></thead>
      <tbody>
        {equipUse.map((r,idx)=>(
          <tr key={idx}>
            <td><select value={r.equipmentId} onChange={e=>{
              const copy=[...equipUse]; copy[idx]={...copy[idx], equipmentId:Number(e.target.value)}; setEquipUse(copy);
            }}>{equipment.map(rr=><option key={rr.id} value={rr.id}>{rr.type}</option>)}</select></td>
            <td><input type="number" step="0.01" value={r.hoursPerUnit} onChange={e=>{
              const copy=[...equipUse]; copy[idx]={...copy[idx], hoursPerUnit:Number(e.target.value)}; setEquipUse(copy);
            }}/></td>
            <td><button onClick={()=>setEquipUse(equipUse.filter((_,i)=>i!==idx))}>Remove</button></td>
          </tr>
        ))}
        <tr><td colSpan={3}><button onClick={()=>setEquipUse([...equipUse,{equipmentId:equipment[0]?.id, hoursPerUnit:0}])}>+ Add Equipment</button></td></tr>
      </tbody>
    </table>
  );
}
function LineMats({ materials, matsUse, setMatsUse }:{ materials: IdName[], matsUse: any[], setMatsUse: (x:any)=>void }){
  return (
    <table border={1} cellPadding={6} style={{marginBottom:12}}>
      <thead><tr><th>Material</th><th>Qty / unit</th><th>Unit</th><th>Unit Cost</th><th>Waste%</th><th></th></tr></thead>
      <tbody>
        {matsUse.map((r,idx)=>{
          const mm = materials.find(m=>m.id===r.materialId);
          return (
          <tr key={idx}>
            <td><select value={r.materialId} onChange={e=>{
              const copy=[...matsUse]; copy[idx]={...copy[idx], materialId:Number(e.target.value)}; setMatsUse(copy);
            }}>{materials.map(m=><option key={m.id} value={m.id}>{m.sku} — {m.description}</option>)}</select></td>
            <td><input type="number" step="0.01" value={r.qtyPerUnit} onChange={e=>{
              const copy=[...matsUse]; copy[idx]={...copy[idx], qtyPerUnit:Number(e.target.value)}; setMatsUse(copy);
            }}/></td>
            <td>{mm?.unit}</td>
            <td>{mm?.unitCost}</td>
            <td>{mm?.wastePct}</td>
            <td><button onClick={()=>setMatsUse(matsUse.filter((_,i)=>i!==idx))}>Remove</button></td>
          </tr>
        )})}
        <tr><td colSpan={6}><button onClick={()=>setMatsUse([...matsUse,{materialId:materials[0]?.id, qtyPerUnit:0}])}>+ Add Material</button></td></tr>
      </tbody>
    </table>
  );
}
function avgLoadedRate(uses: RoleUse[], roles: any[]) {
  if (uses.length===0) return 0;
  const map = Object.fromEntries(roles.map(r=>[r.id,r]));
  const rates = uses.map(u => (map[u.roleId]?.loadedRate ?? 0)).filter(Boolean);
  return rates.length ? rates.reduce((a,b)=>a+b,0) / rates.length : 0;
}
function avgEquipRate(uses: EquipUse[], equipment: any[]) {
  if (uses.length===0) return 0;
  const map = Object.fromEntries(equipment.map(e=>[e.id,e]));
  const rates = uses.map(u => (map[u.equipmentId]?.rate ?? 0)).filter(Boolean);
  return rates.length ? rates.reduce((a,b)=>a+b,0) / rates.length : 0;
}
function avgMatCost(uses: MatUse[], materials: any[]) {
  if (uses.length===0) return 0;
  const map = Object.fromEntries(materials.map(m=>[m.id,m]));
  const costs = uses.map(u => (map[u.materialId]?.unitCost ?? 0)).filter(Boolean);
  return costs.length ? costs.reduce((a,b)=>a+b,0) / costs.length : 0;
}
