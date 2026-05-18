import { describe, expect, it } from "vitest";

import { getAgentFromProperty } from "./propertyDetailsDisplayHelpers";

describe("getAgentFromProperty", () => {
  it("reads nested listingAgent.photo.url (Slipstream / RESO-style)", () => {
    const property = {
      listingAgent: {
        name: "Jane Doe",
        photo: { url: "https://cdn.example.com/agent.jpg" },
      },
      listingOffice: { name: "Brokerage" },
    };
    const out = getAgentFromProperty(property);
    expect(out.imageUrl).toBe("https://cdn.example.com/agent.jpg");
    expect(out.displayName).toBe("Jane Doe");
    expect(out.hasAgent).toBe(true);
  });

  it("reads listing_agent snake_case and photoUrl string", () => {
    const property = {
      listing_agent: {
        name: "Bob Smith",
        photoUrl: "https://photos.example.com/b.jpg",
      },
    };
    const out = getAgentFromProperty(property);
    expect(out.imageUrl).toBe("https://photos.example.com/b.jpg");
    expect(out.displayName).toBe("Bob Smith");
  });

  it("reads listed_by image_url and camelCase fallbacks", () => {
    const property = {
      listed_by: {
        display_name: "Listed By Agent",
        image_url: "https://zillow.example.com/a.png",
      },
    };
    expect(getAgentFromProperty(property).imageUrl).toBe("https://zillow.example.com/a.png");

    const camel = {
      listed_by: {
        display_name: "Agent",
        imageUrl: "https://zillow.example.com/c.png",
      },
    };
    expect(getAgentFromProperty(camel).imageUrl).toBe("https://zillow.example.com/c.png");
  });
});
