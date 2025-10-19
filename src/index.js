/**
CSE Technical Project. 

1. Serve a Worker on the tunnel.gattihome.com/secure path that returns identity information
for the authenticated user.

2. The HTTP response body should contain: “${EMAIL} authenticated at ${TIMESTAMP} from
${COUNTRY}”

3. ${COUNTRY} should be an HTML link that when clicked navigates to
tunnel.gattihome.com/secure/${COUNTRY} and displays the appropriate country flag.

4. The flag asset should be stored in a private R2 bucket.
	4a. Create this Worker using the Wrangler CLI, upload your Workers code to a public 
	Git repository for your implementation.
	4b. The /secure response should be returned as HTML
	4c. The /secure/${COUNTRY} response should use an appropriate content type 
*/

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve flag from R2
    if (path.startsWith("/secure/") && path !== "/secure/") {
      const country = decodeURIComponent(path.split("/")[2]);
      const object = await env.flags.get(`${country}.png`);
      if (!object) {
        return new Response("Flag not found", { status: 404 });
      }
      return new Response(object.body, {
        headers: { "Content-Type": "image/png" },
      });
    }

    // Serve /secure HTML page
    const email = request.headers.get("Cf-Access-Authenticated-User-Email") || "anonymous@unknown";
    const country = request.cf?.country || "Unknown";
    const timestamp = new Date().toISOString();

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif;">
        <p>${email} authenticated at ${timestamp} from 
          <a href="/secure/${country}">${country}</a>
        </p>
      </body>
      </html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    });
  },
};