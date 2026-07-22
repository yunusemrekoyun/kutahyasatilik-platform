import { describe, expect, it } from "vitest";
import { groupListingAmenities, listingAmenityRows } from "../lib/listingAmenities";

describe("controlled listing amenities", () => {
  it("drops unknown values and deduplicates imported keys", () => {
    const rows = listingAmenityRows(["elevator", "unknown", "elevator", "water"]);

    expect(rows.map((row) => row.key)).toEqual(["elevator", "water"]);
    expect(rows.every((row) => row.sortOrder >= 0)).toBe(true);
  });

  it("groups public labels without exposing raw keys", () => {
    expect(groupListingAmenities(["elevator", "security", "nature_view"])).toMatchObject([
      { key: "building", label: "Bina ve site", items: [{ label: "Asansör" }, { label: "Güvenlik" }] },
      { key: "view", label: "Manzara", items: [{ label: "Doğa manzarası" }] },
    ]);
  });
});
