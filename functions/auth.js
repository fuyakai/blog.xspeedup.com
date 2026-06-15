// 简化版 auth - 先确认路由是否正常
export async function onRequest(context) {
  // 如果有 env，用 env；否则返回错误提示
  const clientId = context.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID 未配置！请在 Cloudflare Pages 设置中添加环境变量。", {
      headers: { "Content-Type": "text/html;charset=utf-8" },
      status: 500,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo,user",
    redirect_uri: "https://blog.xspeedup.com/callback",
  });

  return Response.redirect(
    "https://github.com/login/oauth/authorize?" + params.toString(),
    302,
  );
}
