/**
 * PinnedScrollElement.tsx
 *
 * A lightweight horizontal-scroll container for the pinned layer.
 * Applies translateX based on the central scroll state.
 */
import React, { Component, ReactNode } from "react";

export interface PinnedScrollElementProps {
  scrollOffset: number;
  width: number;
  pinnedHeight: number;
  children: ReactNode;
}

export default class PinnedScrollElement extends Component<PinnedScrollElementProps> {
  shouldComponentUpdate(nextProps: PinnedScrollElementProps) {
    return (
      this.props.scrollOffset !== nextProps.scrollOffset ||
      this.props.width !== nextProps.width ||
      this.props.pinnedHeight !== nextProps.pinnedHeight ||
      this.props.children !== nextProps.children
    );
  }

  render() {
    const { scrollOffset, width, pinnedHeight, children } = this.props;

    return (
      <div
        className="rct-scroll rct-pinned-scroll"
        style={{
          width: `${width}px`,
          height: `${pinnedHeight}px`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateX(${-scrollOffset}px)`,
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
}
