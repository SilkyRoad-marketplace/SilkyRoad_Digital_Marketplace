// /api/delete-product.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  // Allow GET only for simple "is this alive?" check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Use POST with { product_id, seller_id } to delete a product.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------------------
  // Parse JSON body
  // ----------------------------
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { product_id, seller_id } = body || {};

  if (!product_id || !seller_id) {
    return new Response(
      JSON.stringify({ error: "Missing product_id or seller_id" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------------------
  // Create Supabase "admin" client (service role)
  // ----------------------------
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ----------------------------
  // 1) Fetch the product row to know file URLs
  // ----------------------------
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, seller_id, download_url, main_image_url, image2_url, image3_url")
    .eq("id", product_id)
    .eq("seller_id", seller_id)
    .single();

  if (fetchError || !product) {
    return new Response(
      JSON.stringify({ error: "Product not found or not owned by this seller." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------------------
  // 2) Collect all file paths inside seller-uploads bucket
  // ----------------------------
  const bucketName = "seller-uploads";
  const urls = [
    product.download_url,
    product.main_image_url,
    product.image2_url,
    product.image3_url,
  ].filter(Boolean);

  const pathsToDelete = [];

  for (const url of urls) {
    const marker = "/seller-uploads/";
    const idx = url.indexOf(marker);
    if (idx === -1) continue; // external link, skip

    // Get the part after /seller-uploads/
    const path = url.substring(idx + marker.length);
    if (path) {
      pathsToDelete.push(path);
    }
  }

  // ----------------------------
  // 3) Delete the files in storage (if any)
  // ----------------------------
  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase
      .storage
      .from(bucketName)
      .remove(pathsToDelete);

    if (storageError) {
      // We log but still proceed with DB delete
      console.log("Storage delete error:", storageError);
    }
  }

  // ----------------------------
  // 4) Delete the product row itself
  // ----------------------------
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", product_id)
    .eq("seller_id", seller_id);

  if (deleteError) {
    return new Response(
      JSON.stringify({ error: deleteError.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------------------
  // 5) Done
  // ----------------------------
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
