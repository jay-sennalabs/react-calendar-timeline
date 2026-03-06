/**
 * PinnedGroupRows.tsx
 *
 * Renders background row strips for the pinned layer.
 * Mirrors GroupRows.tsx but operates on the pinned-groups subset
 * and lives in a fixed (sticky) container.
 */
import React, { Component } from "react";
import { TimelineGroupBase } from "../types/main";

export interface PinnedGroupRowsProps<T extends TimelineGroupBase = TimelineGroupBase> {
  groups: T[];
  groupHeights: number[];
  canvasWidth: number;
  horizontalLineClassNamesForGroup?: ((group: T) => string[]) | null;
}

export default class PinnedGroupRows<T extends TimelineGroupBase = TimelineGroupBase> extends Component<
  PinnedGroupRowsProps<T>
> {
  shouldComponentUpdate(next: PinnedGroupRowsProps<T>) {
    return !(
      next.canvasWidth === this.props.canvasWidth &&
      next.groupHeights === this.props.groupHeights &&
      next.groups === this.props.groups
    );
  }

  render() {
    const { groups, groupHeights, canvasWidth, horizontalLineClassNamesForGroup } = this.props;

    return (
      <div className="rct-horizontal-lines rct-pinned-horizontal-lines">
        {groups.map((group, i) => {
          const extra = horizontalLineClassNamesForGroup ? horizontalLineClassNamesForGroup(group).join(" ") : "";
          return (
            <div
              key={`pinned-row-${i}`}
              className={[i % 2 === 0 ? "rct-hl-even" : "rct-hl-odd", "rct-hl-pinned", extra].filter(Boolean).join(" ")}
              style={{
                width: `${canvasWidth}px`,
                height: `${groupHeights[i]}px`,
              }}
            />
          );
        })}
      </div>
    );
  }
}
