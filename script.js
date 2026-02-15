const fs = require("fs");

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.log("Usage: node convert-pokedex.js <input.txt> <output.ts>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");

// 🔥 SPLIT POR [POKEMON]
const blocks = raw.split(/\[(.*?)\]/g).slice(1);

const pokedexEntries = [];

for (let i = 0; i < blocks.length; i += 2) {
  const id = blocks[i];
  const data = blocks[i + 1];

  if (!data) continue;

  const name = (data.match(/Name\s*=\s*(.*)/i)?.[1] || id).trim();

  const types =
    data
      .match(/Types\s*=\s*(.*)/i)?.[1]
      ?.split(",")
      .map(
        (t) =>
          `"${t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase()}"`,
      )
      .join(", ") || '"Normal"';

  const statsRaw = data.match(/BaseStats\s*=\s*(.*)/i)?.[1];
  if (!statsRaw) continue;

  const [hp, atk, def, spe, spa, spd] = statsRaw.split(",").map(Number);

  const abilities =
    data
      .match(/Abilities\s*=\s*(.*)/i)?.[1]
      ?.split(",")
      .map(
        (a, i) =>
          `${i}: "${a.trim().charAt(0).toUpperCase() + a.trim().slice(1).toLowerCase()}"`,
      )
      .join(", ") || "";

  const hidden = data.match(/HiddenAbilities\s*=\s*(.*)/i)?.[1];

  const abilityBlock = hidden
    ? `{ ${abilities}, H: "${hidden.trim().charAt(0).toUpperCase() + hidden.trim().slice(1).toLowerCase()}" }`
    : `{ ${abilities} }`;

  const egg =
    data
      .match(/EggGroups\s*=\s*(.*)/i)?.[1]
      ?.split(",")
      .map((e) => `"${e.trim()}"`)
      .join(", ") || '"Undiscovered"';

  const height = data.match(/Height\s*=\s*(.*)/i)?.[1] || 1.0;
  const weight = data.match(/Weight\s*=\s*(.*)/i)?.[1] || 1.0;
  const color = data.match(/Color\s*=\s*(.*)/i)?.[1] || "Blue";

  pokedexEntries.push(`
${id.toLowerCase()}: {
  num: 0,
  name: "${name}",
  types: [${types}],
  baseStats: { hp: ${hp}, atk: ${atk}, def: ${def}, spa: ${spa}, spd: ${spd}, spe: ${spe} },
  abilities: ${abilityBlock},
  heightm: ${height},
  weightkg: ${weight},
  color: "${color}",
  eggGroups: [${egg}],
},`);
}

const final = `export const Pokedex: import('../sim/dex-species').SpeciesDataTable = {${pokedexEntries.join("\n")}
};
`;

fs.writeFileSync(outputPath, final);
console.log(`✅ Converted ${pokedexEntries.length} Pokémon`);
