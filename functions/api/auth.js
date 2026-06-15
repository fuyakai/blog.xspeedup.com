export async function onRequest(context) {
  const client_id = context.env.GITHUB_CLIENT_ID;
  const url = new URL(context.request.url);
  const redirectUrl = new URL("https://github.com/login/oauth/authorize");
  redirectUrl.searchParams.set("client_id", client_id);
  redirectUrl.searchParams.set("redirect_uri", url.origin + "/api/callback");
  redirectUrl.searchParams.set("scope", "repo user");
  redirectUrl.searchParams.set("state", crypto.randomUUID());
  return Response.redirect(redirectUrl.href, 302);
}
