import { useMemo, type RefObject } from "react";

export type ChatMessageItem = {
  key: string;
  text: string;
  fromUserId: number;
  createdAt: string;
};

type ChatMessagesPanelProps = {
  selectedFriendName: string | null;
  historyLoading: boolean;
  historyError: string | null;
  socketError: string | null;
  messages: ChatMessageItem[];
  currentUserId: number | null;
  seenAt: string | null;
  pickFriendPrompt: string;
  noMessagesYet: string;
  seenLabel: string;
  messageEndRef: RefObject<HTMLDivElement | null>;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toTimestamp(iso: string) {
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
}

const GROUP_WINDOW_MS = 3 * 60 * 1000;

export default function ChatMessagesPanel({
  selectedFriendName,
  historyLoading,
  historyError,
  socketError,
  messages,
  currentUserId,
  seenAt,
  pickFriendPrompt,
  noMessagesYet,
  seenLabel,
  messageEndRef,
}: ChatMessagesPanelProps) {
  const lastMineIndex = useMemo(
    () =>
      currentUserId === null
        ? -1
        : messages.reduce(
            (lastIndex, message, index) => (message.fromUserId === currentUserId ? index : lastIndex),
            -1
          ),
    [currentUserId, messages]
  );
  const lastIncomingIndex = useMemo(
    () =>
      currentUserId === null
        ? -1
        : messages.reduce(
            (lastIndex, message, index) => (message.fromUserId !== currentUserId ? index : lastIndex),
            -1
          ),
    [currentUserId, messages]
  );
  const lastMineMessage = lastMineIndex >= 0 ? messages[lastMineIndex] : null;
  const lastMineTimestamp = lastMineMessage ? toTimestamp(lastMineMessage.createdAt) : 0;
  const seenTimestamp = seenAt ? toTimestamp(seenAt) : 0;

  const groupedMessages = useMemo(() => {
    const groups: Array<{ senderId: number; items: ChatMessageItem[] }> = [];
    for (const message of messages) {
      const currentTs = toTimestamp(message.createdAt);
      const previousGroup = groups[groups.length - 1];
      if (!previousGroup) {
        groups.push({ senderId: message.fromUserId, items: [message] });
        continue;
      }
      const lastInGroup = previousGroup.items[previousGroup.items.length - 1];
      const lastTs = toTimestamp(lastInGroup.createdAt);
      const canGroup =
        previousGroup.senderId === message.fromUserId &&
        currentTs > 0 &&
        lastTs > 0 &&
        currentTs - lastTs <= GROUP_WINDOW_MS;

      if (canGroup) {
        previousGroup.items.push(message);
      } else {
        groups.push({ senderId: message.fromUserId, items: [message] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white/50 to-white/20">
      {historyError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {historyError}
        </div>
      )}
      {socketError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {socketError}
        </div>
      )}

      {!selectedFriendName && (
        <div className="h-full flex items-center justify-center text-foreground/60 text-sm text-center px-6">
          {pickFriendPrompt}
        </div>
      )}

      {selectedFriendName && historyLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={`message-skeleton-${row}`}
              className="h-12 rounded-xl bg-black/10 animate-pulse"
            />
          ))}
        </div>
      )}

      {selectedFriendName && !historyLoading && messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-foreground/60 text-sm text-center px-6">
          {noMessagesYet}
        </div>
      )}

      {selectedFriendName &&
        groupedMessages.map((group) => {
          const isMine = currentUserId !== null && group.senderId === currentUserId;
          const groupLast = group.items[group.items.length - 1];
          const isLastMineGroup = lastMineMessage ? groupLast.key === lastMineMessage.key : false;
          const hasReplyAfterMyLastMessage = lastIncomingIndex > lastMineIndex;
          const canShowSeenForLastMine =
            Boolean(seenAt) &&
            Boolean(lastMineMessage) &&
            seenTimestamp >= lastMineTimestamp &&
            !hasReplyAfterMyLastMessage;

          return (
            <div key={groupLast.key} className={`flex ${isMine ? "justify-end" : "justify-start"} mt-3`}>
              <div className="max-w-[82%] space-y-1">
                <div
                  className={`px-3 py-2 shadow-sm rounded-2xl ${
                    isMine
                      ? "bg-[#9D33FA] text-white"
                      : "bg-white/90 text-black border border-black/10"
                  }`}
                >
                  <div className="space-y-2">
                    {group.items.map((message) => (
                      <p key={message.key} className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                    ))}
                  </div>
                  <p
                    className={`mt-1 text-[11px] ${
                      isMine ? "text-white/80 text-right" : "text-foreground/60"
                    }`}
                  >
                    {formatTime(groupLast.createdAt)}
                  </p>
                </div>
                {isMine && isLastMineGroup && canShowSeenForLastMine && (
                  <p className="text-[11px] text-foreground/60 text-right px-1">
                    {seenLabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}

      <div ref={messageEndRef} />
    </div>
  );
}
