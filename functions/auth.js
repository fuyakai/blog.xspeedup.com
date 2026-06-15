// Cloudflare Pages Function: /auth
// 跳转到 GitHub OAuth 授权页
export async function onRequest(context) {
  const params = new URLSearchParams({
    client_id: context.env.GITHUB_CLIENT_ID,
    scope: "repo,user",
    redirect_uri: "https://blog.xspeedup.com/callback",
  });
  return Response.redirect(
    "https://github.com/login/oauth/authorize?" + params.toString(),
    302,
  );
}
