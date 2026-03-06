import { render } from "@testing-library/react";
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

    it("puts overflowX:hidden on react-calendar-timeline wrapper (not .rct-outer) so sticky works inside a scroll container", () => {
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

      // overflowX:hidden must be on the outer wrapper, NOT on .rct-outer
      // so that position:sticky on .rct-pinned-layer works against the real scroll container
      expect(wrapper.style.overflowX).toBe("hidden");
      expect(outer.style.overflowX).toBe("");
    });
  });
});
