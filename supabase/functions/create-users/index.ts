import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const users = [
      { email: 'dtl@binus.edu', password: '_b!Nu$' },
      { email: 'lsc@binus.edu', password: 'elescebnsmlg' },
      { email: 'it@binus.edu', password: 'iiitttbnsmlg' },
      { email: 'bm@binus.edu', password: 'beemmmbnsmlg' },
      { email: 'me@binus.edu', password: 'mmmeeebnsmlg' },
    ];

    const results = [];

    for (const user of users) {
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === user.email);

      if (userExists) {
        results.push({ email: user.email, status: 'already exists' });
        continue;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        results.push({ email: user.email, error: error.message });
      } else {
        results.push({ email: user.email, success: true, id: data.user?.id });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});