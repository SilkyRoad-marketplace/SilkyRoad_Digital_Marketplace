export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  return new Response(
    JSON.stringify({ ok: true, message: "Edge runtime working" }),
    { status: 200 }
  );
}
