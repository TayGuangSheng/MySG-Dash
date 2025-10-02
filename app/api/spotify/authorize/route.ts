import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
];

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("Missing Spotify client configuration.");
    return NextResponse.json({ error: "Spotify integration is not configured." }, { status: 500 });
  }

  const state = randomUUID();
  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", SCOPES.join(" "));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("show_dialog", "true");

  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set({
    name: "spotify_oauth_state",
    value: state,
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
