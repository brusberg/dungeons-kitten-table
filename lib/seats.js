export function deriveSeats(characters) {
  return [
    { id: "storyteller", label: "Storyteller", kind: "storyteller" },
    ...characters.map((character) => ({
      id: `character:${character.id}`,
      label: character.name,
      kind: "character",
      characterId: character.id
    })),
    { id: "observer", label: "Observer", kind: "observer" }
  ];
}

export function findSeat(seats, seatId) {
  return seats.find((seat) => seat.id === seatId) || null;
}

export function characterIdFromSeatId(seatId) {
  return String(seatId || "").startsWith("character:") ? seatId.slice("character:".length) : "";
}

export function defaultViewForSeat(seat) {
  return seat?.kind === "character" ? "character" : "table";
}
