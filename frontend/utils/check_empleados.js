const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: empleados, error } = await supabase
    .from('empleados')
    .select('*');
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Registered employees:", empleados);
}

check();
