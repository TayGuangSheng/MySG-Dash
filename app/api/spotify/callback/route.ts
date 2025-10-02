import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing Spotify environment variables.");
    return NextResponse.json({ error: "Spotify integration is not configured." }, { status: 500 });
  }

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("spotify_oauth_state")?.value;

  if (error) {
    console.error("Spotify authorization error:", error);
    return NextResponse.redirect(new URL("/?spotify=error", request.url));
  }

  if (!code || !state || !storedState || state !== storedState) {
    console.error("Spotify authorization state mismatch.");
    return NextResponse.redirect(new URL("/?spotify=error", request.url));
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Spotify token exchange failed:", tokenData);
    return NextResponse.redirect(new URL("/?spotify=error", request.url));
  }

  const accessToken = tokenData.access_token as string | undefined;
  const refreshToken = tokenData.refresh_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;

  if (!accessToken || !refreshToken || !expiresIn) {
    console.error("Spotify token response incomplete:", tokenData);
    return NextResponse.redirect(new URL("/?spotify=error", request.url));
  }

  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/?spotify=connected", request.url));
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

  response.cookies.set({
    name: "spotify_refresh_token",
    value: refreshToken,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set({
    name: "spotify_oauth_state",
    value: "",
    expires: new Date(0),
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
