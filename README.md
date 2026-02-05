# ft_transcendence

## Rock Paper Scissors (WebSocket)
The backend exposes a WebSocket endpoint for a 1v1 Rock Paper Scissors match.
Rules follow `TODO`: best of 3 decisive rounds; a draw replays the same round.

### Connection
- Endpoint: `ws://<host>/game`
- Auth: pass a JWT in `Authorization: Bearer <token>` or via `Sec-WebSocket-Protocol` (first value).
- In non-production, a `?token=...` query is accepted.

On connect, the server replies:
```json
{ "type": "registered", "userId": 42 }
```

### Client Messages
```json
{ "type": "create", "opponentId": 7 }
```
Creates a new game vs another user.

```json
{ "type": "join", "gameId": 12 }
```
Loads the current game + round state for a player.

```json
{ "type": "move", "gameId": 12, "move": "ROCK" }
```
Submits a move for the current round. `move` is one of `ROCK`, `PAPER`, `SCISSORS`.

### Server Messages
```json
{ "type": "gameCreated", "game": { ... }, "round": { ... } }
```
Emitted to the creator; the opponent receives `gameState`.

```json
{ "type": "gameState", "game": { ... }, "round": { ... } }
```
Current persisted game + round state.

```json
{ "type": "moveAccepted", "gameId": 12, "roundId": 33 }
```
Your move was stored, waiting for the other player.

```json
{
  "type": "roundResolved",
  "game": { ... },
  "round": { ... },
  "outcome": "PLAYER1",
  "nextRound": { ... } | null
}
```
`outcome` is `PLAYER1`, `PLAYER2`, or `DRAW`. When the game ends after round 3,
`nextRound` is `null` and `game.status` is `FINISHED`.

### Game / Round Payload Shape
```json
{
  "game": {
    "id": 12,
    "playerOneId": 42,
    "playerTwoId": 7,
    "playerOneScore": 1,
    "playerTwoScore": 0,
    "round": 2,
    "status": "ONGOING",
    "finishedAt": null
  },
  "round": {
    "id": 33,
    "roundNumber": 2,
    "playerOneMove": null,
    "playerTwoMove": "ROCK",
    "winnerId": null
  }
}
```

### Frontend Example (TS)
```ts
const socket = new WebSocket("ws://localhost:3000/game", token);

socket.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  // switch(payload.type) ...
};

socket.onopen = () => {
  socket.send(JSON.stringify({ type: "create", opponentId: 7 }));
  // or socket.send(JSON.stringify({ type: "join", gameId: 12 }));
};

function playMove(gameId: number, move: "ROCK" | "PAPER" | "SCISSORS") {
  socket.send(JSON.stringify({ type: "move", gameId, move }));
}
```

## Backend Local Dev (Bun)
From `backend/`:
```bash
bun install
bun run src/server.ts
```

## Frontend Local Dev (Next.js)
From `frontend/`:
```bash
npm run dev
```
Defaults to port 8080 (see `frontend/package.json`).
