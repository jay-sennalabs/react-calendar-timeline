/**
 * PinnedSidebar.tsx
 *
 * Renders the sidebar labels for the pinned layer.
 */
import React, { Component } from "react";
import { TimelineGroupBase, TimelineKeys, ReactCalendarGroupRendererProps } from "../types/main";
import { _get } from "./generic";

export interface PinnedSidebarProps<CustomGroup extends TimelineGroupBase = TimelineGroupBase> {
  groups: CustomGroup[];
  groupHeights: number[];
  height: number;
  width: number;
  keys: TimelineKeys;
  groupRenderer?: React.ComponentType<ReactCalendarGroupRendererProps<CustomGroup>> | undefined;
}

export default class PinnedSidebar<CustomGroup extends TimelineGroupBase = TimelineGroupBase> extends Component<
  PinnedSidebarProps<CustomGroup>
> {
  render() {
    const { groups, groupHeights, height, width, keys, groupRenderer: GroupRenderer } = this.props;

    return (
      <div className="rct-sidebar rct-pinned-sidebar" style={{ width: `${width}px`, height: `${height}px` }}>
        <div style={{ width: `${width}px` }}>
          {groups.map((group, index) => {
            const id = _get(group, keys.groupIdKey);
            const title = _get(group, keys.groupTitleKey);

            return (
              <div
                key={`pinned-sidebar-${id}`}
                className={`rct-sidebar-row rct-sidebar-row-${index % 2 === 0 ? "even" : "odd"} rct-sidebar-row-pinned`}
                style={{
                  height: `${groupHeights[index]}px`,
                  lineHeight: `${groupHeights[index]}px`,
                }}
              >
                {GroupRenderer ? <GroupRenderer group={group} isRightSidebar={false} /> : (title as React.ReactNode)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
