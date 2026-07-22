import type { NextRequest } from "next/server";
import { absolutizeUrl } from "@/lib/apiMedia";
import type {
  PublicAgencyCard,
  PublicAgencyProfile,
  PublicAgentCard,
  PublicAgentProfile,
  PublicListingCard,
} from "@/lib/publicDirectory";

function listingForApi(listing: PublicListingCard, request: NextRequest) {
  return {
    ...listing,
    coverImage: absolutizeUrl(listing.coverImage, request),
    agentLogo: absolutizeUrl(listing.agentLogo, request),
  };
}

export function agencyCardForApi(agency: PublicAgencyCard, request: NextRequest) {
  return {
    ...agency,
    logo: absolutizeUrl(agency.logo, request),
    coverImage: absolutizeUrl(agency.coverImage, request),
  };
}

export function adviserCardForApi(adviser: PublicAgentCard, request: NextRequest) {
  return {
    ...adviser,
    logo: absolutizeUrl(adviser.logo, request),
  };
}

export function agencyProfileForApi(agency: PublicAgencyProfile, request: NextRequest) {
  return {
    ...agencyCardForApi(agency, request),
    phone: agency.phone,
    whatsapp: agency.whatsapp,
    website: agency.website,
    agents: agency.agents.map((agent) => adviserCardForApi(agent, request)),
    listings: agency.listings.map((listing) => listingForApi(listing, request)),
  };
}

export function adviserProfileForApi(adviser: PublicAgentProfile, request: NextRequest) {
  return {
    ...adviserCardForApi(adviser, request),
    phone: adviser.phone,
    whatsapp: adviser.whatsapp,
    listings: adviser.listings.map((listing) => listingForApi(listing, request)),
  };
}
