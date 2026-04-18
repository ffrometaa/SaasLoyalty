import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ---------------------------------------------------------------------------
// Pure helper — mirrors the delta logic in index.ts
// ---------------------------------------------------------------------------

function computeDeltas(
  currentMembers: Array<{ id: string }>,
  prevEntries: Array<{ memberId: string; rank: number }>
): number[] {
  const prevRankMap = new Map(prevEntries.map(e => [e.memberId, e.rank]));
  return currentMembers.map((m, i) =>
    prevRankMap.has(m.id) ? prevRankMap.get(m.id)! - (i + 1) : 0
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test('computeDeltas: member moved from rank 3 to rank 1 → delta = 2', () => {
  const currentMembers = [
    { id: 'member-a' }, // now rank 1
    { id: 'member-b' }, // now rank 2
    { id: 'member-c' }, // now rank 3
  ];
  const prevEntries = [
    { memberId: 'member-b', rank: 1 },
    { memberId: 'member-c', rank: 2 },
    { memberId: 'member-a', rank: 3 }, // was rank 3, now rank 1
  ];

  const deltas = computeDeltas(currentMembers, prevEntries);

  // member-a: prevRank(3) - currentRank(1) = 2
  assertEquals(deltas[0], 2);
  // member-b: prevRank(1) - currentRank(2) = -1
  assertEquals(deltas[1], -1);
  // member-c: prevRank(2) - currentRank(3) = -1
  assertEquals(deltas[2], -1);
});

Deno.test('computeDeltas: new member not in previous snapshot → delta = 0', () => {
  const currentMembers = [
    { id: 'member-existing' }, // rank 1
    { id: 'member-new' },      // rank 2, not in prev snapshot
  ];
  const prevEntries = [
    { memberId: 'member-existing', rank: 1 },
  ];

  const deltas = computeDeltas(currentMembers, prevEntries);

  // member-existing: prevRank(1) - currentRank(1) = 0
  assertEquals(deltas[0], 0);
  // member-new: not in prev snapshot → 0
  assertEquals(deltas[1], 0);
});
