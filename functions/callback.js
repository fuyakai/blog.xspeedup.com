// Cloudflare Pages Function: /callback
// GitHub OAuth 回调 - 同域名，postMessage 到 opener
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: context.env.GITHUB_CLIENT_ID,
      client_secret: context.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return new Response("OAuth Error: " + tokenData.error_description, { status: 400 });
  }

  const token = tokenData.access_token;

  // 标准 Decap CMS OAuth callback：发 postMessage 后关闭弹窗
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>授权中...</title></head><body>
<script>
(function() {
  console.log("callback: sending token to opener...");
  var msg = {token: "${token}", provider: "github"};
  try {
    window.opener.postMessage(msg, window.location.origin);
    console.log("callback: postMessage sent");
  } catch(e) {
    console.error("callback: postMessage failed", e);
  }
  // 延迟关闭，确保 opener 有时间处理消息
  setTimeout(function() { window.close(); }, 1000);
})();
</script>
<p style="font-family:sans-serif;text-align:center;padding:40px;">登录成功！窗口将自动关闭...</p>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}
