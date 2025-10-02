"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type SimplifiedTrack = {
  id: string;
  name: string;
  artist: string;
  uri: string;
  image?: string;
};

type PlaybackTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { images: { url: string }[]; name: string };
};

type PlaybackState = {
  paused: boolean;
  track_window?: {
    current_track?: PlaybackTrack | null;
  };
};

type SpotifyApiTrack = {
  id: string;
  name: string;
  uri: string;
  artists: { name: string }[];
  album: { images?: { url: string }[] };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyApiTrack[];
  };
};

interface SpotifyWebPlaybackPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: "ready", callback: (event: { device_id: string }) => void): boolean;
  addListener(event: "not_ready", callback: (event: { device_id: string }) => void): boolean;
  addListener(
    event: "player_state_changed",
    callback: (state: PlaybackState | null) => void
  ): boolean;
  addListener(
    event: "initialization_error" | "authentication_error" | "account_error" | "playback_error",
    callback: (event: { message: string }) => void
  ): boolean;
  removeListener(event: string): void;
  getCurrentState(): Promise<PlaybackState | null>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  togglePlay(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
}

interface SpotifySDK {
  Player: new (options: {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }) => SpotifyWebPlaybackPlayer;
}

declare global {
  interface Window {
    Spotify?: SpotifySDK;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type AuthState = "unknown" | "authenticated" | "unauthenticated";

const REFRESH_BUFFER_MS = 60_000;

export default function SpotifyPlayer() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [sdkReady, setSdkReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SimplifiedTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [currentTrack, setCurrentTrack] = useState<SimplifiedTrack>();

  const playerRef = useRef<SpotifyWebPlaybackPlayer>();
  const tokenRef = useRef<string>();
  const refreshTimerRef = useRef<number>();

  const loadSdk = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.Spotify) {
      setSdkReady(true);
      return;
    }

    const existing = document.getElementById("spotify-player-sdk");
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          setSdkReady(true);
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "spotify-player-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSdkReady(true);
    };
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = undefined;
    }
  }, []);

  const obtainAccessToken = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/token", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuthState("unauthenticated");
          tokenRef.current = undefined;
          clearRefreshTimer();
          return undefined;
        }

        throw new Error("Unable to fetch Spotify token.");
      }

      const payload = (await response.json()) as {
        accessToken: string;
        expiresIn: number;
      };

      tokenRef.current = payload.accessToken;
      setAuthState("authenticated");
      clearRefreshTimer();

      const delay = Math.max(payload.expiresIn * 1000 - REFRESH_BUFFER_MS, 60_000);
      refreshTimerRef.current = window.setTimeout(() => {
        void obtainAccessToken();
      }, delay);

      return payload.accessToken;
    } catch (error) {
      console.error(error);
      tokenRef.current = undefined;
      if (authState === "authenticated") {
        setErrorMessage("Spotify session expired. Please reconnect.");
        setAuthState("unauthenticated");
      } else if (authState === "unknown") {
        setAuthState("unauthenticated");
      }
      clearRefreshTimer();
      return undefined;
    }
  }, [authState, clearRefreshTimer]);

  const ensureToken = useCallback(async () => {
    if (tokenRef.current) {
      return tokenRef.current;
    }

    const token = await obtainAccessToken();
    if (!token) {
      throw new Error("Spotify not authenticated");
    }

    return token;
  }, [obtainAccessToken]);

  const transferPlayback = useCallback(
    async (targetDevice: string | undefined = deviceId) => {
      if (!targetDevice) {
        return false;
      }

      try {
        const token = await ensureToken();

        const response = await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [targetDevice],
            play: false,
          }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            setErrorMessage("Spotify Premium is required to use playback controls.");
          } else {
            setErrorMessage("Unable to activate the Spotify player.");
          }
          return false;
        }

        setErrorMessage(undefined);
        return true;
      } catch (error) {
        console.error("transferPlayback", error);
        setErrorMessage("Failed to connect to the Spotify player.");
        return false;
      }
    },
    [deviceId, ensureToken]
  );

  const disconnectPlayer = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current = undefined;
    setPlayerReady(false);
    setDeviceId(undefined);
    setIsPlaying(false);
    setCurrentTrack(undefined);
  }, []);

  useEffect(() => {
    loadSdk();

    return () => {
      clearRefreshTimer();
      disconnectPlayer();
    };
  }, [clearRefreshTimer, disconnectPlayer, loadSdk]);

  useEffect(() => {
    if (authState === "unknown") {
      void obtainAccessToken();
    }
  }, [authState, obtainAccessToken]);

  useEffect(() => {
    if (!sdkReady || authState !== "authenticated") {
      return;
    }

    if (!window.Spotify) {
      return;
    }

    if (!tokenRef.current) {
      void obtainAccessToken();
      return;
    }

    if (playerRef.current) {
      return;
    }

    const player = new window.Spotify.Player({
      name: "Doorboard SG",
      getOAuthToken: (callback) => {
        if (tokenRef.current) {
          callback(tokenRef.current);
        }
      },
      volume: 0.5,
    });

    playerRef.current = player;

    player.addListener("ready", ({ device_id }) => {
      setPlayerReady(true);
      setDeviceId(device_id);
      setStatusMessage("Spotify is ready.");
      void player.getVolume().then(setVolume).catch(() => undefined);
      void transferPlayback(device_id);
    });

    player.addListener("not_ready", () => {
      setPlayerReady(false);
    });

    player.addListener("player_state_changed", (state) => {
      if (!state) {
        setIsPlaying(false);
        setCurrentTrack(undefined);
        return;
      }

      setIsPlaying(!state.paused);
      const track = state.track_window?.current_track;
      if (track) {
        setCurrentTrack({
          id: track.id,
          name: track.name,
          artist: track.artists.map((artist) => artist.name).join(", "),
          uri: track.uri,
          image: track.album.images?.[2]?.url ?? track.album.images?.[0]?.url,
        });
      }
    });

    const handlePlayerError = (label: string) => (event: { message: string }) => {
      console.error(`Spotify ${label}:`, event.message);
      setErrorMessage(`Spotify ${label}: ${event.message}`);
    };

    player.addListener("initialization_error", handlePlayerError("initialization error"));
    player.addListener("authentication_error", handlePlayerError("authentication error"));
    player.addListener("account_error", handlePlayerError("account error"));
    player.addListener("playback_error", handlePlayerError("playback error"));

    void player.connect().then((connected) => {
      if (!connected) {
        setErrorMessage("Unable to connect to Spotify.");
      }
    });

    return () => {
      player.disconnect();
      playerRef.current = undefined;
    };
  }, [authState, obtainAccessToken, sdkReady, transferPlayback]);

  const handleConnect = useCallback(() => {
    setStatusMessage(undefined);
    setErrorMessage(undefined);
    if (typeof window !== "undefined") {
      window.location.href = "/api/spotify/authorize";
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/spotify/logout", { method: "POST" });
    } catch (error) {
      console.error("spotify logout", error);
    } finally {
      tokenRef.current = undefined;
      setAuthState("unauthenticated");
      setSearchResults([]);
      setStatusMessage(undefined);
      setErrorMessage(undefined);
      clearRefreshTimer();
      disconnectPlayer();
    }
  }, [clearRefreshTimer, disconnectPlayer]);

  const handleTogglePlay = useCallback(async () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    try {
      await player.togglePlay();
      setErrorMessage(undefined);
    } catch (error) {
      console.error("togglePlay", error);
      setErrorMessage("Unable to toggle playback.");
    }
  }, []);

  const handleSkipNext = useCallback(async () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    try {
      await player.nextTrack();
      setErrorMessage(undefined);
    } catch (error) {
      console.error("nextTrack", error);
      setErrorMessage("Unable to skip track.");
    }
  }, []);

  const handleSkipPrevious = useCallback(async () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    try {
      await player.previousTrack();
      setErrorMessage(undefined);
    } catch (error) {
      console.error("previousTrack", error);
      setErrorMessage("Unable to go back.");
    }
  }, []);

  const handleVolumeInput = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const value = Number(event.target.value) / 100;
      try {
        await player.setVolume(value);
        setVolume(value);
      } catch (error) {
        console.error("setVolume", error);
        setErrorMessage("Unable to change volume.");
      }
    },
    []
  );

  const handleSearch = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (!query) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      setStatusMessage(undefined);

      try {
        const token = await ensureToken();
        const response = await fetch(
          "https://api.spotify.com/v1/search?type=track&limit=5&q=" + encodeURIComponent(query),
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as SpotifySearchResponse;
        const items = (data.tracks?.items ?? []).slice(0, 4).map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((artist) => artist.name).join(", "),
          uri: track.uri,
          image: track.album.images?.[2]?.url ?? track.album.images?.[0]?.url,
        }));

        setSearchResults(items);
        setErrorMessage(undefined);
      } catch (error) {
        console.error("spotify search", error);
        setErrorMessage("Search failed. Please try again.");
      } finally {
        setSearching(false);
      }
    },
    [ensureToken, searchQuery]
  );

  const handleSelectTrack = useCallback(
    async (track: SimplifiedTrack) => {
      if (!deviceId) {
        setErrorMessage("Player is not ready yet.");
        return;
      }

      try {
        const transferred = await transferPlayback(deviceId);
        if (!transferred) {
          return;
        }

        const token = await ensureToken();
        const response = await fetch(
          "https://api.spotify.com/v1/me/player/play?device_id=" + encodeURIComponent(deviceId),
          {
            method: "PUT",
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [track.uri] }),
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setErrorMessage("Spotify Premium is required to start playback.");
          } else {
            throw new Error("Playback failed");
          }
          return;
        }

        setStatusMessage("Playing " + track.name);
        setErrorMessage(undefined);
      } catch (error) {
        console.error("play track", error);
        setErrorMessage("Unable to start playback.");
      }
    },
    [deviceId, ensureToken, transferPlayback]
  );

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const controlsDisabled = !playerReady;

  return (
    <div className="flex flex-col gap-2 text-white">
      {authState !== "authenticated" ? (
        <div className="flex flex-col gap-2">
          <p className="text-[clamp(10px,1vw,12px)] text-white/70">
            Connect your Spotify Premium account to control playback from the dashboard.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-[clamp(10px,1vw,12px)] font-semibold text-emerald-200 transition hover:bg-emerald-500/30 focus:outline focus:outline-2 focus:outline-emerald-200/60"
          >
            Connect Spotify
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[clamp(9px,0.9vw,11px)] text-white/60">
            <span>{playerReady ? "Player ready" : "Connecting player..."}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-white/15 px-2 py-1 text-white/70 transition hover:border-white/40 hover:text-white"
            >
              Sign out
            </button>
          </div>

          {currentTrack ? (
            <div className="flex items-center gap-2">
              {currentTrack.image ? (
                <Image
                  src={currentTrack.image}
                  alt={currentTrack.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-md bg-white/10" />
              )}
              <div className="min-w-0">
                <p className="truncate text-[clamp(10px,1vw,12px)] font-semibold text-white">
                  {currentTrack.name}
                </p>
                <p className="truncate text-[clamp(9px,0.9vw,11px)] text-white/60">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 p-3 text-center text-[clamp(9px,0.9vw,11px)] text-white/50">
              Search and play a track to begin.
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSkipPrevious}
              disabled={controlsDisabled}
              className="flex-1 rounded-md border border-white/15 px-2 py-1 text-[clamp(9px,0.9vw,11px)] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={controlsDisabled}
              className="flex-1 rounded-md border border-white/15 px-2 py-1 text-[clamp(9px,0.9vw,11px)] font-semibold text-white transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={handleSkipNext}
              disabled={controlsDisabled}
              className="flex-1 rounded-md border border-white/15 px-2 py-1 text-[clamp(9px,0.9vw,11px)] text-white/70 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-2 text-[clamp(9px,0.9vw,11px)] text-white/60">
            <span className="w-12 shrink-0">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={handleVolumeInput}
              disabled={controlsDisabled}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-emerald-400 disabled:cursor-not-allowed"
            />
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search songs, artists, albums"
                className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-[clamp(9px,0.9vw,11px)] text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className="rounded-md border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 text-[clamp(9px,0.9vw,11px)] font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="grid gap-2">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="flex items-center gap-2 rounded-md border border-white/12 bg-white/5 px-2 py-2 text-left transition hover:border-white/30 hover:bg-white/10 focus:outline focus:outline-2 focus:outline-emerald-300"
                >
                  {track.image ? (
                    <Image
                      src={track.image}
                      alt={track.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 flex-shrink-0 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 flex-shrink-0 rounded-sm bg-white/10" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[clamp(10px,1vw,12px)] font-semibold text-white">
                      {track.name}
                    </p>
                    <p className="truncate text-[clamp(9px,0.9vw,11px)] text-white/60">
                      {track.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {statusMessage && (
        <p className="text-[clamp(8px,0.8vw,10px)] text-emerald-300">{statusMessage}</p>
      )}
      {errorMessage && (
        <p className="text-[clamp(8px,0.8vw,10px)] text-rose-300">{errorMessage}</p>
      )}
    </div>
  );
}
