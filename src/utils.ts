const SPHEREMAP_PATH = "/resources/spheremaps";

export const spheremapImages = [
  "blue_local_star_1.jpg",
  "hazy_nebulae_3.jpg",
  "plain_starfield_2.jpg",
  "subdued_multi_nebulae_2.jpg",
  "blue_nebulae_1.jpg",
  "multi_nebulae_1.jpg",
  "red_local_star_1.jpg",
  "volcanic_asteroid_field_2.jpg",
  "brown_dwarf.jpg",
  "multi_nebulae_2.jpg",
  "red_local_star_no_nebulae.jpg",
  "white_dwarf_star.jpg",
  "galactic_plane_hazy_nebulae_1.jpg",
  "multi_nebulae_3.jpg",
  "ringed_brown_dwarf.jpg",
].map((file) => `${SPHEREMAP_PATH}/${file}`);

export function getRandomSpheremap() {
  const randomIndex = Math.floor(Math.random() * spheremapImages.length);
  return spheremapImages[randomIndex];
}

export function generatePlanetName(): string {
  const prefixes = [
    "Zor",
    "Vel",
    "Xan",
    "Ark",
    "Nyx",
    "Tyr",
    "Eon",
    "Qua",
    "Vex",
    "Lum",
    "Thal",
    "Kry",
    "Juno",
  ];
  const suffixes = [
    "ara",
    "ion",
    "is",
    "ar",
    "os",
    "ea",
    "eth",
    "us",
    "on",
    "yx",
    "um",
    "ir",
  ];
  const tags = [
    "",
    "",
    "",
    " Prime",
    " Minor",
    " Major",
    " Station",
    " Outpost",
    " Colony",
    " IV",
    " VII",
    "-9",
    "-X",
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const tag = tags[Math.floor(Math.random() * tags.length)];

  return prefix + suffix + tag;
}
