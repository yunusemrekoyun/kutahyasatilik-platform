export type ListingAmenityDefinition = {
  key: string;
  label: string;
  group: string;
  groupLabel: string;
  propertyTypes?: string[];
};

export const LISTING_AMENITIES: ListingAmenityDefinition[] = [
  { key: "built_in_kitchen", label: "Ankastre mutfak", group: "interior", groupLabel: "İç özellikler" },
  { key: "ensuite_bathroom", label: "Ebeveyn banyosu", group: "interior", groupLabel: "İç özellikler" },
  { key: "dressing_room", label: "Giyinme odası", group: "interior", groupLabel: "İç özellikler" },
  { key: "pantry", label: "Kiler", group: "interior", groupLabel: "İç özellikler" },
  { key: "fireplace", label: "Şömine", group: "interior", groupLabel: "İç özellikler" },
  { key: "air_conditioning", label: "Klima", group: "interior", groupLabel: "İç özellikler" },
  { key: "underfloor_heating", label: "Yerden ısıtma", group: "interior", groupLabel: "İç özellikler" },
  { key: "thermal_insulation", label: "Isı yalıtımı", group: "interior", groupLabel: "İç özellikler" },
  { key: "sound_insulation", label: "Ses yalıtımı", group: "interior", groupLabel: "İç özellikler" },
  { key: "fiber_internet", label: "Fiber internet", group: "interior", groupLabel: "İç özellikler" },

  { key: "elevator", label: "Asansör", group: "building", groupLabel: "Bina ve site" },
  { key: "closed_parking", label: "Kapalı otopark", group: "building", groupLabel: "Bina ve site" },
  { key: "security", label: "Güvenlik", group: "building", groupLabel: "Bina ve site" },
  { key: "generator", label: "Jeneratör", group: "building", groupLabel: "Bina ve site" },
  { key: "swimming_pool", label: "Yüzme havuzu", group: "building", groupLabel: "Bina ve site" },
  { key: "gym", label: "Spor alanı", group: "building", groupLabel: "Bina ve site" },
  { key: "playground", label: "Çocuk oyun alanı", group: "building", groupLabel: "Bina ve site" },

  { key: "public_transport", label: "Toplu ulaşıma yakın", group: "surroundings", groupLabel: "Çevre ve ulaşım" },
  { key: "school", label: "Okula yakın", group: "surroundings", groupLabel: "Çevre ve ulaşım" },
  { key: "hospital", label: "Sağlık kuruluşuna yakın", group: "surroundings", groupLabel: "Çevre ve ulaşım" },
  { key: "market", label: "Markete yakın", group: "surroundings", groupLabel: "Çevre ve ulaşım" },
  { key: "city_center", label: "Şehir merkezine yakın", group: "surroundings", groupLabel: "Çevre ve ulaşım" },

  { key: "accessible_entrance", label: "Erişilebilir giriş / rampa", group: "accessibility", groupLabel: "Erişilebilirlik" },
  { key: "accessible_elevator", label: "Erişilebilir asansör", group: "accessibility", groupLabel: "Erişilebilirlik" },
  { key: "accessible_bathroom", label: "Erişilebilir banyo", group: "accessibility", groupLabel: "Erişilebilirlik" },

  { key: "city_view", label: "Şehir manzarası", group: "view", groupLabel: "Manzara" },
  { key: "nature_view", label: "Doğa manzarası", group: "view", groupLabel: "Manzara" },
  { key: "lake_view", label: "Göl manzarası", group: "view", groupLabel: "Manzara" },

  { key: "road_frontage", label: "Yola cepheli", group: "land", groupLabel: "Arsa ve altyapı", propertyTypes: ["arsa", "tarla"] },
  { key: "electricity", label: "Elektrik", group: "land", groupLabel: "Arsa ve altyapı", propertyTypes: ["arsa", "tarla"] },
  { key: "water", label: "Su", group: "land", groupLabel: "Arsa ve altyapı", propertyTypes: ["arsa", "tarla"] },
  { key: "natural_gas", label: "Doğalgaz", group: "land", groupLabel: "Arsa ve altyapı", propertyTypes: ["arsa", "tarla"] },
];

const AMENITY_BY_KEY = new Map(LISTING_AMENITIES.map((item) => [item.key, item]));

export function resolveListingAmenities(keys: string[]) {
  return keys
    .map((key) => AMENITY_BY_KEY.get(key))
    .filter((item): item is ListingAmenityDefinition => Boolean(item));
}

export function groupListingAmenities(keys: string[]) {
  const groups = new Map<string, { label: string; items: ListingAmenityDefinition[] }>();
  for (const item of resolveListingAmenities(keys)) {
    const current = groups.get(item.group) ?? { label: item.groupLabel, items: [] };
    current.items.push(item);
    groups.set(item.group, current);
  }
  return Array.from(groups.entries()).map(([key, value]) => ({ key, ...value }));
}

export function listingAmenityRows(keys: string[]) {
  const unique = Array.from(new Set(keys));
  return unique.flatMap((key) => {
    const item = AMENITY_BY_KEY.get(key);
    if (!item) return [];
    return [{
      key: item.key,
      label: item.label,
      group: item.group,
      sortOrder: LISTING_AMENITIES.findIndex((candidate) => candidate.key === item.key),
    }];
  });
}
