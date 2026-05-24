import { Sparkles } from "lucide-react";

export function JoinView({
  campaign,
  hasLiveConfig,
  joinBusy,
  joinError,
  seats,
  selectedSeatId,
  syncState,
  tableCode,
  onCreateTable,
  onJoin,
  onJoinTable,
  onSelectSeat,
  onTableCodeChange
}) {
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

        <div className="join-sync">
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
            <button type="button" disabled={!hasLiveConfig || joinBusy || !tableCode} onClick={onJoinTable}>
              Join Live
            </button>
            <button type="button" disabled={!hasLiveConfig || joinBusy} onClick={onCreateTable}>
              Create Live
            </button>
          </div>
          <p className={joinError ? "join-error" : "join-hint"}>
            {joinError || (hasLiveConfig ? syncState : "Live sync needs Supabase env vars.")}
          </p>
        </div>

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

        <button type="button" className="primary-action join-action" disabled={!selectedSeatId} onClick={onJoin}>
          Join
        </button>
      </section>
    </main>
  );
}
