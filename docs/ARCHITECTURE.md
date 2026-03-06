# Architecture — react-calendar-timeline

> เอกสารนี้เขียนให้ dev ที่ไม่ได้สร้าง lib นี้มาตั้งแต่แรก อ่านจบแล้วควรเข้าใจว่า "อะไรอยู่ตรงไหน" และ "data ไหลอย่างไร"

---

## 1. ภาพรวม

Timeline เป็น **Class Component ตัวเดียว** (~1,400 บรรทัด) ที่ทำหน้าที่เป็น "God Component" — ควบคุมทุกอย่างตั้งแต่ state, scroll, zoom, drag, resize, render

```
src/
├── index.ts                    ← Public API (export ทุกอย่างที่ user ใช้)
├── resize-detector/
│   └── window.ts               ← ตรวจจับ window resize
└── lib/
    ├── Timeline.tsx             ← ★ หัวใจหลัก — God Component
    ├── Timeline.scss            ← Styles ทั้งหมด (SCSS)
    ├── default-config.ts        ← ค่า default: keys, timeSteps, headerFormats
    │
    ├── types/
    │   ├── main.ts              ← Types หลัก: Group, Item, Keys, Context
    │   └── dimension.ts         ← Types สำหรับ item positioning (left, top, width, height)
    │
    ├── columns/
    │   └── Columns.tsx          ← เส้นแนวตั้ง (vertical grid lines)
    │
    ├── row/
    │   ├── GroupRow.tsx          ← แถวเดี่ยว (single group row)
    │   ├── GroupRows.tsx         ← Container ของทุกแถว
    │   └── PinnedGroupRows.tsx   ← [FORK] แถวสำหรับ pinned layer
    │
    ├── items/
    │   ├── Item.tsx             ← ★ Item component — drag/resize logic (ใช้ interactjs)
    │   ├── Items.tsx            ← Container render items ทั้งหมด
    │   ├── defaultItemRenderer.tsx  ← Default item UI
    │   └── styles.ts            ← Item inline styles
    │
    ├── scroll/
    │   ├── ScrollElement.tsx     ← ★ Horizontal scroll container — drag/touch/wheel
    │   └── PinnedScrollElement.tsx ← [FORK] Scroll sync สำหรับ pinned layer
    │
    ├── layout/
    │   └── Sidebar.tsx          ← Sidebar ซ้าย/ขวา (group labels)
    │
    ├── headers/
    │   ├── HeadersContext.tsx    ← Context สำหรับ header components
    │   ├── TimelineHeaders.tsx  ← Container ของ headers
    │   ├── DateHeader.tsx       ← Date cells (primary + secondary)
    │   ├── CustomHeader.tsx     ← User-defined header
    │   ├── CustomDateHeader.tsx ← Custom date header implementation
    │   ├── SidebarHeader.tsx    ← Header ของ sidebar
    │   ├── Interval.tsx         ← Single interval cell
    │   ├── constants.ts         ← LEFT_VARIANT, RIGHT_VARIANT
    │   └── types.ts             ← Header-specific types
    │
    ├── markers/
    │   ├── MarkerCanvas.tsx     ← Canvas layer สำหรับ markers
    │   ├── MarkerCanvasContext.ts
    │   ├── TimelineMarkersContext.tsx
    │   ├── TimelineMarkersRenderer.tsx
    │   ├── markerType.ts
    │   ├── implementations/     ← Marker implementations (Today, Cursor, Custom)
    │   └── public/              ← Public API สำหรับ markers
    │
    ├── interaction/
    │   └── PreventClickOnDrag.tsx ← ป้องกัน click event หลัง drag
    │
    ├── timeline/
    │   └── TimelineStateContext.tsx ← Context: visibleTime, canvasTime, width
    │
    └── utility/
        ├── calendar.tsx         ← ★ คำนวณหลัก: stacking, time↔pixel, zoom levels
        ├── generic.ts           ← _get() helper
        ├── dom-helpers.ts       ← DOM position utilities
        ├── events.ts            ← Event composition
        ├── pinned-utils.ts      ← [FORK] Split groups/items for pinned layer
        └── PinnedSidebar.tsx    ← [FORK] Sidebar สำหรับ pinned layer
```

---

## 2. Data Flow — ข้อมูลไหลอย่างไร

```
User passes props
       │
       ▼
┌─────────────────────────────────┐
│  Timeline.tsx (Class Component) │
│                                 │
│  Props:                         │
│  ├── groups[]                   │ ← กลุ่ม/แถว
│  ├── items[]                    │ ← items ที่วางบน timeline
│  ├── defaultTimeStart/End       │ ← ช่วงเวลาเริ่มต้น
│  ├── pinnedGroups[]             │ ← [FORK] groups ที่ pin
│  └── stickyHeader               │ ← [FORK] header ติดด้านบน
│                                 │
│  State:                         │
│  ├── visibleTimeStart/End       │ ← เวลาที่เห็นบนจอ (controlled by scroll)
│  ├── canvasTimeStart/End        │ ← เวลาของ canvas ทั้งหมด (wider than visible)
│  ├── width                      │ ← pixel width ของ timeline
│  ├── dimensionItems[]           │ ← ★ ผลลัพธ์จาก stacking (position ของทุก item)
│  ├── groupHeights[]             │ ← ความสูงของแต่ละ group
│  ├── groupTops[]                │ ← ตำแหน่ง top ของแต่ละ group
│  ├── height                     │ ← ความสูงรวม
│  ├── draggingItem / resizingItem│ ← interaction state
│  └── selectedItem               │
└─────────────┬───────────────────┘
              │
              │ getDerivedStateFromProps()
              │ คำนวณ stacking ทุกครั้งที่ props เปลี่ยน
              ▼
┌─────────────────────────────────┐
│  stackTimelineItems()           │ ← utility/calendar.tsx
│                                 │
│  Input: items, groups, canvas   │
│  Output:                        │
│  ├── dimensionItems[]           │ ← แต่ละ item มี { left, top, width, height }
│  ├── groupHeights[]             │ ← ความสูงจริงของแต่ละ group (อาจเพิ่มจาก stacking)
│  ├── groupTops[]                │ ← สะสม top position
│  └── height                     │ ← ความสูงรวม
└─────────────┬───────────────────┘
              │
              │ render()
              ▼
┌─────────────────────────────────────────────────────────┐
│  DOM Structure                                          │
│                                                         │
│  div.react-calendar-timeline                            │
│  ├── [Headers] ← sticky ถ้า stickyHeader=true          │
│  │   └── rct-header-root                                │
│  │       ├── SidebarHeader (left)                       │
│  │       ├── Calendar Headers (DateHeader x2)           │
│  │       └── SidebarHeader (right, optional)            │
│  │                                                      │
│  └── div.rct-outer                                      │
│      ├── [Pinned Layer] ← sticky, ถ้า pinnedGroups      │
│      │   ├── PinnedSidebar                              │
│      │   ├── PinnedScrollElement                        │
│      │   │   ├── Columns (vertical lines)               │
│      │   │   ├── PinnedGroupRows (background stripes)   │
│      │   │   └── Items (pinned items only)              │
│      │   └── PinnedSidebar (right, optional)            │
│      │                                                  │
│      └── [Scroll Layer] ← horizontal scroll via JS      │
│          ├── Sidebar (left)                             │
│          ├── ScrollElement                              │
│          │   ├── MarkerCanvas                           │
│          │   │   ├── Columns                            │
│          │   │   ├── GroupRows                          │
│          │   │   ├── Items                              │
│          │   │   └── Children (markers, etc.)           │
│          └── Sidebar (right, optional)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Scroll System — ระบบ scroll ทำงานอย่างไร

**สำคัญ:** Timeline ไม่ใช้ native horizontal scroll แต่ใช้ **CSS transform + JavaScript**

```
User drags / wheels horizontally
         │
         ▼
ScrollElement.tsx
  ├── onWheel / onPointerDown+Move  ← capture user gesture
  ├── scheduleScroll()               ← batch ด้วย requestAnimationFrame
  └── props.onScroll(scrollOffset)   ← ส่งกลับไป Timeline
         │
         ▼
Timeline.tsx
  ├── onScroll(scrollOffset)
  │   └── คำนวณ visibleTimeStart/End ใหม่
  │       └── เรียก onTimeChange()
  │           └── updateScrollCanvas()
  │               └── setState({ canvasTimeStart, canvasTimeEnd, ... })
  │                   └── getDerivedStateFromProps()
  │                       └── re-stacking (ถ้า canvas เปลี่ยน)
  └── render()
      └── scrollOffset = getScrollOffset()
          └── ใช้กับ transform: translateX(-scrollOffset)
```

**Canvas vs Visible:**
- `visibleTime` = สิ่งที่ user เห็น (viewport)
- `canvasTime` = พื้นที่ render จริง (กว้างกว่า visible ตาม `buffer` prop)
- เมื่อ scroll จน visible เกิน canvas → re-render canvas ใหม่

---

## 4. Item Positioning — items วางตำแหน่งอย่างไร

ทุก item ถูกคำนวณตำแหน่งใน `stackTimelineItems()`:

```
1. coordinateToTimeRatio = (canvasTimeEnd - canvasTimeStart) / canvasWidth
   → 1 pixel = กี่ milliseconds

2. สำหรับแต่ละ item:
   left = (item.start_time - canvasTimeStart) / ratio
   width = (item.end_time - item.start_time) / ratio
   top = groupTop + verticalMargin  (หรือ stacked position)
   height = lineHeight * itemHeightRatio

3. ถ้า stackItems = true:
   items ใน group เดียวกันจะถูก stack ไม่ให้ทับกัน
   → groupHeight อาจเพิ่มขึ้น
```

**ผลลัพธ์:** `dimensionItems[]` — array ของ `{ id, dimensions: { left, top, width, height, ... } }`

---

## 5. Interaction — drag/resize ทำงานอย่างไร

```
Item.tsx ใช้ interactjs library:
  ├── interact(element).draggable()   ← drag item
  ├── interact(element).resizable()   ← resize item
  │
  ├── onDragStart → lock scroll
  ├── onDragMove  → คำนวณ dragTime + newGroupOrder
  │                → เรียก props.onDrag()
  │                → Timeline re-stacks with dragging state
  └── onDragEnd   → เรียก props.onDrop()
                   → Timeline เรียก onItemMove() callback

การคำนวณ group ใหม่:
  mouseY → หาว่า cursor อยู่ที่ group ไหน (ใช้ groupTops + groupHeights)
  mouseX → แปลงเป็น time (ใช้ coordinateToTimeRatio)
```

---

## 6. Context System

มี 3 Context:

| Context | อยู่ที่ | ให้ข้อมูลอะไร |
|---------|---------|---------------|
| `TimelineStateContext` | `timeline/` | visibleTime, canvasTime, width, showPeriod() |
| `TimelineHeadersContext` | `headers/` | scrollOffset, sidebarWidth, timeSteps, registerScroll |
| `TimelineMarkersContext` | `markers/` | marker subscriptions |

---

## 7. Key Files ที่ต้องรู้จัก

| ต้องการทำอะไร | ไฟล์ที่ต้องแก้ |
|--------------|---------------|
| เพิ่ม/แก้ prop ใหม่ | `Timeline.tsx` (props interface + defaultProps + render) |
| เปลี่ยน item behavior | `items/Item.tsx` |
| เปลี่ยน item rendering | `items/defaultItemRenderer.tsx` หรือ `itemRenderer` prop |
| เปลี่ยนการคำนวณ stacking | `utility/calendar.tsx` → `stackTimelineItems()` |
| เปลี่ยน scroll behavior | `scroll/ScrollElement.tsx` |
| เปลี่ยน header | `headers/DateHeader.tsx` หรือ `headers/TimelineHeaders.tsx` |
| เปลี่ยน styles | `Timeline.scss` |
| เพิ่ม type | `types/main.ts` |
| เพิ่ม pinned behavior | `utility/pinned-utils.ts` + `Timeline.tsx` render section |
| เพิ่ม public export | `src/index.ts` |

---

## 8. Build System

```
vite.config.mts:
  ├── Entry: src/index.ts
  ├── Output: dist/react-calendar-timeline.{es,cjs}.js
  ├── SCSS → dist/style.css + dist/Timeline.scss (copy)
  ├── TypeScript → dist/index.d.ts
  └── External: react, react-dom, dayjs (ไม่ bundle เข้าไป)

vitest.config.ts:
  ├── Environment: jsdom
  ├── Setup: __tests__/setup.ts
  └── Tests: __tests__/**/*.test.{ts,tsx}
```

---

## 9. สิ่งที่ควรรู้ก่อนแก้โค้ด

1. **Timeline.tsx เป็น Class Component** — ไม่ใช่ functional, ใช้ `getDerivedStateFromProps` แทน hooks
2. **Horizontal scroll เป็น JS-based** — ไม่ใช่ native scroll, ใช้ `transform: translateX`
3. **interactjs** — library สำหรับ drag/resize, ใช้ใน `Item.tsx` เท่านั้น
4. **dayjs** — แทนที่ moment.js, ใช้ทั่ว codebase สำหรับ date math
5. **SCSS** — styles ทั้งหมดอยู่ในไฟล์เดียว `Timeline.scss`
6. **overflow: clip** — ใช้แทน `overflow: hidden` เพื่อให้ `position: sticky` ทำงาน (แก้ไขโดย fork นี้)
