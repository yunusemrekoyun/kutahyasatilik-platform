import { describe, expect, it } from "vitest";
import { buildWhere } from "../lib/listingFilters";

describe("buildWhere directory ownership", () => {
  it("limits agency portfolios to approved, published owners and active listings", () => {
    expect(buildWhere({ agencySlug: "ornek-ofis" })).toMatchObject({
      status: "active",
      moderationStatus: "approved",
      agencyRef: {
        is: { slug: "ornek-ofis", status: "approved", published: true },
      },
    });
  });

  it("limits adviser portfolios to approved public profiles and active listings", () => {
    expect(buildWhere({ agentSlug: "ornek-danisman" })).toMatchObject({
      status: "active",
      moderationStatus: "approved",
      agent: {
        is: { slug: "ornek-danisman", status: "approved", publicProfile: true },
      },
    });
  });
});
