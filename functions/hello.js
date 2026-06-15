export async function onRequest() {
  return new Response("Functions OK!", {
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}
