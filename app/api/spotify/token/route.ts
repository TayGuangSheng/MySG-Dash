import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Spotify client credentials.");
    return NextResponse.json({ error: "Spotify integration is not configured." }, { status: 500 });
  }

  const cookies = request.cookies;
  const refreshToken = cookies.get("spotify_refresh_token")?.value;
  const cachedAccessToken = cookies.get("spotify_access_token")?.value;
  const cachedExpiry = cookies.get("spotify_access_token_expires")?.value;

  const now = Date.now();
  if (cachedAccessToken && cachedExpiry) {
    const expiry = Number(cachedExpiry);
    if (!Number.isNaN(expiry) && expiry - now > 60_000) {
      const remaining = Math.floor((expiry - now) / 1000);
      return NextResponse.json(
        { accessToken: cachedAccessToken, expiresIn: remaining },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  if (!refreshToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Spotify refresh failed:", tokenData);
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
  }

  const accessToken = tokenData.access_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;
  const newRefreshToken = tokenData.refresh_token as string | undefined;

  if (!accessToken || !expiresIn) {
    console.error("Spotify refresh response incomplete:", tokenData);
    return NextResponse.json({ error: "refresh_failed" }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.json(
    { accessToken, expiresIn },
    { headers: { "Cache-Control": "no-store" } }
  );

  const expiresAt = Date.now() + Math.max((expiresIn - 60) * 1000, 60_000);

  response.cookies.set({
    name: "spotify_access_token",
    value: accessToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });

  response.cookies.set({
    name: "spotify_access_token_expires",
    value: String(expiresAt),
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });

  if (newRefreshToken) {
    response.cookies.set({
      name: "spotify_refresh_token",
      value: newRefreshToken,
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
