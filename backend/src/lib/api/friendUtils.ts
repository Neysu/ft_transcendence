import { prisma } from "../prisma";

type FriendshipEdge = {
  requesterId: number;
  addresseeId: number;
};

function extractFriendIds(edges: FriendshipEdge[], userId: number): Set<number> {
  const friendIds = new Set<number>();
  for (const edge of edges) {
    if (edge.requesterId === userId) {
      friendIds.add(edge.addresseeId);
    } else if (edge.addresseeId === userId) {
      friendIds.add(edge.requesterId);
    }
  }
  return friendIds;
}

export async function getMutualFriendCountsForUsers(
  authUserId: number,
  otherUserIds: number[]
): Promise<Record<number, number>> {
  const uniqueOtherUserIds = [...new Set(otherUserIds)].filter((id) => id !== authUserId);
  if (uniqueOtherUserIds.length === 0) {
    return {};
  }

  const [authEdges, otherEdges] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: authUserId }, { addresseeId: authUserId }],
      },
      select: { requesterId: true, addresseeId: true },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: { in: uniqueOtherUserIds } },
          { addresseeId: { in: uniqueOtherUserIds } },
        ],
      },
      select: { requesterId: true, addresseeId: true },
    }),
  ]);

  const authFriendIds = extractFriendIds(authEdges, authUserId);
  const otherFriendSets = new Map<number, Set<number>>();
  for (const id of uniqueOtherUserIds) {
    otherFriendSets.set(id, new Set<number>());
  }

  for (const edge of otherEdges) {
    if (otherFriendSets.has(edge.requesterId) && edge.addresseeId !== edge.requesterId) {
      otherFriendSets.get(edge.requesterId)!.add(edge.addresseeId);
    }
    if (otherFriendSets.has(edge.addresseeId) && edge.requesterId !== edge.addresseeId) {
      otherFriendSets.get(edge.addresseeId)!.add(edge.requesterId);
    }
  }

  const counts: Record<number, number> = {};
  for (const id of uniqueOtherUserIds) {
    const otherFriendIds = otherFriendSets.get(id) ?? new Set<number>();
    let count = 0;
    for (const friendId of otherFriendIds) {
      if (authFriendIds.has(friendId)) {
        count += 1;
      }
    }
    counts[id] = count;
  }

  return counts;
}
