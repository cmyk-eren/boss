const XML_FETCH_TIMEOUT_MS = 30000;

function buildXmlFetchHeaders(sourceUrl) {
  const url = new URL(sourceUrl);

  return {
    Accept: "application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: `${url.origin}/`,
    Origin: url.origin,
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const worker = {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const auth = request.headers.get("authorization");
    if (env.RELAY_TOKEN && auth !== `Bearer ${env.RELAY_TOKEN}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    if (!sourceUrl) {
      return json({ error: "sourceUrl is required" }, 400);
    }

    try {
      const response = await fetch(sourceUrl, {
        redirect: "follow",
        headers: buildXmlFetchHeaders(sourceUrl),
        signal: AbortSignal.timeout(XML_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        return json({ error: `Source request failed with HTTP ${response.status}` }, 502);
      }

      const xml = await response.text();
      if (!xml.trim()) {
        return json({ error: "Empty XML response" }, 502);
      }

      return json({ xml });
    } catch (error) {
      return json(
        {
          error:
            error instanceof Error ? error.message : "Unexpected relay fetch error",
        },
        502,
      );
    }
  },
};

export default worker;
