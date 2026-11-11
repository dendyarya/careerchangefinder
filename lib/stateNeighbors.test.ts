import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { STATE_NEIGHBORS } from "./stateNeighbors";

describe("state borders", () => {
  it("covers the 50 states and DC", () => {
    const totals = JSON.parse(fs.readFileSync("data/processed/state_totals.json", "utf8"));
    expect(Object.keys(STATE_NEIGHBORS).sort()).toEqual(Object.keys(totals).sort());
  });
  it("is symmetric", () => {
    for (const [a, list] of Object.entries(STATE_NEIGHBORS)) for (const b of list) expect(STATE_NEIGHBORS[b]).toContain(a);
  });
});
