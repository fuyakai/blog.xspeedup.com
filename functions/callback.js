// Cloudflare Pages Function: /callback
// GitHub OAuth 回调 - 同域名，无跨域问题
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // 用 code 换 token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
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
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response("OAuth Error: " + tokenData.error_description, {
      status: 400,
    });
  }

  const accessToken = tokenData.access_token;

  // 同域名，postMessage 零跨域问题
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权中...</title></head><body>
<script>
(function() {
  var data = {token: "${accessToken}", provider: "github"};
  var origin = window.location.origin;
  if (window.opener) {
    window.opener.postMessage(data, origin);
    window.close();
  } else {
    window.location.href = origin + "/admin/";
  }
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">登录成功！正在跳转...</p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}
