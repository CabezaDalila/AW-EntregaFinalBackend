// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// import {createClient} from "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts';
const supabase = createClient("https://bmwuihgmnmblmdrkqiht.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtd3VpaGdtbm1ibG1kcmtxaWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4Nzk1MTEsImV4cCI6MjA0NzQ1NTUxMX0.Fh8Na4_XuCwsRPrMHFQZmJYJSRcFjI11M70OzkBZq94");

const getHelloWorld = async (req) => {
  const { data, error } = await supabase.from('users').select('name');
  if (error) {
    console.log(error);
    throw Error("DB connection failed")
  }
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
}
const postHelloWorld = (req) => {
  return new Response(
    JSON.stringify({data: "Entro en POST"}),
    { headers: { "Content-Type": "application/json" } },
  )
}

Deno.serve(async (req) => {
  // Desestructuración de un obj y renombramiento de variable data en name.
  const {method} = req;
  switch (method) {
    case "POST":
      return postHelloWorld(req);
    case "GET":
      return getHelloWorld(req);
    default:
      return;
      break;
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
