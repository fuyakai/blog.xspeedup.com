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

  // Decap CMS 从 localStorage 读取 token
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权中...</title></head><body>
<script>
(function() {
  var token = "${accessToken}";
  var provider = "github";
  // Decap CMS 存储格式
  localStorage.setItem("netlify-cms-user", JSON.stringify({
    token: token,
    backendName: "github"
  }));
  // 同时设置 CMS 期望的格式
  localStorage.setItem("decap-cms.user", JSON.stringify({
    token: token,
    backendName: "github"
  }));
  // 通知 CMS（如果还在监听）
  if (window.opener) {
    window.opener.postMessage({token: token, provider: provider}, window.location.origin);
  }
  // 跳转到后台
  window.location.href = "/admin/";
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">登录成功！正在跳转...</p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}
