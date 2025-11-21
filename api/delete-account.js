import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }

  // Initialize server client (SERVICE ROLE)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ------------------------------------
  // 🔥 1) DELETE USER'S PRODUCTS
  // ------------------------------------
  const { error: productError } = await supabase
    .from("products")
    .delete()
    .eq("seller_id", user_id);

  if (productError) {
    console.log("Product delete error:", productError);
  }

  // ------------------------------------
  // 🔥 2) DELETE USER'S ORDERS
  // ------------------------------------
  const { error: orderError } = await supabase
    .from("orders")
    .delete()
    .eq("seller_id", user_id);

  if (orderError) {
    console.log("Order delete error:", orderError);
  }

  // ------------------------------------
  // 🔥 3) DELETE FILES FROM seller-uploads
  // ------------------------------------
  // List ALL files inside seller-uploads
  const { data: files, error: listError } = await supabase
    .storage
    .from("seller-uploads")
    .list(user_id + "/");

  if (listError) {
    console.log("List files error:", listError);
  }

  if (files && files.length > 0) {
    for (const file of files) {
      await supabase.storage
        .from("seller-uploads")
        .remove([`${user_id}/${file.name}`]);
    }
  }

  // Delete the folder itself
  await supabase.storage
    .from("seller-uploads")
    .remove([user_id + "/"]);

  // ------------------------------------
  // 🔥 4) DELETE AUTH USER
  // ------------------------------------
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

  if (deleteError) {
    return res.status(400).json({ error: deleteError.message });
  }

  // ------------------------------------
  // SUCCESS
  // ------------------------------------
  return res.status(200).json({ success: true });
}
