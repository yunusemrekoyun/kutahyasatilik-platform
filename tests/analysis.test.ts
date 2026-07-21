import { describe, expect, it } from "vitest";
import { buildAnalysis } from "../lib/analysis";

describe("buildAnalysis", () => {
  it("uses district data without changing the valuation inputs", () => {
    const result = buildAnalysis(
      { id: "1", title: "Daire", propertyType: "daire", district: "Merkez", price: 1_000_000 },
      { name: "Merkez", investmentScore: 80, valueGrowth3yPct: 25, valueGrowth5yPct: 45 },
    );
    expect(result.investmentScore).toBe(80);
    expect(result.growth3y).toBe(25);
    expect(result.regionText).toContain("Merkez");
  });
});
