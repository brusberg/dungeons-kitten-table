"use client";

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Eye,
  FileText,
  Heart,
  ListChecks,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "table-kit:campaign:v1";
const UI_KEY = "table-kit:ui:v1";

const abilityNames = ["Strong", "Smart", "Cute"];
const resourceNames = ["Heart", "Furr-endship"];
const skillNames = [
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

const sources = [
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

const defaultRules = [
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
    details: "Defend cancels opponent successes. Help gives advantage. Hinder gives disadvantage. Claw Catfight uses Strong/Smart plus Scratch and a weapon reroll.",
    tags: ["catfight"],
    pinned: false,
    open: false
  }
];

function now() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function makeCharacter({
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
    visibility: "public",
    createdAt: stamp,
    updatedAt: stamp
  };
}

function buildDefaultCampaign() {
  const stamp = now();

  return {
    schemaVersion: 1,
    id: "local-campaign",
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

function clamp(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function countSuccesses(dice, target) {
  return dice.filter((die) => die <= target).length;
}

function hasTriple(dice) {
  return new Set(dice).size < dice.length && dice.some((die) => dice.filter((item) => item === die).length >= 3);
}

function formatTime(iso) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function Stepper({ value, min = 0, max = 10, onChange, label }) {
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1, min, max))} aria-label={`Lower ${label}`}>
        -
      </button>
      <input
        value={value}
        onChange={(event) => onChange(clamp(event.target.value, min, max))}
        aria-label={label}
        inputMode="numeric"
      />
      <button type="button" onClick={() => onChange(clamp(value + 1, min, max))} aria-label={`Raise ${label}`}>
        +
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextBlock({ label, value, onChange, rows = 4 }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} />
    </label>
  );
}

function IconButton({ children, label, className = "", ...props }) {
  return (
    <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

function PillButton({ active, children, className = "", ...props }) {
  return (
    <button className={`pill-button ${active ? "is-active" : ""} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}

export default function Home() {
  const [campaign, setCampaign] = useState(null);
  const [view, setView] = useState("story");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [saveState, setSaveState] = useState("Loaded");
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("Storyteller");
  const [rollConfig, setRollConfig] = useState({
    diceCount: 3,
    target: 3,
    ability: "Strong",
    difficulty: 2,
    allowReroll: true,
    characterId: "",
    label: "Action test"
  });
  const [currentRoll, setCurrentRoll] = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    let initial = buildDefaultCampaign();
    let initialUi = null;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.schemaVersion === 1 && Array.isArray(parsed.characters)) {
          initial = parsed;
        }
      }
    } catch (error) {
      initial.log.unshift({
        id: uid("log"),
        type: "system",
        text: "Recovered from an unreadable local cache.",
        createdAt: now()
      });
    }

    try {
      const storedUi = window.localStorage.getItem(UI_KEY);
      if (storedUi) initialUi = JSON.parse(storedUi);
    } catch {
      initialUi = null;
    }

    setCampaign(initial);
    setSelectedCharacterId(initialUi?.selectedCharacterId || initial.characters[0]?.id || "");
    setView(initialUi?.view || "story");
    setRole(initialUi?.role || "Storyteller");
    setRollConfig((config) => ({
      ...config,
      characterId: initial.characters[0]?.id || "",
      target: initial.characters[0]?.abilities?.Strong || 3
    }));
  }, []);

  useEffect(() => {
    if (!campaign) return;

    setSaveState("Saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...campaign, updatedAt: now() }));
      setSaveState("Saved");
    }, 160);

    return () => window.clearTimeout(timer);
  }, [campaign]);

  useEffect(() => {
    if (!campaign) return;

    window.localStorage.setItem(
      UI_KEY,
      JSON.stringify({
        view,
        selectedCharacterId,
        role
      })
    );
  }, [campaign, role, selectedCharacterId, view]);

  const selectedCharacter = useMemo(() => {
    if (!campaign) return null;
    return campaign.characters.find((character) => character.id === selectedCharacterId) || campaign.characters[0] || null;
  }, [campaign, selectedCharacterId]);

  const rollCharacter = useMemo(() => {
    if (!campaign) return null;
    return campaign.characters.find((character) => character.id === rollConfig.characterId) || null;
  }, [campaign, rollConfig.characterId]);

  const filteredRules = useMemo(() => {
    if (!campaign) return [];
    const term = searchTerm.trim().toLowerCase();
    const sorted = [...campaign.rules].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    if (!term) return sorted;

    return sorted.filter((rule) => {
      const haystack = `${rule.title} ${rule.summary} ${rule.details} ${rule.tags.join(" ")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [campaign, searchTerm]);

  function patchCampaign(patcher) {
    setCampaign((current) => {
      const next = typeof patcher === "function" ? patcher(current) : patcher;
      return { ...next, updatedAt: now() };
    });
  }

  function updateCharacter(id, patch) {
    patchCampaign((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === id ? { ...character, ...patch, updatedAt: now() } : character
      )
    }));
  }

  function updateCharacterDeep(id, updater) {
    patchCampaign((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === id ? { ...updater(character), updatedAt: now() } : character
      )
    }));
  }

  function addLog(text, type = "note") {
    patchCampaign((current) => ({
      ...current,
      log: [{ id: uid("log"), type, text, createdAt: now() }, ...current.log].slice(0, 80)
    }));
  }

  function addCharacter() {
    const character = makeCharacter({ name: "New Character", heart: 6, friendship: 2 });
    patchCampaign((current) => ({ ...current, characters: [...current.characters, character] }));
    setSelectedCharacterId(character.id);
    setView("character");
  }

  function removeCharacter(id) {
    patchCampaign((current) => {
      const nextCharacters = current.characters.filter((character) => character.id !== id);
      return { ...current, characters: nextCharacters };
    });
    if (selectedCharacterId === id) {
      setSelectedCharacterId(campaign.characters.find((character) => character.id !== id)?.id || "");
    }
  }

  function addCondition(id, condition) {
    const trimmed = condition.trim();
    if (!trimmed) return;
    updateCharacterDeep(id, (character) => ({
      ...character,
      conditions: [...character.conditions, trimmed]
    }));
  }

  function removeCondition(id, condition) {
    updateCharacterDeep(id, (character) => ({
      ...character,
      conditions: character.conditions.filter((item) => item !== condition)
    }));
  }

  function updateResource(characterId, resource, key, value) {
    updateCharacterDeep(characterId, (character) => ({
      ...character,
      resources: {
        ...character.resources,
        [resource]: {
          ...character.resources[resource],
          [key]: clamp(value, 0, 20)
        }
      }
    }));
  }

  function updateRule(ruleId, patch) {
    patchCampaign((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule))
    }));
  }

  function addRule() {
    patchCampaign((current) => ({
      ...current,
      rules: [
        {
          id: uid("rule"),
          title: "Custom Rule",
          summary: "",
          details: "",
          tags: ["custom"],
          pinned: false,
          open: true
        },
        ...current.rules
      ]
    }));
    setView("rules");
  }

  function deleteRule(ruleId) {
    patchCampaign((current) => ({
      ...current,
      rules: current.rules.filter((rule) => rule.id !== ruleId)
    }));
  }

  function syncRollTarget(characterId, ability) {
    const character = campaign?.characters.find((item) => item.id === characterId);
    const target = character?.abilities?.[ability] || rollConfig.target;

    setRollConfig((config) => ({
      ...config,
      characterId,
      ability,
      target
    }));
  }

  function performRoll(overrides = {}) {
    const config = { ...rollConfig, ...overrides };
    const dice = Array.from({ length: config.diceCount }, rollDie);
    const target = clamp(config.target, 1, 6);
    const stamp = now();
    const character = campaign?.characters.find((item) => item.id === config.characterId);
    const roll = {
      id: uid("roll"),
      dice,
      originalDice: dice,
      rerolledIndex: null,
      target,
      ability: config.ability,
      difficulty: config.difficulty,
      diceCount: config.diceCount,
      allowReroll: config.allowReroll,
      label: config.label || `${config.ability} test`,
      characterId: config.characterId,
      characterName: character?.name || "Unassigned",
      createdAt: stamp
    };

    const resolved = resolveRoll(roll);
    setCurrentRoll(resolved);
    saveRoll(resolved, "roll");
  }

  function resolveRoll(roll) {
    const successes = countSuccesses(roll.dice, roll.target);
    return {
      ...roll,
      successes,
      passed: successes >= roll.difficulty,
      triple: hasTriple(roll.dice)
    };
  }

  function saveRoll(roll, logType) {
    const text = `${roll.characterName}: ${roll.label} (${roll.diceCount}d6 vs ${roll.target}) -> ${roll.successes} success${roll.successes === 1 ? "" : "es"}${roll.triple ? ", triple" : ""}`;

    patchCampaign((current) => ({
      ...current,
      rolls: [roll, ...current.rolls.filter((item) => item.id !== roll.id)].slice(0, 60),
      log:
        logType === "roll"
          ? [{ id: uid("log"), type: "roll", text, createdAt: now() }, ...current.log].slice(0, 80)
          : current.log
    }));
  }

  function rerollDie(index) {
    if (!currentRoll || currentRoll.rerolledIndex !== null || !currentRoll.allowReroll) return;

    const dice = currentRoll.dice.map((die, dieIndex) => (dieIndex === index ? rollDie() : die));
    const nextRoll = resolveRoll({ ...currentRoll, dice, rerolledIndex: index });
    setCurrentRoll(nextRoll);
    saveRoll(nextRoll, "roll");
  }

  function exportCampaign() {
    const payload = {
      format: "table-kit-campaign",
      schemaVersion: 1,
      exportedAt: now(),
      campaign
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${campaign.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-campaign.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCampaign(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const imported = parsed.campaign || parsed;
      if (!Array.isArray(imported.characters) || !Array.isArray(imported.rules)) {
        throw new Error("Invalid campaign shape.");
      }

      patchCampaign({
        ...imported,
        id: imported.id || uid("campaign"),
        schemaVersion: 1,
        updatedAt: now()
      });
      setSelectedCharacterId(imported.characters[0]?.id || "");
      addLog("Campaign imported.", "system");
    } catch {
      addLog("Import failed. The JSON file was not a campaign export.", "system");
    } finally {
      event.target.value = "";
    }
  }

  function resetCampaign() {
    const fresh = buildDefaultCampaign();
    patchCampaign(fresh);
    setSelectedCharacterId(fresh.characters[0]?.id || "");
    setCurrentRoll(null);
  }

  if (!campaign) {
    return (
      <main className="app-shell loading-shell">
        <div className="loading-card">
          <Sparkles />
          <span>Loading table cache</span>
        </div>
      </main>
    );
  }

  const nav = [
    { id: "story", label: "Story", icon: Eye },
    { id: "character", label: "Sheet", icon: FileText },
    { id: "dice", label: "Dice", icon: Sparkles },
    { id: "rules", label: "Rules", icon: BookOpen }
  ];

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand-mark">
          <span>TK</span>
        </div>
        <nav aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className={view === item.id ? "rail-button is-active" : "rail-button"}
                key={item.id}
                onClick={() => setView(item.id)}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="top-bar">
          <div className="title-stack">
            <label className="eyebrow" htmlFor="campaign-name">
              Campaign
            </label>
            <input
              id="campaign-name"
              className="campaign-title"
              value={campaign.name}
              onChange={(event) => patchCampaign({ ...campaign, name: event.target.value })}
            />
          </div>

          <div className="top-actions">
            <div className="role-toggle" aria-label="Editing role">
              {["Storyteller", "Player"].map((item) => (
                <PillButton key={item} active={role === item} onClick={() => setRole(item)}>
                  {item}
                </PillButton>
              ))}
            </div>
            <span className="save-state">
              <Save size={15} />
              {saveState}
            </span>
          </div>
        </header>

        {view === "story" && (
          <StoryView
            campaign={campaign}
            setCampaign={patchCampaign}
            onAddCharacter={addCharacter}
            onSelectCharacter={(id) => {
              setSelectedCharacterId(id);
              setView("character");
            }}
            onUpdateCharacter={updateCharacter}
            onUpdateResource={updateResource}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
            onQuickRoll={(character, diceCount = 3) => {
              syncRollTarget(character.id, "Strong");
              setView("dice");
              performRoll({
                characterId: character.id,
                ability: "Strong",
                target: character.abilities.Strong,
                diceCount,
                label: "Quick Strong test"
              });
            }}
            addLog={addLog}
          />
        )}

        {view === "character" && (
          <CharacterView
            characters={campaign.characters}
            selectedCharacter={selectedCharacter}
            selectedCharacterId={selectedCharacterId}
            setSelectedCharacterId={setSelectedCharacterId}
            onAddCharacter={addCharacter}
            onRemoveCharacter={removeCharacter}
            onUpdateCharacter={updateCharacter}
            onUpdateCharacterDeep={updateCharacterDeep}
            onUpdateResource={updateResource}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
            onRoll={(character, ability, diceCount) => {
              syncRollTarget(character.id, ability);
              setView("dice");
              performRoll({
                characterId: character.id,
                ability,
                target: character.abilities[ability],
                diceCount,
                label: `${ability} test`
              });
            }}
          />
        )}

        {view === "dice" && (
          <DiceView
            campaign={campaign}
            rollConfig={rollConfig}
            setRollConfig={setRollConfig}
            currentRoll={currentRoll}
            performRoll={performRoll}
            rerollDie={rerollDie}
            syncRollTarget={syncRollTarget}
          />
        )}

        {view === "rules" && (
          <RulesView
            rules={filteredRules}
            allRules={campaign.rules}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            updateRule={updateRule}
            addRule={addRule}
            deleteRule={deleteRule}
            addLog={addLog}
          />
        )}
      </section>

      <aside className="utility-panel">
        <section className="utility-card dice-card">
          <div className="section-heading">
            <h2>Roll</h2>
            <IconButton label="Open dice" onClick={() => setView("dice")}>
              <Sparkles size={18} />
            </IconButton>
          </div>
          <div className="quick-dice">
            {[2, 3, 4].map((count) => (
              <button key={count} type="button" onClick={() => performRoll({ diceCount: count })}>
                {count}d6
              </button>
            ))}
          </div>
          {currentRoll && <RollResult roll={currentRoll} onReroll={rerollDie} compact />}
        </section>

        <section className="utility-card">
          <div className="section-heading">
            <h2>Cache</h2>
            <span className="mini-meta">v{campaign.schemaVersion}</span>
          </div>
          <div className="cache-actions">
            <button type="button" onClick={exportCampaign}>
              <Download size={16} />
              Export
            </button>
            <button type="button" onClick={() => importRef.current?.click()}>
              <Upload size={16} />
              Import
            </button>
            <button type="button" className="danger-soft" onClick={resetCampaign}>
              <RefreshCcw size={16} />
              Reset
            </button>
            <input ref={importRef} className="hidden-file" type="file" accept="application/json" onChange={importCampaign} />
          </div>
        </section>

        <section className="utility-card">
          <div className="section-heading">
            <h2>Sources</h2>
            <BookOpen size={17} />
          </div>
          <div className="source-list">
            {sources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.title}>
                {source.title}
              </a>
            ))}
          </div>
        </section>
      </aside>

      <nav className="bottom-nav" aria-label="Primary">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              className={view === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => setView(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function StoryView({
  campaign,
  setCampaign,
  onAddCharacter,
  onSelectCharacter,
  onUpdateCharacter,
  onUpdateResource,
  onAddCondition,
  onRemoveCondition,
  onQuickRoll,
  addLog
}) {
  const [conditionDrafts, setConditionDrafts] = useState({});
  const [logDraft, setLogDraft] = useState("");

  return (
    <div className="view-grid story-grid">
      <section className="content-panel span-2">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Storyteller</p>
            <h1>All Characters</h1>
          </div>
          <button type="button" className="primary-action" onClick={onAddCharacter}>
            <Plus size={17} />
            Character
          </button>
        </div>

        <div className="character-overview">
          {campaign.characters.map((character) => (
            <article className="character-card" key={character.id}>
              <div className="character-card-top">
                <button type="button" className="avatar-button" onClick={() => onSelectCharacter(character.id)}>
                  {character.name.slice(0, 2).toUpperCase()}
                </button>
                <div className="card-title-fields">
                  <input
                    value={character.name}
                    onChange={(event) => onUpdateCharacter(character.id, { name: event.target.value })}
                    aria-label={`${character.name} name`}
                  />
                  <input
                    value={character.player}
                    onChange={(event) => onUpdateCharacter(character.id, { player: event.target.value })}
                    placeholder="Player"
                    aria-label={`${character.name} player`}
                  />
                </div>
                <IconButton label={`Open ${character.name}`} onClick={() => onSelectCharacter(character.id)}>
                  <Edit3 size={16} />
                </IconButton>
              </div>

              <div className="mini-stats">
                {abilityNames.map((ability) => (
                  <label key={ability}>
                    <span>{ability}</span>
                    <input
                      value={character.abilities[ability]}
                      onChange={(event) =>
                        onUpdateCharacter(character.id, {
                          abilities: {
                            ...character.abilities,
                            [ability]: clamp(event.target.value, 1, 6)
                          }
                        })
                      }
                      inputMode="numeric"
                    />
                  </label>
                ))}
              </div>

              <div className="resource-row">
                {resourceNames.map((resource) => (
                  <div className="resource-pill" key={resource}>
                    <span>{resource}</span>
                    <Stepper
                      label={`${character.name} ${resource}`}
                      value={character.resources[resource].current}
                      max={20}
                      onChange={(value) => onUpdateResource(character.id, resource, "current", value)}
                    />
                  </div>
                ))}
              </div>

              <div className="condition-stack">
                <div className="tag-row">
                  {character.conditions.map((condition) => (
                    <button type="button" key={condition} onClick={() => onRemoveCondition(character.id, condition)}>
                      {condition}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    onAddCondition(character.id, conditionDrafts[character.id] || "");
                    setConditionDrafts((drafts) => ({ ...drafts, [character.id]: "" }));
                  }}
                >
                  <input
                    value={conditionDrafts[character.id] || ""}
                    onChange={(event) =>
                      setConditionDrafts((drafts) => ({
                        ...drafts,
                        [character.id]: event.target.value
                      }))
                    }
                    placeholder="Condition"
                    aria-label={`${character.name} condition`}
                  />
                  <button type="submit">
                    <Plus size={16} />
                  </button>
                </form>
              </div>

              <div className="quick-card-actions">
                <button type="button" onClick={() => onQuickRoll(character, 2)}>
                  2d6
                </button>
                <button type="button" onClick={() => onQuickRoll(character, 3)}>
                  3d6
                </button>
                <button type="button" onClick={() => onQuickRoll(character, 4)}>
                  4d6
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Scene</p>
            <h2>{campaign.sessionName}</h2>
          </div>
          <Shield size={18} />
        </div>
        <Field
          label="Session"
          value={campaign.sessionName}
          onChange={(sessionName) => setCampaign({ ...campaign, sessionName })}
        />
        <Field
          label="Status"
          value={campaign.sceneStatus}
          onChange={(sceneStatus) => setCampaign({ ...campaign, sceneStatus })}
        />
        <TextBlock
          label="Notes"
          rows={8}
          value={campaign.sceneNotes}
          onChange={(sceneNotes) => setCampaign({ ...campaign, sceneNotes })}
        />
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Shared</p>
            <h2>Log</h2>
          </div>
          <ListChecks size={18} />
        </div>
        <form
          className="log-composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!logDraft.trim()) return;
            addLog(logDraft.trim(), "note");
            setLogDraft("");
          }}
        >
          <input value={logDraft} onChange={(event) => setLogDraft(event.target.value)} placeholder="Log entry" />
          <button type="submit">
            <Plus size={16} />
          </button>
        </form>
        <div className="log-list">
          {campaign.log.map((entry) => (
            <article key={entry.id} className={entry.type === "roll" ? "log-entry roll-entry" : "log-entry"}>
              <span>{formatTime(entry.createdAt)}</span>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CharacterView({
  characters,
  selectedCharacter,
  selectedCharacterId,
  setSelectedCharacterId,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
  onUpdateCharacterDeep,
  onUpdateResource,
  onAddCondition,
  onRemoveCondition,
  onRoll
}) {
  const [conditionDraft, setConditionDraft] = useState("");

  if (!selectedCharacter) {
    return (
      <section className="content-panel">
        <button type="button" className="primary-action" onClick={onAddCharacter}>
          <Plus size={17} />
          Character
        </button>
      </section>
    );
  }

  return (
    <div className="view-grid character-grid">
      <section className="content-panel character-sheet span-2">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Character Sheet</p>
            <h1>{selectedCharacter.name}</h1>
          </div>
          <div className="inline-actions">
            <select value={selectedCharacterId} onChange={(event) => setSelectedCharacterId(event.target.value)} aria-label="Character">
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
            <IconButton label="Add character" onClick={onAddCharacter}>
              <Plus size={17} />
            </IconButton>
          </div>
        </div>

        <div className="form-grid">
          <Field
            label="Name"
            value={selectedCharacter.name}
            onChange={(name) => onUpdateCharacter(selectedCharacter.id, { name })}
          />
          <Field
            label="Player"
            value={selectedCharacter.player}
            onChange={(player) => onUpdateCharacter(selectedCharacter.id, { player })}
          />
          <Field
            label="Childhood"
            value={selectedCharacter.childhood}
            onChange={(childhood) => onUpdateCharacter(selectedCharacter.id, { childhood })}
          />
          <Field
            label="Trait"
            value={selectedCharacter.trait}
            onChange={(trait) => onUpdateCharacter(selectedCharacter.id, { trait })}
          />
          <Field
            label="Cattribute"
            value={selectedCharacter.cattribute}
            onChange={(cattribute) => onUpdateCharacter(selectedCharacter.id, { cattribute })}
          />
          <Field
            label="Status"
            value={selectedCharacter.status}
            onChange={(status) => onUpdateCharacter(selectedCharacter.id, { status })}
          />
        </div>

        <div className="sheet-band">
          <div className="stat-grid">
            {abilityNames.map((ability) => (
              <article className="stat-card" key={ability}>
                <span>{ability}</span>
                <Stepper
                  label={`${ability} score`}
                  value={selectedCharacter.abilities[ability]}
                  min={1}
                  max={6}
                  onChange={(value) =>
                    onUpdateCharacter(selectedCharacter.id, {
                      abilities: {
                        ...selectedCharacter.abilities,
                        [ability]: value
                      }
                    })
                  }
                />
                <button type="button" onClick={() => onRoll(selectedCharacter, ability, 3)}>
                  Roll
                </button>
              </article>
            ))}
          </div>

          <div className="stat-grid resource-grid">
            {resourceNames.map((resource) => (
              <article className="stat-card" key={resource}>
                <span>{resource}</span>
                <Stepper
                  label={`${resource} current`}
                  value={selectedCharacter.resources[resource].current}
                  max={20}
                  onChange={(value) => onUpdateResource(selectedCharacter.id, resource, "current", value)}
                />
                <label className="max-field">
                  Max
                  <input
                    value={selectedCharacter.resources[resource].max}
                    onChange={(event) => onUpdateResource(selectedCharacter.id, resource, "max", event.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </article>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <TextBlock
            label="Backpack"
            value={selectedCharacter.backpack}
            onChange={(backpack) => onUpdateCharacter(selectedCharacter.id, { backpack })}
          />
          <TextBlock
            label="Spellbook"
            value={selectedCharacter.spellbook}
            onChange={(spellbook) => onUpdateCharacter(selectedCharacter.id, { spellbook })}
          />
          <TextBlock
            label="Notes"
            value={selectedCharacter.notes}
            rows={6}
            onChange={(notes) => onUpdateCharacter(selectedCharacter.id, { notes })}
          />
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Skills</p>
            <h2>Useful Skills</h2>
          </div>
          <Check size={18} />
        </div>
        <div className="skill-list">
          {skillNames.map((skill) => {
            const checked = selectedCharacter.skills.includes(skill);
            return (
              <label key={skill} className={checked ? "skill-item is-checked" : "skill-item"}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) =>
                    onUpdateCharacterDeep(selectedCharacter.id, (character) => ({
                      ...character,
                      skills: event.target.checked
                        ? [...character.skills, skill]
                        : character.skills.filter((item) => item !== skill)
                    }))
                  }
                />
                <span>{skill}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">State</p>
            <h2>Conditions</h2>
          </div>
          <Heart size={18} />
        </div>
        <div className="tag-row large-tags">
          {selectedCharacter.conditions.map((condition) => (
            <button type="button" key={condition} onClick={() => onRemoveCondition(selectedCharacter.id, condition)}>
              {condition}
            </button>
          ))}
        </div>
        <form
          className="log-composer"
          onSubmit={(event) => {
            event.preventDefault();
            onAddCondition(selectedCharacter.id, conditionDraft);
            setConditionDraft("");
          }}
        >
          <input value={conditionDraft} onChange={(event) => setConditionDraft(event.target.value)} placeholder="Condition" />
          <button type="submit">
            <Plus size={16} />
          </button>
        </form>
        {characters.length > 1 && (
          <button type="button" className="danger-button" onClick={() => onRemoveCharacter(selectedCharacter.id)}>
            <Trash2 size={16} />
            Delete Character
          </button>
        )}
      </section>
    </div>
  );
}

function DiceView({ campaign, rollConfig, setRollConfig, currentRoll, performRoll, rerollDie, syncRollTarget }) {
  const selected = campaign.characters.find((character) => character.id === rollConfig.characterId);

  return (
    <div className="view-grid dice-grid">
      <section className="content-panel dice-lab">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Roller</p>
            <h1>D6 Pool</h1>
          </div>
          <Sparkles size={20} />
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Character</span>
            <select
              value={rollConfig.characterId}
              onChange={(event) => syncRollTarget(event.target.value, rollConfig.ability)}
              aria-label="Roll character"
            >
              {campaign.characters.map((character) => (
                <option value={character.id} key={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ability</span>
            <select
              value={rollConfig.ability}
              onChange={(event) => syncRollTarget(rollConfig.characterId, event.target.value)}
              aria-label="Roll ability"
            >
              {abilityNames.map((ability) => (
                <option value={ability} key={ability}>
                  {ability}
                </option>
              ))}
            </select>
          </label>

          <Field label="Label" value={rollConfig.label} onChange={(label) => setRollConfig({ ...rollConfig, label })} />
        </div>

        <div className="roll-controls">
          <div className="segmented" aria-label="Dice count">
            {[2, 3, 4].map((count) => (
              <PillButton
                key={count}
                active={rollConfig.diceCount === count}
                onClick={() => setRollConfig({ ...rollConfig, diceCount: count })}
              >
                {count}d6
              </PillButton>
            ))}
          </div>

          <div className="target-grid">
            <article>
              <span>Target</span>
              <Stepper
                label="Target"
                min={1}
                max={6}
                value={rollConfig.target}
                onChange={(target) => setRollConfig({ ...rollConfig, target })}
              />
            </article>
            <article>
              <span>Difficulty</span>
              <Stepper
                label="Difficulty"
                min={1}
                max={4}
                value={rollConfig.difficulty}
                onChange={(difficulty) => setRollConfig({ ...rollConfig, difficulty })}
              />
            </article>
          </div>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={rollConfig.allowReroll}
              onChange={(event) => setRollConfig({ ...rollConfig, allowReroll: event.target.checked })}
            />
            <span>Reroll one die</span>
          </label>

          <button type="button" className="roll-button" onClick={() => performRoll()}>
            <Sparkles size={20} />
            Roll {rollConfig.diceCount}d6
          </button>
        </div>
      </section>

      <section className="content-panel result-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{selected?.name || "Unassigned"}</p>
            <h2>Result</h2>
          </div>
          <Swords size={18} />
        </div>
        {currentRoll ? (
          <RollResult roll={currentRoll} onReroll={rerollDie} />
        ) : (
          <div className="empty-state">No roll yet</div>
        )}
      </section>

      <section className="content-panel span-2">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent</p>
            <h2>Roll History</h2>
          </div>
          <ListChecks size={18} />
        </div>
        <div className="history-list">
          {campaign.rolls.map((roll) => (
            <article key={roll.id} className="history-item">
              <div>
                <strong>{roll.characterName}</strong>
                <span>{roll.label}</span>
              </div>
              <div className="history-dice">
                {roll.dice.map((die, index) => (
                  <span key={`${roll.id}-${index}`} className={roll.rerolledIndex === index ? "rerolled" : ""}>
                    {die}
                  </span>
                ))}
              </div>
              <strong>
                {roll.successes}/{roll.difficulty}
              </strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RollResult({ roll, onReroll, compact = false }) {
  return (
    <div className={compact ? "roll-result compact-roll" : "roll-result"}>
      <div className="dice-row">
        {roll.dice.map((die, index) => (
          <button
            type="button"
            key={`${roll.id}-${index}`}
            className={roll.rerolledIndex === index ? "die rerolled" : "die"}
            onClick={() => onReroll(index)}
            disabled={!roll.allowReroll || roll.rerolledIndex !== null}
            aria-label={`Die ${index + 1}: ${die}`}
          >
            {die}
          </button>
        ))}
      </div>
      <div className="result-metrics">
        <article>
          <span>Successes</span>
          <strong>{roll.successes}</strong>
        </article>
        <article>
          <span>Need</span>
          <strong>{roll.difficulty}</strong>
        </article>
        <article className={roll.passed ? "pass" : "miss"}>
          <span>Outcome</span>
          <strong>{roll.passed ? "Pass" : "Miss"}</strong>
        </article>
      </div>
      {roll.triple && <p className="triple-callout">Triple</p>}
    </div>
  );
}

function RulesView({ rules, allRules, searchTerm, setSearchTerm, updateRule, addRule, deleteRule, addLog }) {
  return (
    <div className="view-grid rules-grid">
      <section className="content-panel span-2">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Editable</p>
            <h1>Rules Reference</h1>
          </div>
          <button type="button" className="primary-action" onClick={addRule}>
            <Plus size={17} />
            Rule
          </button>
        </div>

        <label className="search-box">
          <Search size={18} />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search rules" />
        </label>

        <div className="rules-list">
          {rules.map((rule) => (
            <article className={rule.pinned ? "rule-card pinned" : "rule-card"} key={rule.id}>
              <div className="rule-head">
                <button type="button" onClick={() => updateRule(rule.id, { open: !rule.open })} aria-label={`Toggle ${rule.title}`}>
                  {rule.open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
                <input value={rule.title} onChange={(event) => updateRule(rule.id, { title: event.target.value })} />
                <IconButton label={rule.pinned ? "Unpin rule" : "Pin rule"} onClick={() => updateRule(rule.id, { pinned: !rule.pinned })}>
                  <BookOpen size={16} />
                </IconButton>
                <IconButton label="Log rule" onClick={() => addLog(`Rule: ${rule.title}`, "rule")}>
                  <ListChecks size={16} />
                </IconButton>
                {!defaultRules.some((defaultRule) => defaultRule.id === rule.id) && (
                  <IconButton label="Delete rule" className="danger-icon" onClick={() => deleteRule(rule.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </div>
              <input
                className="rule-summary"
                value={rule.summary}
                onChange={(event) => updateRule(rule.id, { summary: event.target.value })}
                placeholder="Summary"
              />
              {rule.open && (
                <div className="rule-body">
                  <textarea value={rule.details} onChange={(event) => updateRule(rule.id, { details: event.target.value })} rows={4} />
                  <input
                    value={rule.tags.join(", ")}
                    onChange={(event) =>
                      updateRule(rule.id, {
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      })
                    }
                    placeholder="Tags"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pinned</p>
            <h2>At Table</h2>
          </div>
          <BookOpen size={18} />
        </div>
        <div className="pinned-list">
          {allRules
            .filter((rule) => rule.pinned)
            .map((rule) => (
              <article key={rule.id}>
                <strong>{rule.title}</strong>
                <p>{rule.summary}</p>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
