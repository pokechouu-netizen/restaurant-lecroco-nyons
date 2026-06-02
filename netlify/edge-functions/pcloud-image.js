export default async (request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  try {
    // Fetch the pCloud share page to extract the direct download link
    const pageUrl = "https://e.pcloud.link/publink/show?code=" + code;
    const resp = await fetch(pageUrl);
    const html = await resp.text();

    // Extract downloadlink from publinkData JS object
    const match = html.match(/"downloadlink"\s*:\s*"([^"]+)"/);
    if (!match) {
      return new Response("Could not extract download link", { status: 502 });
    }

    // The download link has escaped slashes
    const downloadLink = "https:" + match[1].replace(/\\\//g, "/");

    // Fetch the actual image and serve it with proper headers
    const imageResp = await fetch(downloadLink);
    const contentType = imageResp.headers.get("content-type") || "image/jpeg";

    return new Response(imageResp.body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
        "access-control-allow-origin": "*",
      },
    });
  } catch (e) {
    return new Response("Error fetching image: " + e.message, { status: 500 });
  }
};

export const config = { path: "/pcloud-image" };
