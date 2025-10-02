import { NextResponse } from "next/server";

export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true });
  const expired = new Date(0);

  response.cookies.set({
    name: "spotify_access_token",
    value: "",
    expires: expired,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  response.cookies.set({
    name: "spotify_access_token_expires",
    value: "",
    expires: expired,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  response.cookies.set({
    name: "spotify_refresh_token",
    value: "",
    expires: expired,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  response.cookies.set({
    name: "spotify_oauth_state",
    value: "",
    expires: expired,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
