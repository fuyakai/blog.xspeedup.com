/**
 * Decap CMS GitHub OAuth Worker for Cloudflare Workers
 *
 * 使用方法:
 * 1. 在 GitHub 创建 OAuth App: Settings → Developer settings → OAuth Apps
 *    - Homepage URL: https://blog.xspeedup.com
 *    - Authorization callback URL: https://decap-cms-oauth.xspeedup.com/callback
 * 2. 用 wrangler 部署此 Worker 到 decap-cms-oauth.xspeedup.com
 * 3. 设置 secrets: wrangler secret put GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/auth" && request.method === "GET") {
      // Step 1: Redirect to GitHub OAuth
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: "repo,user",
        redirect_uri: `https://decap-cms-oauth.xspeedup.com/callback`,
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params.toString()}`,
        302,
      );
    }

    if (path === "/callback" && request.method === "GET") {
      // Step 2: Handle GitHub callback, exchange code for token
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Missing code parameter", { status: 400 });
      }

      const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        },
      );

      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        return new Response(`OAuth Error: ${tokenData.error_description}`, {
          status: 400,
        });
      }

      // Return the token via postMessage to the opener window
      const html = `<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  if (window.opener) {
    window.opener.postMessage(
      JSON.stringify({
        token: '${tokenData.access_token}',
        provider: 'github',
      }),
      window.location.origin
    );
    window.close();
  }
})();
</script>
<p>登录成功，正在跳转...</p>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Decap CMS OAuth Worker", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
