const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: asistencias, error } = await supabase
    .from('asistencias')
    .select('registrado_at')
    .limit(5000);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Total asistencias returned with limit(5000):", asistencias.length);
}

check();
