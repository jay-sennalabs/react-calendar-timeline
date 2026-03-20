import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import dayjs from "dayjs";
import Timeline from "lib/Timeline";
import type { ReactCalendarTimelineProps } from "lib/Timeline";
import type { TimelineItemBase, TimelineGroupBase } from "lib/types/main";
import { noop } from "test-utility";

type TimelineProps = ReactCalendarTimelineProps<TimelineItemBase<number>, TimelineGroupBase>;

// Timeline.defaultProps contains null for many optional fields and string
// literals wider than expected union types. We need items & groups to be
// required while the rest can stay partial.
const defaultProps = {
  ...(Timeline.defaultProps as unknown as Partial<Omit<TimelineProps, "ref">>),
  items: [] as TimelineItemBase<number>[],
  groups: [] as TimelineGroupBase[],
};

describe("Timeline", () => {
  describe("initialization", () => {
    it("renders with defaultTimeStart and defaultTimeEnd", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
      };

      const { container } = render(<Timeline {...props} />);

      expect(container.querySelector(".rct-scroll")).toBeDefined();
    });

    it("renders with visibleTimeStart and visibleTimeEnd", () => {
      const visibleTimeStart = dayjs("2018-01-01").valueOf();
      const visibleTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        visibleTimeStart,
        visibleTimeEnd,
      };

      const { container } = render(<Timeline {...props} />);

      expect(container.querySelector(".rct-scroll")).toBeDefined();
    });

    it("throws error if neither visibleTime or defaultTime props are passed", () => {
      const props = {
        ...defaultProps,
        visibleTimeStart: undefined,
        visibleTimeEnd: undefined,
        defaultTimeStart: undefined,
        defaultTimeEnd: undefined,
      };
      vi.spyOn(console, "error").mockImplementation(noop);
      expect(() => render(<Timeline {...props} />)).toThrow(
        'You must provide either "defaultTimeStart" and "defaultTimeEnd" or "visibleTimeStart" and "visibleTimeEnd" to initialize the Timeline'
      );
      vi.restoreAllMocks();
    });

    it("includes pinned layer height in outer container height", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
          { id: 3, title: "Group 3" },
        ],
        pinnedGroups: [1],
      };

      const { container, getByTestId } = render(<Timeline {...props} />);

      const outer = container.querySelector(".rct-outer") as HTMLDivElement;
      const pinnedScroll = container.querySelector(".rct-pinned-scroll") as HTMLDivElement;
      const scrollElement = getByTestId("scroll-element") as HTMLDivElement;

      const outerHeight = parseFloat(outer.style.height);
      const pinnedHeight = parseFloat(pinnedScroll.style.height);
      const scrollHeight = parseFloat(scrollElement.style.height);

      expect(outerHeight).toBe(scrollHeight + pinnedHeight);
    });

    it("puts overflowX:clip on react-calendar-timeline wrapper (not .rct-outer) so sticky works inside a scroll container", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
        ],
        pinnedGroups: [1],
      };

      const { container } = render(<Timeline {...props} />);
      const wrapper = container.querySelector(".react-calendar-timeline") as HTMLDivElement;
      const outer = container.querySelector(".rct-outer") as HTMLDivElement;

      // overflowX:clip must be on the outer wrapper, NOT on .rct-outer
      // so that position:sticky on .rct-pinned-layer works against the real scroll container
      expect(wrapper.style.overflowX).toBe("clip");
      expect(outer.style.overflowX).toBe("");
    });

    it("renders pinned groups only once across pinned and scroll sidebars", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
          { id: 3, title: "Group 3" },
        ],
        pinnedGroups: [1],
      };

      const { container } = render(<Timeline {...props} />);

      const sidebarRows = container.querySelectorAll(".rct-sidebar-row");
      expect(sidebarRows).toHaveLength(props.groups.length);
    });

    it("compresses scroll layer rows and height after extracting pinned groups", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
          { id: 3, title: "Group 3" },
        ],
        pinnedGroups: [1],
      };

      const { container, getByTestId } = render(<Timeline {...props} />);

      const scrollElement = getByTestId("scroll-element") as HTMLDivElement;
      const scrollRows = container.querySelectorAll(
        ".rct-horizontal-lines:not(.rct-pinned-horizontal-lines) > div"
      ) as NodeListOf<HTMLDivElement>;

      expect(scrollRows).toHaveLength(2);
      expect(scrollRows[0].style.top).toBe("0px");
      expect(scrollRows[1].style.top).toBe(scrollRows[0].style.height);

      const rowsHeight = Array.from(scrollRows).reduce((acc, row) => acc + parseFloat(row.style.height), 0);
      expect(parseFloat(scrollElement.style.height)).toBe(rowsHeight);
    });

    it("does not crash in pinned mode when a dimension item has no order", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();
      const timelineRef = React.createRef<Timeline>();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
        ],
        items: [
          {
            id: 1,
            group: 1,
            title: "Item 1",
            start_time: defaultTimeStart,
            end_time: defaultTimeStart + 60 * 60 * 1000,
          },
        ],
        pinnedGroups: [1],
      };

      render(<Timeline {...props} ref={timelineRef} />);

      const originalState = timelineRef.current?.state;
      const originalItem = originalState?.dimensionItems[0];
      expect(originalItem).toBeDefined();
      if (!originalItem) {
        throw new Error("Expected a dimension item for setup");
      }

      const malformedItem = {
        ...originalItem,
        dimensions: {
          ...originalItem.dimensions,
          order: undefined as never,
        },
      };

      expect(() => {
        act(() => {
          timelineRef.current?.setState({
            dimensionItems: [malformedItem],
          });
        });
      }).not.toThrow();
    });

    it("calls onCanvasClick when clicking an empty timeline row", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();
      const onCanvasClick = vi.fn();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
        ],
        pinnedGroups: [1],
        onCanvasClick,
      };

      const { container } = render(<Timeline {...props} />);
      const firstScrollRow = container.querySelector(
        ".rct-horizontal-lines:not(.rct-pinned-horizontal-lines) > div"
      ) as HTMLDivElement;

      fireEvent.mouseDown(firstScrollRow, { clientX: 120 });
      fireEvent.mouseUp(firstScrollRow, { clientX: 120 });
      fireEvent.click(firstScrollRow, { clientX: 120 });

      expect(onCanvasClick).toHaveBeenCalledTimes(1);
      expect(onCanvasClick.mock.calls[0][0]).toBe(2);
    });

    it("calls onCanvasClick when clicking a pinned row", () => {
      const defaultTimeStart = dayjs("2018-01-01").valueOf();
      const defaultTimeEnd = dayjs("2018-03-01").valueOf();
      const onCanvasClick = vi.fn();

      const props = {
        ...defaultProps,
        defaultTimeStart,
        defaultTimeEnd,
        groups: [
          { id: 1, title: "Pinned Group" },
          { id: 2, title: "Group 2" },
        ],
        pinnedGroups: [1],
        onCanvasClick,
      };

      const { container } = render(<Timeline {...props} />);
      const pinnedRow = container.querySelector(".rct-pinned-horizontal-lines .rct-hl-pinned") as HTMLDivElement;

      fireEvent.pointerDown(pinnedRow, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 120 });
      fireEvent.pointerUp(pinnedRow, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 120 });
      fireEvent.click(pinnedRow, { clientX: 120 });

      expect(onCanvasClick).toHaveBeenCalledTimes(1);
      expect(onCanvasClick.mock.calls[0][0]).toBe(1);
    });
  });
});
