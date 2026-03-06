import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import Timeline from "../../../src/index";
import "../../../src/lib/Timeline.scss";
import generateFakeData from "../generate-fake-data";

const minTime = dayjs().add(-6, "months").valueOf();
const maxTime = dayjs().add(6, "months").valueOf();

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

export default function DemoCustomPinned() {
  const [timelineState, setTimelineState] = useState(() => {
    const { groups, items } = generateFakeData(50, 5000, 90);
    return {
      groups,
      items: items.map((item) => ({
        ...item,
        start_time: dayjs(item.start_time).valueOf(),
        end_time: dayjs(item.end_time).valueOf(),
      })),
      defaultTimeStart: dayjs(items[0].start_time).startOf("day").valueOf(),
      defaultTimeEnd: dayjs(items[0].end_time).startOf("day").add(1, "day").valueOf(),
    };
  });

  const { groups, items, defaultTimeStart, defaultTimeEnd } = timelineState;

  const pinnedGroups = useMemo(
    () =>
      groups
        .slice(0, 3)
        .map((group) => group.id)
        .filter((id) => id !== undefined && id !== null),
    [groups]
  );

  const handleTimeChange = (visibleTimeStart, visibleTimeEnd, updateScrollCanvas) => {
    if (visibleTimeStart < minTime && visibleTimeEnd > maxTime) {
      updateScrollCanvas(minTime, maxTime);
    } else if (visibleTimeStart < minTime) {
      updateScrollCanvas(minTime, minTime + (visibleTimeEnd - visibleTimeStart));
    } else if (visibleTimeEnd > maxTime) {
      updateScrollCanvas(maxTime - (visibleTimeEnd - visibleTimeStart), maxTime);
    } else {
      updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
    }
  };

  const handleItemMove = (itemId, dragTime, newGroupOrder) => {
    setTimelineState((prev) => {
      const nextGroup = prev.groups[newGroupOrder];
      if (!nextGroup) return prev;
      return {
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const duration = item.end_time - item.start_time;
          return {
            ...item,
            start_time: dragTime,
            end_time: dragTime + duration,
            group: nextGroup.id,
          };
        }),
      };
    });
  };

  const handleItemResize = (itemId, time, edge) => {
    setTimelineState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          start_time: edge === "left" ? time : item.start_time,
          end_time: edge === "left" ? item.end_time : time,
        };
      }),
    }));
  };

  const itemRenderer = ({ item, itemContext, getItemProps, getResizeProps }) => {
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    const isSelected = itemContext.selected;
    const palettes = [
      ["#3b82f6", "#2563eb"],
      ["#06b6d4", "#0891b2"],
      ["#8b5cf6", "#7c3aed"],
      ["#f97316", "#ea580c"],
      ["#10b981", "#059669"],
      ["#ef4444", "#dc2626"],
    ];
    const colorIndex = Math.abs(Number(item.group || item.id)) % palettes.length;
    const [startColor, endColor] = palettes[colorIndex];

    return (
      <div
        {...getItemProps({
          style: {
            background: `linear-gradient(120deg, ${startColor} 0%, ${endColor} 100%)`,
            border: isSelected ? "2px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.45)",
            borderRadius: 14,
            boxShadow: isSelected ? "0 10px 24px rgba(15, 23, 42, 0.32)" : "0 6px 14px rgba(15, 23, 42, 0.2)",
            color: "#ffffff",
            overflow: "hidden",
          },
        })}
      >
        {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}

        <div
          style={{
            height: itemContext.dimensions.height,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "0 16px",
            fontWeight: 700,
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5 }}>
            {item.title}
          </span>
          <span
            style={{
              fontSize: 11.5,
              whiteSpace: "nowrap",
              fontWeight: 700,
              padding: "3px 10px",
            }}
          >
            {dayjs(item.start_time).format("DD MMM")} - {dayjs(item.end_time).format("DD MMM")}
          </span>
        </div>

        {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "90vh", overflowX: "hidden", overflowY: "auto" }}>
      <Timeline
        groups={groups}
        items={items}
        pinnedGroups={pinnedGroups}
        stickyHeader
        keys={keys}
        sidebarWidth={150}
        sidebarContent={<div>Above The Left</div>}
        canMove
        canResize="right"
        canSelect
        itemsSorted
        itemTouchSendsClick={false}
        stackItems
        itemHeightRatio={0.92}
        lineHeight={58}
        onItemMove={handleItemMove}
        onItemResize={handleItemResize}
        onTimeChange={handleTimeChange}
        buffer={3}
        minZoom={60 * 60 * 1000}
        maxZoom={365 * 24 * 86400 * 1000 * 20}
        defaultTimeStart={defaultTimeStart}
        defaultTimeEnd={defaultTimeEnd}
        itemRenderer={itemRenderer}
      />
    </div>
  );
}
