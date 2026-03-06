/**
 * pinned-utils.ts
 *
 * Utilities for splitting groups and items into pinned vs. scroll layers.
 * Part of the react-calendar-timeline fork with pinned rows support.
 */
import { TimelineGroupBase, TimelineItemBase, TimelineKeys, PinnedGroupIds, PinnedLayerData } from "../types/main";
import { _get } from "./generic";

/**
 * Split all groups into pinned and scroll subsets.
 * Preserves original order within each subset.
 */
export function splitGroups<G extends TimelineGroupBase>(
  groups: G[],
  pinnedGroupIds: PinnedGroupIds,
  groupIdKey: string
): { pinnedGroups: G[]; scrollGroups: G[] } {
  const pinnedSet = new Set(pinnedGroupIds.map(String));
  const pinnedGroups: G[] = [];
  const scrollGroups: G[] = [];
  for (const g of groups) {
    if (pinnedSet.has(String(_get(g, groupIdKey)))) {
      pinnedGroups.push(g);
    } else {
      scrollGroups.push(g);
    }
  }
  return { pinnedGroups, scrollGroups };
}

/**
 * Split all items into pinned and scroll subsets,
 * based on which group they belong to.
 */
export function splitItems<I extends TimelineItemBase<number>, G extends TimelineGroupBase>(
  items: I[],
  pinnedGroups: G[],
  keys: TimelineKeys
): { pinnedItems: I[]; scrollItems: I[] } {
  const { itemGroupKey, groupIdKey } = keys;
  const pinnedGroupIds = new Set(pinnedGroups.map((g) => String(_get(g, groupIdKey))));
  const pinnedItems: I[] = [];
  const scrollItems: I[] = [];
  for (const item of items) {
    if (pinnedGroupIds.has(String(_get(item, itemGroupKey)))) {
      pinnedItems.push(item);
    } else {
      scrollItems.push(item);
    }
  }
  return { pinnedItems, scrollItems };
}

/**
 * Compute groupHeights and groupTops for the pinned layer.
 * Uses group.height override or fallback to lineHeight.
 */
export function computePinnedLayerData<G extends TimelineGroupBase>(
  pinnedGroups: G[],
  lineHeight: number
): PinnedLayerData {
  const pinnedGroupHeights: number[] = pinnedGroups.map((g) => g.height ?? lineHeight);
  const pinnedGroupTops: number[] = [];
  let acc = 0;
  for (const h of pinnedGroupHeights) {
    pinnedGroupTops.push(acc);
    acc += h;
  }
  return {
    pinnedGroups,
    pinnedGroupHeights,
    pinnedGroupTops,
    pinnedHeight: acc,
  };
}
