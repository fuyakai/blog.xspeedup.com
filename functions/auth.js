// Cloudflare Pages Function: /auth
// 单文件 OAuth 流程：启动 + 回调都在这里
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const redirectUri = url.origin + "/auth";
  const code = url.searchParams.get("code");

  // 阶段2：GitHub 回调，用 code 换 token
  if (code) {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: context.env.GITHUB_CLIENT_ID,
          client_secret: context.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return new Response("OAuth Error: " + tokenData.error_description, {
        status: 400,
      });
    }

    const token = tokenData.access_token;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权完成</title></head><body>
<script>
(function() {
  var msg = {token: "${token}", provider: "github"};
  console.log("auth callback: posting token to opener");
  if (window.opener) {
    window.opener.postMessage(msg, window.location.origin);
  }
  setTimeout(function() { window.close(); }, 1000);
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">登录成功，窗口即将关闭...</p>
</body></html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

  // 阶段1：启动 OAuth，重定向到 GitHub
  const clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID not configured", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo,user",
    redirect_uri: redirectUri,
  });

  return Response.redirect(
    "https://github.com/login/oauth/authorize?" + params.toString(),
    302,
  );
}
