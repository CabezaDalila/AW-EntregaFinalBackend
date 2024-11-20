// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // Asegúrate de tener un archivo de cors configurado.

const supabase = createClient(
  "https://bmwuihgmnmblmdrkqiht.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtd3VpaGdtbm1ibG1kcmtxaWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4Nzk1MTEsImV4cCI6MjA0NzQ1NTUxMX0.Fh8Na4_XuCwsRPrMHFQZmJYJSRcFjI11M70OzkBZq94",
);

const getDataPortfolioUser = async (req: Request): Promise<Response> => {
  try {
    console.log("Request recibido:", req);

    // Obtener parámetros de la query string
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response("Falta el email del usuario", {
        headers: corsHeaders,
        status: 400,
      });
    }

    // Paso 1: Obtener el id del usuario basado en el email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("Error al obtener el usuario:", userError);
      return new Response("Usuario no encontrado", {
        headers: corsHeaders,
        status: 404,
      });
    }

    const userId = userData.id;

    // Paso 2: Obtener el portfolio asociado al usuario
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolio")
      .select("dineroDisponible")
      .eq("id_user", userId)
      .single();

    if (portfolioError || !portfolioData) {
      console.error("Error al obtener el portfolio:", portfolioError);
      return new Response("Portfolio no encontrado", {
        headers: corsHeaders,
        status: 404,
      });
    }
    // // Primero obtener todas las transacciones de compra del usuario
    // const { data: transaccionesData, error: transaccionesError } =
    //   await supabase
    //     .from("transaccion")
    //     .select(`id_activo, activo (precio,cantidad)`)
    //     .eq("operacion", "buy")
    //     .eq("id_portf", portfolioData.id); // Usamos el id del portfolio que ya tenemos

    // if (transaccionesError) {
    //   console.error("Error al obtener transacciones:", transaccionesError);
    //   return new Response("Error al obtener transacciones", {
    //     headers: corsHeaders,
    //     status: 500,
    //   });
    // }

    // // Calculamos el total invertido
    // const totalInvertido = transaccionesData?.reduce((sum, transaction) => {
    //   return sum + (transaction.activo.precio * transaction.activo.cantidad);
    // }, 0) || 0;

    // Devolvemos tanto el dinero disponible como el total invertido
    return new Response(
      JSON.stringify({
        dineroDisponible: portfolioData.dineroDisponible
        // ,totalInvertido: totalInvertido,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("Error en la función:", err);
    return new Response("Error interno del servidor", {
      headers: corsHeaders,
      status: 500,
    });
  }
};

const putBuy = async (req: Request): Promise<Response> => {
  console.log("SI entro");
  try {
    console.log("Request recibido:", req);
    const body = await req.json();
    const { tipoTransaccion, ticker, cantidad,precio, email } = body;

    if (!ticker || !precio || !cantidad) {
      return new Response("Faltan datos de la compra", {
        headers: corsHeaders,
        status: 400,
      });
    }
    if (!email) {
      return new Response("Falta el email del usuario", {
        headers: corsHeaders,
        status: 400,
      });
    }
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("Error al obtener el usuario:", userError);
      return new Response("Usuario no encontrado", {
        headers: corsHeaders,
        status: 404,
      });
    }
    const userId = userData.id;

    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolio")
      .select("dineroDisponible")
      .eq("id_user", userId)
      .single();

    if (portfolioError || !portfolioData) {
      console.error("Error al obtener el portfolio:", portfolioError);
      return new Response("Portfolio no encontrado", {
        headers: corsHeaders,
        status: 404,
      });
    }

    const nuevoDineroDisponible = portfolioData.dineroDisponible -
      (precio * cantidad);
    //modificas el dinero disponible
    await supabase
      .from("portfolio")
      .update({ dineroDisponible: nuevoDineroDisponible })
      .eq("id_user", userId);

    // idPorfolio
    const { data: portfData, error: portfError } = await supabase
      .from("portfolio")
      .select("id")
      .eq("id_user", userId)
      .single();

    if (portfError || !portfData) {
      console.error("Error al obtener el id del portfolio:", portfError);
      return new Response("Error al obtener portfolio", {
        headers: corsHeaders,
        status: 500,
      });
    }
    const portfolioId = Number(portfData.id);

    const transaccionBuy = {
      tipoTransaccion: "buy",
      ticker: ticker,
      cantidad: cantidad,
      precio:precio,
      id_portfolio:portfolioId
    };

    const { data: transactionData, error: transactionError } = await supabase
      .from("transaccion")
      .insert(transaccionBuy)
      .select();

    if (transactionError || !transactionData) {
      console.error("Error al insertar transacción:", transactionError);
      return new Response("Error al insertar transacción", {
        headers: corsHeaders,
        status: 500,
      });
    }
    return new Response(
      JSON.stringify({ mensaje: "Compra actualizada con éxito" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("Error en la función:", err);
    return new Response("Error interno del servidor", {
      headers: corsHeaders,
      status: 500,
    });
  }
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    // Manejo de preflight para solicitudes CORS
    return new Response("ok", { headers: corsHeaders });
  }

  const { method } = req;
  switch (method) {
    case "GET":
      return getDataPortfolioUser(req);
    case "PUT":
      return putBuy(req);
    default:
      return new Response("Método no permitido", {
        headers: corsHeaders,
        status: 405,
      });
  }
});
