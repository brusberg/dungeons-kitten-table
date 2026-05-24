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
  Upload
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { JoinView } from "../components/JoinView";
import { Field, IconButton, PillButton, Stepper, TextBlock } from "../components/shared";
import {
  abilityNames,
  buildDefaultCampaign,
  defaultRules,
  makeCharacter,
  now,
  normalizeCampaign,
  resourceNames,
  skillNames,
  sources,
  uid
} from "../lib/defaults";
import { resolveRoll, rollDie } from "../lib/dice";
import { clamp, formatTime } from "../lib/helpers";
import { readCampaign, readUi, writeCampaign, writeUi } from "../lib/repositories/localCampaignRepository";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "../lib/repositories/supabaseClient";
import { createSupabaseDocumentRepository } from "../lib/repositories/supabaseDocumentRepository";
import { characterIdFromSeatId, defaultViewForSeat, deriveSeats, findSeat } from "../lib/seats";
import {
  clearTableCodeInUrl,
  generateTableCode,
  normalizeTableCode,
  readTableCodeFromUrl,
  setTableCodeInUrl
} from "../lib/sync";

export default function Home() {
  const [campaign, setCampaign] = useState(null);
  const [view, setView] = useState("table");
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [saveState, setSaveState] = useState("Loaded");
  const [searchTerm, setSearchTerm] = useState("");
  const [seatId, setSeatId] = useState("");
  const [pendingSeatId, setPendingSeatId] = useState("");
  const [tableCode, setTableCode] = useState("");
  const [tableSession, setTableSession] = useState({ mode: "local", tableId: null, code: "LOCAL", version: null });
  const [syncState, setSyncState] = useState("Local cache");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
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
  const autoJoinRef = useRef(false);
  const importRef = useRef(null);
  const liveRepositoryRef = useRef(undefined);
  const skipLiveSaveRef = useRef(false);
  const tableSessionRef = useRef(tableSession);
  const unsubscribeLiveRef = useRef(null);

  useEffect(() => {
    tableSessionRef.current = tableSession;
  }, [tableSession]);

  useEffect(() => () => unsubscribeLiveRef.current?.(), []);

  useEffect(() => {
    const fallback = buildDefaultCampaign();
    const { campaign: storedCampaign, recovered } = readCampaign(fallback);
    const initial = normalizeCampaign(storedCampaign);
    const initialUi = readUi();
    const urlTableCode = readTableCodeFromUrl();
    const initialSeatId = initialUi?.seatId || "";
    const initialSeatCharacterId = characterIdFromSeatId(initialSeatId);

    if (recovered) {
      initial.log.unshift({
        id: uid("log"),
        type: "system",
        text: "Recovered from an unreadable local cache.",
        createdAt: now()
      });
    }

    setCampaign(initial);
    setSelectedCharacterId(initialSeatCharacterId || initialUi?.selectedCharacterId || initial.characters[0]?.id || "");
    setView(initialUi?.view === "story" ? "table" : initialUi?.view || "table");
    setSeatId(initialSeatId);
    setPendingSeatId(initialSeatId);
    setTableCode(urlTableCode || initial.code || "");
    setRollConfig((config) => ({
      ...config,
      characterId: initial.characters[0]?.id || "",
      target: initial.characters[0]?.abilities?.Strong || 3
    }));
  }, []);

  useEffect(() => {
    if (!campaign || autoJoinRef.current || !hasSupabaseConfig()) return;

    const code = readTableCodeFromUrl();
    if (!code || code === "LOCAL") return;

    autoJoinRef.current = true;
    joinLiveTable(code);
  }, [campaign]);

  useEffect(() => {
    if (!campaign) return;

    const skipLiveSave = skipLiveSaveRef.current;
    skipLiveSaveRef.current = false;
    setSaveState("Saving");
    const timer = window.setTimeout(async () => {
      const snapshot = { ...campaign, updatedAt: now() };
      const session = tableSessionRef.current;
      writeCampaign(snapshot);
      setSaveState("Saved");

      if (skipLiveSave || session.mode !== "live" || !session.tableId || !liveRepositoryRef.current) return;

      try {
        setSyncState("Syncing");
        const saved = await liveRepositoryRef.current.saveCampaign(session.tableId, snapshot, null);
        if (saved?.version) {
          setTableSession((current) =>
            current.tableId === saved.tableId ? { ...current, code: saved.code, version: saved.version } : current
          );
          setSyncState(`Live ${saved.code}`);
        }
      } catch (error) {
        setSyncState("Sync issue");
        setJoinError(error.message || "Live save failed.");
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [campaign]);

  useEffect(() => {
    if (!campaign) return;

    writeUi({
      view,
      selectedCharacterId,
      seatId
    });
  }, [campaign, seatId, selectedCharacterId, view]);

  const seats = useMemo(() => (campaign ? deriveSeats(campaign.characters) : []), [campaign]);
  const selectedSeat = useMemo(() => findSeat(seats, seatId), [seatId, seats]);

  const selectedCharacter = useMemo(() => {
    if (!campaign) return null;
    return campaign.characters.find((character) => character.id === selectedCharacterId) || campaign.characters[0] || null;
  }, [campaign, selectedCharacterId]);

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

  async function getLiveRepository() {
    if (liveRepositoryRef.current !== undefined) return liveRepositoryRef.current;

    const client = await createSupabaseBrowserClient();
    liveRepositoryRef.current = client ? createSupabaseDocumentRepository(client) : null;
    return liveRepositoryRef.current;
  }

  function applyLiveTable(table) {
    const nextCampaign = {
      ...normalizeCampaign(table.campaign),
      code: table.code,
      version: table.version
    };

    skipLiveSaveRef.current = true;
    setCampaign(nextCampaign);
    setTableCode(table.code);
    setTableCodeInUrl(table.code);
    setTableSession({ mode: "live", tableId: table.tableId, code: table.code, version: table.version });
    setSyncState(`Live ${table.code}`);
    setJoinError("");
    return nextCampaign;
  }

  function subscribeLiveTable(repository, table) {
    unsubscribeLiveRef.current?.();
    unsubscribeLiveRef.current = repository.subscribeTable(
      table.tableId,
      (change) => {
        if (change.type !== "campaign") return;

        const nextCampaign = {
          ...normalizeCampaign(change.campaign),
          code: change.campaign.code || table.code
        };
        skipLiveSaveRef.current = true;
        setCampaign(nextCampaign);
        setTableSession((current) =>
          current.tableId === table.tableId
            ? { ...current, code: nextCampaign.code, version: nextCampaign.version ?? current.version }
            : current
        );
        setSyncState(`Live ${nextCampaign.code}`);
      },
      (status) => {
        const label = String(status || "connecting").toLowerCase();
        setSyncState(status === "SUBSCRIBED" ? `Live ${table.code}` : `Live ${label}`);
      }
    );
  }

  async function joinLiveTable(inputCode = tableCode) {
    const code = normalizeTableCode(inputCode);
    if (!code) {
      setJoinError("Enter a table code.");
      return;
    }

    setJoinBusy(true);
    setJoinError("");

    try {
      const repository = await getLiveRepository();
      if (!repository) throw new Error("Set Supabase env vars to enable live sync.");

      const table = await repository.joinTable(code);
      const nextCampaign = applyLiveTable(table);
      subscribeLiveTable(repository, table);
      setSeatId("");
      setPendingSeatId("");
      setSelectedCharacterId(nextCampaign.characters[0]?.id || "");
    } catch (error) {
      setSyncState("Local cache");
      setJoinError(error.message || "Could not join that table.");
    } finally {
      setJoinBusy(false);
    }
  }

  async function createLiveTable() {
    if (!campaign) return;

    const code = normalizeTableCode(tableCode) || generateTableCode();
    setJoinBusy(true);
    setJoinError("");

    try {
      const repository = await getLiveRepository();
      if (!repository) throw new Error("Set Supabase env vars to enable live sync.");

      const table = await repository.createTable({
        ...campaign,
        code,
        version: undefined,
        updatedAt: now()
      });
      applyLiveTable(table);
      subscribeLiveTable(repository, table);
      setSeatId("");
      setPendingSeatId("");
    } catch (error) {
      setSyncState("Local cache");
      setJoinError(error.message || "Could not create a live table.");
    } finally {
      setJoinBusy(false);
    }
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
      seatId: selectedSeat?.id || "",
      seatLabel: selectedSeat?.label || "",
      createdAt: stamp
    };

    const resolved = resolveRoll(roll);
    setCurrentRoll(resolved);
    saveRoll(resolved, "roll");
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

      const normalized = normalizeCampaign(imported);
      patchCampaign({
        ...normalized,
        id: imported.id || uid("campaign"),
        schemaVersion: 1,
        updatedAt: now()
      });
      setSelectedCharacterId(normalized.characters[0]?.id || "");
      addLog("Campaign imported.", "system");
    } catch {
      addLog("Import failed. The JSON file was not a campaign export.", "system");
    } finally {
      event.target.value = "";
    }
  }

  function resetCampaign() {
    const fresh = buildDefaultCampaign();
    unsubscribeLiveRef.current?.();
    unsubscribeLiveRef.current = null;
    patchCampaign(fresh);
    setSelectedCharacterId(fresh.characters[0]?.id || "");
    setSeatId("");
    setPendingSeatId("");
    setTableCode("");
    setTableSession({ mode: "local", tableId: null, code: "LOCAL", version: null });
    setSyncState("Local cache");
    setView("table");
    setCurrentRoll(null);
    clearTableCodeInUrl();
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
    { id: "table", label: "Table", icon: Eye },
    { id: "character", label: "Sheet", icon: FileText },
    { id: "dice", label: "Dice", icon: Sparkles },
    { id: "rules", label: "Rules", icon: BookOpen }
  ];

  if (!selectedSeat) {
    return (
      <JoinView
        campaign={campaign}
        hasLiveConfig={hasSupabaseConfig()}
        joinBusy={joinBusy}
        joinError={joinError}
        seats={seats}
        selectedSeatId={pendingSeatId}
        syncState={syncState}
        tableCode={tableCode}
        onCreateTable={createLiveTable}
        onJoinTable={() => joinLiveTable(tableCode)}
        onSelectSeat={setPendingSeatId}
        onTableCodeChange={(value) => setTableCode(normalizeTableCode(value))}
        onJoin={() => {
          const seat = findSeat(seats, pendingSeatId);
          if (!seat) return;
          setSeatId(seat.id);
          if (seat?.characterId) {
            setSelectedCharacterId(seat.characterId);
            syncRollTarget(seat.characterId, rollConfig.ability);
          }
          setView(defaultViewForSeat(seat));
        }}
      />
    );
  }

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
            <div className="role-toggle" aria-label="Current seat">
              <PillButton active>{selectedSeat.label}</PillButton>
              <button
                type="button"
                className="pill-button"
                onClick={() => {
                  setPendingSeatId(seatId);
                  setSeatId("");
                }}
              >
                Swap
              </button>
            </div>
            <span className="save-state">
              <Sparkles size={15} />
              {syncState}
            </span>
            <span className="save-state">
              <Save size={15} />
              {saveState}
            </span>
          </div>
        </header>

        {view === "table" && (
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
            canSeeStorytellerNotes={selectedSeat.kind === "storyteller"}
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
              <button
                key={count}
                type="button"
                onClick={() =>
                  performRoll({
                    diceCount: count,
                    characterId: selectedCharacter?.id || rollConfig.characterId,
                    target: selectedCharacter?.abilities?.[rollConfig.ability] || rollConfig.target
                  })
                }
              >
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
  canSeeStorytellerNotes,
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

        <div className="form-grid sheet-notes">
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
            label="Player Notes"
            value={selectedCharacter.playerNotes ?? selectedCharacter.notes ?? ""}
            rows={6}
            onChange={(playerNotes) => onUpdateCharacter(selectedCharacter.id, { playerNotes, notes: playerNotes })}
          />
          {canSeeStorytellerNotes && (
            <TextBlock
              label="Storyteller Notes"
              value={selectedCharacter.storytellerNotes ?? ""}
              rows={6}
              onChange={(storytellerNotes) => onUpdateCharacter(selectedCharacter.id, { storytellerNotes })}
            />
          )}
        </div>

        <details className="details-panel">
          <summary>Character Details</summary>
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
        </details>
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
              <p className="rule-summary">{rule.details || rule.summary || "No rule text yet."}</p>
              {rule.open && (
                <div className="rule-body">
                  <TextBlock
                    label="Rule Text"
                    value={rule.details}
                    onChange={(details) => updateRule(rule.id, { details })}
                    rows={4}
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
                <p>{rule.details || rule.summary}</p>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
