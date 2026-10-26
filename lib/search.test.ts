import { describe, expect, it } from "vitest";
import { formatPay, matchHub, searchCareers, type SearchEntry } from "./search";

const index: SearchEntry[] = [
  { s: "registered-nurses", t: "Registered Nurses", a: ["Charge Nurse", "RN"], p: 97550 },
  { s: "nurse-practitioners", t: "Nurse Practitioners", a: [], p: 132050 },
  {
    s: "middle-school-teachers",
    t: "Middle School Teachers, Except Special and Career/Technical Education",
    a: [],
    p: 64370,
  },
  { s: "tutors", t: "Tutors", a: ["Math Teacher", "Reading Tutor"], p: 41830 },
  { s: "data-scientists", t: "Data Scientists", a: ["Machine Learning Engineer"], p: null },
];
const hubs = [
  { slug: "teacher", singular: "Teacher", plural: "Teachers" },
  { slug: "nurse", singular: "Nurse", plural: "Nurses" },
];

describe("searchCareers", () => {
  it("ranks title matches by number of workers", () => {
    const withEmp = index.map((e) => ({ ...e, e: e.s === "registered-nurses" ? 3_300_000 : 300_000 }));
    expect(searchCareers(withEmp, "nurse").map((h) => h.slug)).toEqual(["registered-nurses", "nurse-practitioners"]);
  });
  it("finds careers by alternate title and reports which one matched", () => {
    const r = searchCareers(index, "machine learning");
    expect(r[0]).toMatchObject({ slug: "data-scientists", matchedAlt: "Machine Learning Engineer" });
  });
  it("puts title matches before alternate-title matches", () => {
    expect(searchCareers(index, "teach").map((h) => h.slug)).toEqual(["middle-school-teachers", "tutors"]);
  });
  it("ignores case, punctuation and 1-letter queries", () => {
    expect(searchCareers(index, "REGISTERED, nurses")[0]!.slug).toBe("registered-nurses");
    expect(searchCareers(index, "n")).toEqual([]);
  });
  it("respects the limit", () => {
    expect(searchCareers(index, "nurse", 1)).toHaveLength(1);
  });
});

describe("matchHub", () => {
  it("maps partial words to a hub", () => {
    expect(matchHub(hubs, "teach")?.slug).toBe("teacher");
    expect(matchHub(hubs, "teachers")?.slug).toBe("teacher");
    expect(matchHub(hubs, "data")).toBeNull();
  });
});

it("formats pay in US dollars", () => {
  expect(formatPay(97550)).toBe("$97,550");
});
