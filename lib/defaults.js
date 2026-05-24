export const abilityNames = ["Strong", "Smart", "Cute"];
export const resourceNames = ["Heart", "Furr-endship"];

export const skillNames = [
  "Cook",
  "Draw & Paint",
  "Find Information",
  "Find Your Way",
  "Heal Wounds & Diseases",
  "Herbology",
  "Hide in Shadows",
  "Hiss & Growl",
  "Hunter-Gatherer",
  "Keep Calm & Carry On",
  "Knowledge of Laws & Legends",
  "Knowledge of People & Places",
  "Make Music",
  "Move Silently",
  "Pickpocket",
  "Read Sky & Stars",
  "Read, Write, Count",
  "Scratch",
  "Seduce & Charm",
  "See & Search",
  "Shake Your Booty",
  "Sweet-talk",
  "Tinker with Bits & Bobs",
  "Treating Beasts"
];

export const sources = [
  {
    title: "Character Sheets",
    url: "https://cdn.svc.asmodee.net/production-edge/uploads/2025/09/ESDAK01EN-DLC_Character-Sheets.pdf"
  },
  {
    title: "Rules Reference",
    url: "https://cdn.svc.asmodee.net/production-edge/uploads/2025/09/ESDAK01EN-DLC_Rules-Reference.pdf"
  },
  {
    title: "Mechanics Quick Reference",
    url: "https://cdn.svc.asmodee.net/production-edge/uploads/2025/10/ESDAK01EN-Game-mechanics-quick-reference.pdf"
  },
  {
    title: "PC Generator Sheet",
    url: "https://cdn.svc.asmodee.net/production-edge/uploads/2026/03/ESDAK02EN-DLC_Sheet-PCGen.pdf"
  },
  {
    title: "Blank PC Sheet",
    url: "https://cdn.svc.asmodee.net/production-edge/uploads/2026/03/ESDAK02EN-DLC_Sheet-PC-Blank.pdf"
  }
];

export const defaultRules = [
  {
    id: "rule-action",
    title: "Action",
    summary: "Roll 3d6. Each die less than or equal to the ability score is one success.",
    details: "Default action tests use 3d6. Compare every die to the selected ability.",
    tags: ["test", "core"],
    pinned: true,
    open: true
  },
  {
    id: "rule-difficulty",
    title: "Difficulty",
    summary: "Easy 1, Medium 2, Difficult 3, Legendary 4.",
    details: "The number of successes needed is set by the Storyteller.",
    tags: ["test"],
    pinned: true,
    open: true
  },
  {
    id: "rule-advantage",
    title: "Advantage / Disadvantage",
    summary: "Advantage rolls 4d6. Disadvantage rolls 2d6.",
    details: "Skills, positive traits, help, or other table rulings can shift the dice pool.",
    tags: ["test"],
    pinned: true,
    open: true
  },
  {
    id: "rule-reroll",
    title: "Useful Item",
    summary: "If an item helps, reroll one d6 you do not like.",
    details: "The table can allow one die to be rerolled after the first roll is visible.",
    tags: ["item", "test"],
    pinned: false,
    open: false
  },
  {
    id: "rule-triple",
    title: "Triple",
    summary: "A triple gives a positive side effect whether the action succeeds or fails.",
    details: "Three matching dice on a test create an extra benefit from the action.",
    tags: ["test"],
    pinned: false,
    open: false
  },
  {
    id: "rule-heart",
    title: "Heart",
    summary: "Heart is health and confidence. At 0, the character is unconscious.",
    details: "A Heart point may also be spent to recast a spell before the next morning.",
    tags: ["resource"],
    pinned: false,
    open: false
  },
  {
    id: "rule-friendship",
    title: "Furr-endship",
    summary: "Spend one to make a die a success or give one Heart to another character.",
    details: "It cannot be used to give Heart during a Catfight. A point is needed to start a Claw Catfight.",
    tags: ["resource"],
    pinned: false,
    open: false
  },
  {
    id: "rule-catfight",
    title: "Catfights",
    summary: "Non-aggressive actions keep initiative. Attacks reduce Heart by successes.",
    details:
      "Defend cancels opponent successes. Help gives advantage. Hinder gives disadvantage. Claw Catfight uses Strong/Smart plus Scratch and a weapon reroll.",
    tags: ["catfight"],
    pinned: false,
    open: false
  }
];

export function now() {
  return new Date().toISOString();
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export function makeCharacter({
  name,
  player = "",
  childhood = "",
  trait = "",
  cattribute = "",
  status = "Ready",
  strong = 3,
  smart = 3,
  cute = 3,
  heart = 6,
  friendship = 2,
  skills = [],
  backpack = "",
  spellbook = "",
  notes = ""
}) {
  const stamp = now();

  return {
    id: uid("char"),
    name,
    player,
    childhood,
    trait,
    cattribute,
    status,
    abilities: { Strong: strong, Smart: smart, Cute: cute },
    resources: {
      Heart: { current: heart, max: heart },
      "Furr-endship": { current: friendship, max: friendship }
    },
    skills,
    conditions: [],
    backpack,
    spellbook,
    notes,
    createdAt: stamp,
    updatedAt: stamp
  };
}

export function buildDefaultCampaign() {
  const stamp = now();

  return {
    schemaVersion: 1,
    id: "local-campaign",
    code: "LOCAL",
    name: "Dungeons & Kittens Table",
    sessionName: "Next Session",
    sceneStatus: "Open",
    sceneNotes: "",
    updatedAt: stamp,
    characters: [
      makeCharacter({
        name: "Sparkle",
        childhood: "Meowge",
        trait: "Brave",
        cattribute: "Mystic Mentor",
        strong: 1,
        smart: 5,
        cute: 2,
        heart: 6,
        friendship: 2,
        skills: ["Treating Beasts", "Make Music", "See & Search", "Knowledge of Laws & Legends"],
        backpack: "Small spellbook, wand, large hat, twisted walking stick, medicine pouch",
        spellbook: "Care of Beasts; Enchanting Voice; Care; Talk to Trees"
      }),
      makeCharacter({
        name: "Bobbin",
        childhood: "Country Kitten",
        trait: "Grouchy",
        cattribute: "Animal Companion",
        strong: 5,
        smart: 2,
        cute: 1,
        heart: 7,
        friendship: 1,
        skills: ["Hunter-Gatherer", "Find Your Way", "Treating Beasts"],
        backpack: "Bird call, cereal bars, large straw hat, fork, dried insects",
        spellbook: "Slipper Patrol; Long Night"
      }),
      makeCharacter({
        name: "Camilla Bellefleur",
        childhood: "Young Noble",
        trait: "Stubborn",
        cattribute: "Inheritance",
        strong: 1,
        smart: 2,
        cute: 5,
        heart: 3,
        friendship: 5,
        skills: ["Seduce & Charm", "Sweet-talk", "Make Music"],
        backpack: "Fancy clothes, luxury fur comb, carnival masks, perfume, crystal rose",
        spellbook: "Sound & Vision; Long View"
      }),
      makeCharacter({
        name: "Dart",
        childhood: "Soldier's Child",
        trait: "Shy",
        cattribute: "Heroic Lineage",
        strong: 5,
        smart: 2,
        cute: 1,
        heart: 7,
        friendship: 2,
        skills: ["Scratch", "Keep Calm & Carry On", "Find Your Way"],
        backpack: "Light armor, bow and arrows, shiny knickknacks, mushroom guidebook, rusty sword",
        spellbook: "Fearless; Quick as a Flash"
      }),
      makeCharacter({
        name: "Cheesy",
        childhood: "Catnut",
        trait: "Funny",
        cattribute: "Disguise",
        strong: 5,
        smart: 1,
        cute: 2,
        heart: 6,
        friendship: 2,
        skills: ["Hide in Shadows", "Sweet-talk", "Move Silently"],
        backpack: "Cheese knife, round Cheddar, cape of leaves, rags and ribbons, joke book",
        spellbook: "Heart Charm; Cat Haven"
      })
    ],
    rules: defaultRules,
    rolls: [],
    log: [
      {
        id: uid("log"),
        type: "system",
        text: "Campaign cache created.",
        createdAt: stamp
      }
    ]
  };
}
