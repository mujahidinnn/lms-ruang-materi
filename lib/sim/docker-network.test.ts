import { expect, test } from "vitest";
import { commands, hostToWeb, webToDb } from "./docker-network";

test("DNS nama hanya di network buatan sendiri; IP selalu bisa", () => {
  expect(webToDb("bridge", "name").ok).toBe(false);
  expect(webToDb("user", "name").ok).toBe(true);
  expect(webToDb("bridge", "ip").ok).toBe(true);
  expect(webToDb("user", "ip").ok).toBe(true);
});

test("host hanya menjangkau lewat port publish", () => {
  expect(hostToWeb(false).ok).toBe(false);
  expect(hostToWeb(true).ok).toBe(true);
});

test("command mengikuti pilihan", () => {
  const c = commands("user", true);
  expect(c[0]).toBe("docker network create app-net");
  expect(c.join()).toContain("-p 8080:80");
  expect(commands("bridge", false).join()).not.toContain("--network");
});
