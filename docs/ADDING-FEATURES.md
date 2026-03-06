# Adding Features — Step-by-Step Patterns

> เอกสารนี้เป็น "cookbook" — สอนทีละขั้นตอนว่าถ้าจะทำอะไรกับ lib ต้องแก้ตรงไหนบ้าง  
> ใช้ตัวอย่างจากฟีเจอร์จริงที่เราเคยทำ

---

## Pattern 1: เพิ่ม Prop ใหม่ให้ Timeline

**ตัวอย่าง:** เราเพิ่ม `stickyHeader` prop

### ขั้นตอน:

#### 1. เพิ่ม type ใน props interface
```
ไฟล์: src/lib/Timeline.tsx
ตรง: ReactCalendarTimelineProps type
```
```tsx
export type ReactCalendarTimelineProps<...> = {
  // ... existing props
  
  /**
   * คำอธิบาย prop (JSDoc comment)
   * @default false
   */
  myNewProp?: boolean;
};
```

#### 2. เพิ่ม default value
```
ไฟล์: src/lib/Timeline.tsx
ตรง: static defaultProps
```
```tsx
static defaultProps = {
  // ... existing defaults
  myNewProp: false,
};
```

#### 3. ใช้ prop ใน render()
```
ไฟล์: src/lib/Timeline.tsx
ตรง: render() method
```
```tsx
render() {
  const { myNewProp } = this.props;
  // ใช้ myNewProp ตามต้องการ
}
```

#### 4. (ถ้าจำเป็น) Export type ใหม่
```
ไฟล์: src/index.ts
```
```tsx
// ถ้าสร้าง type ใหม่ใน types/main.ts
export type { MyNewType } from './lib/types/main';
```

#### 5. เพิ่ม demo
```
ไฟล์: demo/src/demo-xxx/index.jsx
ใช้ prop ใหม่ใน Timeline component เพื่อทดสอบ
```

---

## Pattern 2: เพิ่ม Component ใหม่ภายใน lib

**ตัวอย่าง:** เราเพิ่ม `PinnedGroupRows`, `PinnedScrollElement`, `PinnedSidebar`

### ขั้นตอน:

#### 1. สร้างไฟล์ component ใน folder ที่เหมาะสม

```
src/lib/
├── row/PinnedGroupRows.tsx       ← ถ้าเกี่ยวกับ rows
├── scroll/PinnedScrollElement.tsx ← ถ้าเกี่ยวกับ scroll
├── utility/PinnedSidebar.tsx     ← ถ้าเป็น utility component
```

#### 2. Pattern ของ component ใน lib นี้

```tsx
// ส่วนใหญ่เป็น simple functional component
import React from "react";

type Props = {
  groups: SomeType[];
  groupHeights: number[];
  // ... props ที่ต้องการ
};

export default function MyComponent({ groups, groupHeights }: Props) {
  return (
    <div className="rct-my-component">
      {groups.map((group, i) => (
        <div key={i} style={{ height: groupHeights[i] }}>
          {/* render content */}
        </div>
      ))}
    </div>
  );
}
```

#### 3. Import และใช้ใน Timeline.tsx

```tsx
// src/lib/Timeline.tsx
import MyComponent from "./path/MyComponent";

// ใน render():
{shouldShow && <MyComponent groups={...} groupHeights={...} />}
```

#### 4. เพิ่ม styles (ถ้าจำเป็น)

```
ไฟล์: src/lib/Timeline.scss
```
```scss
.react-calendar-timeline {
  .rct-my-component {
    // styles
  }
}
```

#### 5. Export (ถ้า user ต้องใช้โดยตรง)

```tsx
// src/index.ts
export { default as MyComponent } from "./lib/path/MyComponent";
```

---

## Pattern 3: แก้ Styles / CSS

**สำคัญ:** ทุก styles อยู่ในไฟล์เดียว `src/lib/Timeline.scss`

### โครงสร้าง SCSS:

```scss
.react-calendar-timeline {        // ← root container
  .rct-outer { }                  // ← outer wrapper (มี overflow: clip)
  .rct-scroll { }                 // ← scroll container
  .rct-canvas { }                 // ← canvas (wider than viewport)
  .rct-sidebar { }                // ← sidebar container
  .rct-sidebar-row { }            // ← single sidebar row
  .rct-header-root { }            // ← header container
  .rct-calendar-header { }        // ← calendar header
  .rct-dateHeader { }             // ← date cell
  .rct-dateHeader-primary { }     // ← primary date cell (e.g. month)
  .rct-hl-even / .rct-hl-odd { } // ← horizontal line (group row background)
  .rct-vl { }                     // ← vertical line
  .rct-item { }                   // ← item container
  .rct-item-content { }           // ← item content
  
  // Fork additions:
  .rct-pinned-layer { }           // ← pinned groups container
  .rct-pinned-sidebar { }         // ← pinned sidebar
  .rct-pinned-scroll { }          // ← pinned scroll area
  .rct-hl-pinned { }              // ← pinned row background
}
```

### Naming Convention:
- Prefix: `rct-` (react-calendar-timeline)
- BEM-like: `rct-[block]-[element]`
- ใช้ SCSS nesting ภายใต้ `.react-calendar-timeline`

### CSS Variables ที่ใช้ได้:
```scss
--rct-color-background: #fff;  // background ของ pinned layer
```

### ข้อระวัง:
- **อย่าใช้ `overflow: hidden`** บน container ที่มี sticky children → ใช้ `overflow: clip` แทน
- **z-index hierarchy:**
  - Header (sticky): `z-index: 100`
  - Pinned layer: `z-index: 10`
  - Pinned sidebar: `z-index: 20`
  - Items: default stacking

---

## Pattern 4: เพิ่ม Type ใหม่

```
ไฟล์: src/lib/types/main.ts
```

### ตัวอย่าง:
```tsx
// สำหรับ type ที่ใช้กับ props
export type PinnedGroupIds = (string | number)[];

// สำหรับ type ที่ใช้ภายใน
export interface PinnedLayerData {
  pinnedGroups: TimelineGroupBase[];
  pinnedGroupHeights: number[];
  pinnedGroupTops: number[];
  pinnedHeight: number;
}
```

### Export:
```tsx
// types/main.ts → export * from './lib/types/main' ใน index.ts
// ถูก export อัตโนมัติผ่าน: export * from "./lib/types/main";
```

---

## Pattern 5: เพิ่ม Utility Function

```
ไฟล์: src/lib/utility/xxx.ts
```

### ตัวอย่าง: pinned-utils.ts

```tsx
// สร้างไฟล์ utility ใหม่
// src/lib/utility/pinned-utils.ts

import { TimelineGroupBase } from "../types/main";

export function splitGroups(
  groups: TimelineGroupBase[],
  pinnedGroupIds: (string | number)[]
): { pinned: TimelineGroupBase[]; scroll: TimelineGroupBase[] } {
  const pinnedSet = new Set(pinnedGroupIds.map(String));
  const pinned: TimelineGroupBase[] = [];
  const scroll: TimelineGroupBase[] = [];
  
  for (const group of groups) {
    if (pinnedSet.has(String(group.id))) {
      pinned.push(group);
    } else {
      scroll.push(group);
    }
  }
  
  return { pinned, scroll };
}
```

### ใช้ใน Timeline.tsx:
```tsx
import { splitGroups } from "./utility/pinned-utils";
```

---

## Pattern 6: แก้ Item Behavior (Drag/Resize)

**ไฟล์หลัก:** `src/lib/items/Item.tsx`

### ระวัง:
- `Item.tsx` ใช้ `interactjs` library สำหรับ drag/resize
- อย่าเปลี่ยน interaction model โดยไม่จำเป็น — จะ break ทุกอย่าง
- ถ้าจะเปลี่ยน item rendering → ใช้ `itemRenderer` prop แทนการแก้ `defaultItemRenderer.tsx`

### ถ้าต้องแก้ drag logic:
```
ดูที่ methods:
├── dragStart()
├── dragMove()  ← คำนวณ time + group
├── dragEnd()   ← ส่ง callback
├── resizeStart()
├── resizeMove()
└── resizeEnd()
```

---

## Pattern 7: เพิ่ม Demo ใหม่

### ขั้นตอน:

1. **สร้างโฟลเดอร์:**
```
demo/src/demo-my-feature/index.jsx
```

2. **เขียน component:**
```jsx
import React, { useState, useMemo } from "react";
import Timeline from "react-calendar-timeline";
import generateFakeData from "../generate-fake-data";
import dayjs from "dayjs";

export default function DemoMyFeature() {
  const [state] = useState(() => {
    const { groups, items } = generateFakeData(30, 500, 30);
    return {
      groups,
      items: items.map((item) => ({
        ...item,
        start_time: dayjs(item.start_time).valueOf(),
        end_time: dayjs(item.end_time).valueOf(),
      })),
      defaultTimeStart: dayjs().startOf("day").valueOf(),
      defaultTimeEnd: dayjs().startOf("day").add(1, "day").valueOf(),
    };
  });

  return (
    <Timeline
      groups={state.groups}
      items={state.items}
      defaultTimeStart={state.defaultTimeStart}
      defaultTimeEnd={state.defaultTimeEnd}
      // ← ใส่ prop ที่จะทดสอบ
    />
  );
}
```

3. **เพิ่ม route:**
```
ไฟล์: demo/src/App.tsx
```
```tsx
import DemoMyFeature from "./demo-my-feature";

// เพิ่มใน routes:
{ path: "/MyFeature", Component: withLayout(DemoMyFeature) }

// เพิ่มใน sidebar menu:
{ path: "/MyFeature", label: "My Feature" }
```

4. **ทดสอบ:**
```bash
cd demo && npm run dev
# เปิด http://localhost:5173/MyFeature
```

---

## Pattern 8: เขียน Test

### ขั้นตอน:

1. **สร้างไฟล์ test:**
```
__tests__/components/MyFeature/myFeature.test.tsx
```

2. **เขียน test:**
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Timeline from "lib/Timeline";

// ข้อมูลทดสอบ
const groups = [
  { id: "1", title: "Group 1" },
  { id: "2", title: "Group 2" },
];
const items = [
  { id: 1, group: "1", title: "Item 1", start_time: Date.now(), end_time: Date.now() + 3600000 },
];

describe("MyFeature", () => {
  it("should render with myNewProp", () => {
    render(
      <Timeline
        groups={groups}
        items={items}
        defaultTimeStart={Date.now()}
        defaultTimeEnd={Date.now() + 86400000}
        myNewProp={true}
      />
    );
    // assertions
  });
});
```

3. **รัน test:**
```bash
npm test -- --reporter=verbose
```

---

## Checklist — ก่อน commit ฟีเจอร์ใหม่

- [ ] TypeScript ไม่มี error (`npx tsc --noEmit`)
- [ ] Lint ผ่าน (`npm run lint`)
- [ ] Tests ผ่าน (`npm test`)
- [ ] Demo ทำงานถูกต้อง (ทดสอบใน browser)
- [ ] Build สำเร็จ (`npm run build`)
- [ ] Commit message ตาม convention (`feat: / fix: / docs:`)

---

## Quick Reference — จะแก้อะไร ดูตรงไหน

| ต้องการ | ไฟล์ | Method/Section |
|---------|------|---------------|
| เพิ่ม prop | `Timeline.tsx` | `ReactCalendarTimelineProps` + `defaultProps` |
| เพิ่ม type | `types/main.ts` | เพิ่มที่ท้ายไฟล์ |
| แก้ stacking | `utility/calendar.tsx` | `stackTimelineItems()` |
| แก้ scroll | `scroll/ScrollElement.tsx` | `onWheel`, `handleMouseDown/Move/Up` |
| แก้ drag | `items/Item.tsx` | `dragMove()`, `dragEnd()` |
| แก้ resize | `items/Item.tsx` | `resizeMove()`, `resizeEnd()` |
| แก้ header | `headers/DateHeader.tsx` | `render()` |
| แก้ sidebar | `layout/Sidebar.tsx` | `render()` |
| แก้ styles | `Timeline.scss` | ค้นหา class ที่ต้องการ |
| แก้ pinned | `Timeline.tsx` + `utility/pinned-utils.ts` | render() "Pinned Layer" section |
| เพิ่ม export | `src/index.ts` | เพิ่ม export statement |
| เพิ่ม marker | `markers/public/` | สร้าง component ใหม่ |
