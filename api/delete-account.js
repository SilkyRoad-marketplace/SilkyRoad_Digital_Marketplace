export const config = {
  runtime: "edge"
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405 }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400 }
    );
  }

  const user_id = body.user_id;
  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "Missing user_id" }),
      { status: 400 }
    );
  }

  // Create admin client (Edge compatible)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // -------------------------------
  // 1) DELETE PRODUCTS
  // -------------------------------
  await supabase.from("products").delete().eq("seller_id", user_id);

  // -------------------------------
  // 2) DELETE ORDERS
  // -------------------------------
  await supabase.from("orders").delete().eq("seller_id", user_id);

  // -------------------------------
  // 3) DELETE STORAGE FILES
  // -------------------------------
  const { data: folders } = await supabase
    .storage
    .from("seller-uploads")
    .list(`${user_id}/`);

  if (folders && folders.length > 0) {
    const paths = folders.map(f => `${user_id}/${f.name}`);
    await supabase.storage
      .from("seller-uploads")
      .remove(paths);
  }

  // Delete whole folder
  await supabase.storage
    .from("seller-uploads")
    .remove([`${user_id}/`]);

  // -------------------------------
  // 4) DELETE AUTH USER
  // -------------------------------
  const { error: deleteError } =
    await supabase.auth.admin.deleteUser(user_id);

  if (deleteError) {
    return new Response(
      JSON.stringify({ error: deleteError.message }),
      { status: 400 }
    );
  }

  // -------------------------------
  // 5) SUCCESS
  // -------------------------------
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
}
