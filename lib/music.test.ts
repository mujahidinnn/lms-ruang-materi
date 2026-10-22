import { expect, test } from "vitest";
import { musicEmbed } from "./music";

test("spotify links", () => {
  expect(musicEmbed("https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6?si=abc")).toBe("https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6");
  expect(musicEmbed("https://open.spotify.com/intl-id/track/4uLU6hMCjMI75M1A2tKUQC")).toBe("https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC");
});

test("youtube and youtube music links", () => {
  expect(musicEmbed("https://music.youtube.com/watch?v=jfKfPfyJRdk&list=RDjf")).toBe("https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?list=RDjf");
  expect(musicEmbed("https://youtu.be/jfKfPfyJRdk")).toBe("https://www.youtube-nocookie.com/embed/jfKfPfyJRdk");
  expect(musicEmbed("https://music.youtube.com/playlist?list=PL123")).toBe("https://www.youtube-nocookie.com/embed/videoseries?list=PL123");
});

test("rejects other links", () => {
  for (const bad of ["", "halo", "https://evil.com/watch?v=x", "javascript:alert(1)", "https://open.spotify.com/user/x", "https://youtube.com/watch?v=a\"b"]) {
    expect(musicEmbed(bad)).toBeNull();
  }
});
