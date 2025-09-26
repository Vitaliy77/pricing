// app/api/benchmarks/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  const { data, error } = await supabase
    .from('v_activity_benchmarks')
    .select('code,name,unit,labor_cost_per_unit,equip_cost_per_unit,material_cost_per_unit,direct_cost_per_unit')
    .order('code');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
