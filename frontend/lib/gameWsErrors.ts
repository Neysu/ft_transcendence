export const GAME_WS_ERROR_KEYS: Record<string, string> = {
  "Missing token": "missingAuthToken",
  "Invalid token": "gameWsInvalidToken",
  "Message too large": "gameWsMessageTooLarge",
  "Invalid JSON": "gameWsInvalidJson",
  "Not registered": "gameWsNotRegistered",
  "Invalid room code": "gameInvalidRoomCode",
  "Room code must be 3-15 characters": "gameRoomCodeLength",
  "Room already exists": "gameRoomAlreadyExists",
  "You already created a room": "gameRoomAlreadyCreated",
  "Room not found": "roomNotFound",
  "You are already hosting this room": "gameAlreadyHostingRoom",
  "Room host already connected": "gameAlreadyHostingRoom",
  "Host is not connected": "gameHostNotConnected",
  "Invalid opponentId": "gameInvalidOpponentId",
  "Cannot play against yourself": "gameCannotPlayYourself",
  "Opponent not found": "gameOpponentNotFound",
  "Invalid gameId": "gameInvalidGameId",
  "Game not found": "gameNotFound",
  "Not a player in this game": "gameNotPlayer",
  "No round found": "gameNoRoundFound",
  "Invalid move": "gameInvalidMove",
  "Game already finished": "gameAlreadyFinished",
  "Move already submitted": "gameMoveAlreadySubmitted",
  "Invalid round moves": "gameInvalidRoundMoves",
  "Failed to create game": "gameFailedCreate",
  "Failed to apply move": "gameFailedApplyMove",
  "Unknown message type": "gameUnknownMessageType",
  "Game finished": "gameFinished",
};

export function getGameWsErrorKey(message?: string | null): string | undefined {
  if (!message) return undefined;
  return GAME_WS_ERROR_KEYS[message.trim()];
}

export function mapGameWsErrorMessage(
  t: (key: string) => string,
  message?: string | null,
  fallbackKey?: string,
) {
  const key = getGameWsErrorKey(message);
  if (key) return t(key);
  if (message?.trim()) return message.trim();
  return fallbackKey ? t(fallbackKey) : "";
}
