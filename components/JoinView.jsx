import { Sparkles } from "lucide-react";

export function JoinView({
  campaign,
  hasLiveConfig,
  joinBusy,
  joinError,
  joinMode,
  liveConnected,
  seats,
  selectedSeatId,
  syncState,
  tableCode,
  onConnectLive,
  onCreateTable,
  onJoin,
  onJoinModeChange,
  onSelectSeat,
  onTableCodeChange
}) {
  const isLiveMode = joinMode === "live";
  const canPickSeat = !isLiveMode || liveConnected;
  const statusText = isLiveMode ? (liveConnected ? syncState : "Enter table code") : "Local cache";

  return (
    <main className="join-shell">
      <section className="content-panel join-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Join Table</p>
            <h1>{campaign.name}</h1>
          </div>
          <span className="save-state">
            <Sparkles size={15} />
            {campaign.code || "LOCAL"}
          </span>
        </div>

        <div className="join-mode" aria-label="Join mode">
          <button
            type="button"
            className={isLiveMode ? "is-active" : ""}
            disabled={!hasLiveConfig}
            onClick={() => onJoinModeChange("live")}
          >
            Live
          </button>
          <button
            type="button"
            className={joinMode === "local" ? "is-active" : ""}
            onClick={() => onJoinModeChange("local")}
          >
            Local Test
          </button>
        </div>

        <div className="join-sync">
          {isLiveMode && !liveConnected && (
            <>
              <label className="field">
                <span>Table Code</span>
                <input
                  value={tableCode}
                  onChange={(event) => onTableCodeChange(event.target.value)}
                  placeholder="ABC123"
                  aria-label="Table code"
                />
              </label>
              <div className="join-sync-actions">
                <button type="button" disabled={!hasLiveConfig || joinBusy || !tableCode} onClick={onConnectLive}>
                  Join Live Table
                </button>
                <button type="button" disabled={!hasLiveConfig || joinBusy} onClick={onCreateTable}>
                  Create New Live Table
                </button>
              </div>
            </>
          )}
          <p className={joinError ? "join-error" : "join-hint"}>
            {joinError || statusText}
          </p>
        </div>

        {canPickSeat && (
          <div className="seat-list" role="listbox" aria-label="Choose your seat">
            {seats.map((seat) => (
              <button
                key={seat.id}
                type="button"
                className={selectedSeatId === seat.id ? "seat-option is-active" : "seat-option"}
                onClick={() => onSelectSeat(seat.id)}
              >
                <span>{seat.label}</span>
                <small>{seat.kind}</small>
              </button>
            ))}
          </div>
        )}

        {canPickSeat && (
          <button
            type="button"
            className="primary-action join-action"
            disabled={!selectedSeatId || joinBusy}
            onClick={onJoin}
          >
            {isLiveMode ? "Take Seat" : "Join Local Test"}
          </button>
        )}
      </section>
    </main>
  );
}
