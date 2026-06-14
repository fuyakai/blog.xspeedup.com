export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/auth" && request.method === "GET") {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: "repo,user",
        redirect_uri: "https://decap-cms-oauth.xspeedup.com/callback",
      });
      return Response.redirect(
        "https://github.com/login/oauth/authorize?" + params.toString(),
        302,
      );
    }

    if (path === "/callback") {
      // GET - OAuth callback from GitHub
      if (request.method === "GET") {
        const code = url.searchParams.get("code");
        if (!code) {
          return new Response("Missing code", { status: 400 });
        }
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
          return new Response("OAuth Error: " + (tokenData.error_description || tokenData.error), { status: 400 });
        }
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
(function(){
  var data = JSON.stringify({token:"${tokenData.access_token}",provider:"github"});
  if(window.opener){
    window.opener.postMessage(data, window.location.origin);
    window.close();
  } else {
    localStorage.setItem("decap-cms-token", data);
    window.location.href = "https://blog.xspeedup.com/admin/";
  }
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">登录成功！正在跳转...</p>
</body></html>`;
        return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      }

      // POST - token endpoint for Decap CMS
      if (request.method === "POST") {
        try {
          const body = await request.json();
          if (body.code) {
            const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                client_id: env.GITHUB_CLIENT_ID,
                client_secret: env.GITHUB_CLIENT_SECRET,
                code: body.code,
              }),
            });
            const tokenData = await tokenRes.json();
            return new Response(JSON.stringify(tokenData), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }
        } catch(e) {}
        return new Response('{"error":"invalid_request"}', { status: 400, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Decap CMS OAuth Worker", { headers: { "Content-Type": "text/plain;charset=utf-8" } });
  },
};
