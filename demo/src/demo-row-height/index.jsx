import React from "react";
import dayjs from "dayjs";
import Timeline from "../../../src/index";
import "../../../src/lib/Timeline.scss";

const now = dayjs();

// Static groups with explicit heights — easy to visually verify
const groups = [
  { id: "1", title: "Row A — default (58px)" },
  { id: "2", title: "Row B — default (58px)" },
  { id: "3", title: "Row C — SHORT (28px)", height: 28 },
  { id: "4", title: "Row D — TALL (90px)", height: 90 },
  { id: "5", title: "Row E — default (58px)" },
  { id: "6", title: "Row F — SHORT (28px)", height: 28 },
  { id: "7", title: "Row G — default (58px)" },
];

// Items distributed across groups
const items = [
  {
    id: 1,
    group: "1",
    title: "Item 1-A",
    start_time: now.subtract(1, "day").valueOf(),
    end_time: now.add(1, "day").valueOf(),
  },
  { id: 2, group: "2", title: "Item 2-B", start_time: now.subtract(2, "day").valueOf(), end_time: now.valueOf() },
  {
    id: 3,
    group: "3",
    title: "Item 3-C short",
    start_time: now.subtract(1, "day").valueOf(),
    end_time: now.add(2, "day").valueOf(),
    height: 28,
  },
  {
    id: 4,
    group: "4",
    title: "Item 4-D tall",
    start_time: now.subtract(1, "day").valueOf(),
    end_time: now.add(3, "day").valueOf(),
  },
  {
    id: 5,
    group: "4",
    title: "Item 4-D tall 2",
    start_time: now.subtract(3, "day").valueOf(),
    end_time: now.subtract(1, "day").valueOf(),
  },
  { id: 6, group: "5", title: "Item 5-E", start_time: now.valueOf(), end_time: now.add(2, "day").valueOf() },
  {
    id: 7,
    group: "6",
    title: "Item 6-F short",
    start_time: now.subtract(1, "day").valueOf(),
    end_time: now.add(1, "day").valueOf(),
  },
  {
    id: 8,
    group: "7",
    title: "Item 7-G",
    start_time: now.subtract(2, "day").valueOf(),
    end_time: now.add(1, "day").valueOf(),
  },
];

const keys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupRightTitleKey: "rightTitle",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start_time",
  itemTimeEndKey: "end_time",
};

export default function DemoRowHeight() {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ padding: "8px 16px", background: "#f0f4ff", borderBottom: "1px solid #c7d2fe", fontSize: 13 }}>
        <strong>Row Height Demo</strong> — Row C &amp; F = 28px, Row D = 90px, others = 58px (default lineHeight)
      </div>
      <Timeline
        groups={groups}
        items={items}
        keys={keys}
        sidebarWidth={220}
        lineHeight={58}
        itemHeightRatio={0.75}
        stackItems
        canMove={false}
        canResize={false}
        defaultTimeStart={now.subtract(4, "day").valueOf()}
        defaultTimeEnd={now.add(4, "day").valueOf()}
        buffer={1}
      />
    </div>
  );
}
