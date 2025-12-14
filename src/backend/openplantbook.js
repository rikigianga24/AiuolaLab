import fetch from "node-fetch";

let tokenCache = {
  token: null,
  expiresAt: 0,
};

export async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(process.env.OPB_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.OPB_CLIENT_ID,
      client_secret: process.env.OPB_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error("OAuth token error");
  }

  const data = await res.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
  };

  return tokenCache.token;
}
