export async function onRequest(context) {
  const req = context.request;
  const u = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // Root
  if (u.pathname === "/" || u.pathname === "") {
    return context.next(); // serves index.html
  }

  // Map routes
  let upstreamBase = "";
  let newPath = u.pathname;

  // /w1/... -> Worker1
  // /w2/... -> Worker2
  if (u.pathname.startsWith("/w1/")) {
    upstreamBase = "https://youtube.projecto.workers.dev";
    newPath = u.pathname.slice(3); // remove "/w1"
  } else if (u.pathname.startsWith("/w2/")) {
    upstreamBase = "https://authonyt.projecto.workers.dev";
    newPath = u.pathname.slice(3); // remove "/w2"
  } else {
    return new Response("Not found. Use /w1/* or /w2/*", {
      status: 404,
      headers: corsHeaders(),
    });
  }

  const upstreamUrl = upstreamBase + newPath + u.search;

  // Clone headers (safe)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init = {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: "follow",
  };

  const resp = await fetch(upstreamUrl, init);

  // passthrough response
  const outHeaders = new Headers(resp.headers);
  // (optional) allow browser testing too
  for (const [k, v] of corsHeaders()) outHeaders.set(k, v);

  return new Response(resp.body, {
    status: resp.status,
    headers: outHeaders,
  });
}

function corsHeaders() {
  return new Map([
    ["access-control-allow-origin", "*"],
    ["access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS"],
    ["access-control-allow-headers", "*"],
  ]);
}
