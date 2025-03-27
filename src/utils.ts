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
