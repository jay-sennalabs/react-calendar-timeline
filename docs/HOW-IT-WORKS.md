# How It Works — Deep Dive

> เอกสารนี้อธิบาย "ข้างในทำงานยังไง" สำหรับ dev ที่ต้องแก้ไข lib จริงๆ  
> อ่าน ARCHITECTURE.md ก่อน แล้วค่อยมาอ่านอันนี้

---

## 1. Timeline Lifecycle — เกิดอะไรขึ้นเมื่อ render

### 1.1 Initialization (mount ครั้งแรก)

```
constructor()
  └── คำนวณ initial state จาก props:
      ├── visibleTimeStart/End (จาก defaultTimeStart/End หรือ props)
      ├── canvasTimeStart/End (คำนวณจาก visible + buffer)
      └── width: 0 (ยังไม่รู้ขนาด)

componentDidMount()
  └── resize() → วัดขนาดจริงจาก DOM
      └── setState({ width })
          └── getDerivedStateFromProps()
              └── stackTimelineItems() → คำนวณ dimensionItems, groupHeights, groupTops
```

### 1.2 Re-render (เมื่อ props หรือ state เปลี่ยน)

```
getDerivedStateFromProps(props, state)
  │
  ├── ถ้า items หรือ groups เปลี่ยน → re-stack ทั้งหมด
  │   └── stackTimelineItems()
  │
  ├── ถ้า visibleTime เปลี่ยน (controlled mode) → update canvas
  │   └── calculateScrollCanvas()
  │
  └── return derivedState (หรือ null ถ้าไม่มีอะไรเปลี่ยน)
```

**สำคัญ:** `getDerivedStateFromProps` ถูกเรียกทุกครั้งที่ render ไม่ว่า props จะเปลี่ยนหรือไม่ ระวังเรื่อง performance

---

## 2. Stacking Algorithm — คำนวณตำแหน่ง items

อยู่ใน `utility/calendar.tsx` → `stackTimelineItems()`

### ขั้นตอน:

```
Input: items[], groups[], canvasWidth, canvasTimeStart/End, keys, lineHeight, ...

Step 1: สร้าง groupOrders (map: groupId → { index, group })
         ├── ใช้ keys.groupIdKey เพื่อหา group id
         └── ให้แต่ละ group มี index (0, 1, 2, ...)

Step 2: สำหรับแต่ละ item → คำนวณ Dimension
         ├── left = calculateXPositionForTime(item.start_time)
         ├── width = calculateXPositionForTime(item.end_time) - left
         ├── collisionLeft / collisionWidth (สำหรับ stacking collision detection)
         ├── order = groupOrders[item.group]
         └── height = item.height || (lineHeight * itemHeightRatio)

Step 3: จัดกลุ่ม items ตาม group
         └── groupedItems: Map<groupIndex, ItemDimension[]>

Step 4: สำหรับแต่ละ group → stack items ภายใน group
         ├── ถ้า stackItems = true:
         │   └── เรียง items ตาม collisionLeft
         │       └── วาง item ลง → ถ้าชนกับ item อื่น → ขยับลงข้างล่าง
         │           └── groupHeight อาจเพิ่มขึ้น
         └── ถ้า stackItems = false:
             └── ทุก item อยู่แถวเดียวกัน

Step 5: คำนวณ groupTops (สะสม top position)
         ├── groupTops[0] = 0
         ├── groupTops[1] = groupHeights[0]
         ├── groupTops[2] = groupHeights[0] + groupHeights[1]
         └── ...

Output: { dimensionItems, height, groupHeights, groupTops }
```

### Collision Detection (stacking)

```
item A: |---collisionLeft---collisionWidth---|
item B:         |---collisionLeft---collisionWidth---|
                ↑ overlap! → B ต้องขยับลงข้างล่าง

ถ้าไม่มี overlap → B วางบน row เดียวกับ A ได้
```

---

## 3. Scroll System — รายละเอียด

### 3.1 Canvas Model

```
                      ┌─── buffer ───┐┌─── visible ───┐┌─── buffer ───┐
canvasTimeStart ──────|───────────────||───────────────||───────────────|────── canvasTimeEnd
                                      ↑                ↑
                              visibleTimeStart  visibleTimeEnd

canvasWidth = viewportWidth * buffer (default buffer=3, canvas = 3x viewport)
```

เมื่อ user scroll จน `visibleTime` เกินขอบ `canvasTime` → `calculateScrollCanvas()` คำนวณ canvas ใหม่ → re-render

### 3.2 ScrollElement.tsx — Horizontal Scroll

```
การ scroll แนวนอนไม่ได้ใช้ native scrollbar แต่ใช้:

1. Mouse drag:
   onPointerDown → จำ startX
   onPointerMove → deltaX = currentX - startX → onScroll(offset + deltaX)
   onPointerUp → stop

2. Mouse wheel (horizontal):
   onWheel → deltaX → onScroll(offset + deltaX)

3. Touch (mobile):
   onTouchStart → จำ startX
   onTouchMove → deltaX → onScroll(offset + deltaX)

4. Pinch zoom (mobile):
   2 fingers → คำนวณ distance → onZoom(scale)
```

### 3.3 Vertical Scroll

Vertical scroll เป็น **native** — ใช้ parent container ที่มี `overflow-y: auto`

Timeline เองไม่จัดการ vertical scroll แต่ใช้ `position: sticky` สำหรับ:
- Headers (ถ้า `stickyHeader=true`)
- Pinned groups (ถ้า `pinnedGroups` มีค่า)

---

## 4. Pinned Groups — ระบบ pin แถว (Fork Feature)

### 4.1 Data Flow

```
Timeline.render():
  1. stackTimelineItems() → ได้ dimensionItems สำหรับ ALL groups

  2. ถ้า pinnedGroups มีค่า:
     └── split groups เป็น 2 ชุด:
         ├── pinnedGroupsList (groups ที่ pin)
         └── scrollGroupsList (groups ที่ไม่ pin)

     └── split items เป็น 2 ชุด:
         ├── pinnedDimensionItems
         └── scrollDimensionItems

     └── คำนวณ pinnedHeight (ผลรวมของ pinnedGroupHeights)

  3. Render 2 layers:
     ├── Pinned Layer (position: sticky, top: headerHeight)
     │   ├── PinnedSidebar
     │   ├── PinnedScrollElement (synced horizontal scroll)
     │   │   ├── Columns
     │   │   ├── PinnedGroupRows
     │   │   └── Items (pinnedDimensionItems)
     │   └── PinnedSidebar (right)
     │
     └── Scroll Layer (ปกติ)
         ├── Sidebar
         ├── ScrollElement
         │   ├── Columns
         │   ├── GroupRows (scrollGroupsList)
         │   └── Items (scrollDimensionItems)
         └── Sidebar (right)
```

### 4.2 Sticky ทำงานได้เพราะ

```
CSS position: sticky ต้องการ:
1. ✅ Parent ที่มี overflow-y: auto (scroll container)
2. ✅ ไม่มี ancestor ที่ overflow: hidden ระหว่าง sticky กับ scroll container
   → เราใช้ overflow: clip แทน hidden
3. ✅ ค่า top ที่ถูกต้อง
   → header: top: 0
   → pinned: top: [header-height] (คำนวณ dynamic)
```

### 4.3 Horizontal Scroll Sync

Pinned layer ไม่มี native scroll แต่ sync กับ scroll layer ผ่าน `transform: translateX(-scrollOffset)`

---

## 5. Item.tsx — Drag & Resize Deep Dive

### 5.1 interactjs Integration

```tsx
// Item.tsx componentDidMount / componentDidUpdate

interact(element)
  .draggable({
    onstart: this.dragStart,
    onmove: this.dragMove,
    onend: this.dragEnd,
  })
  .resizable({
    edges: { left: canResizeLeft, right: canResizeRight },
    onstart: this.resizeStart,
    onmove: this.resizeMove,
    onend: this.resizeEnd,
  })
```

### 5.2 Drag Flow

```
dragStart(e):
  ├── lock scroll (ป้องกัน scroll ขณะ drag)
  ├── จำตำแหน่งเริ่มต้น
  └── set isDragging = true

dragMove(e):
  ├── deltaX = e.pageX - startX
  ├── dragTime = คำนวณ time จาก deltaX (ใช้ coordinateToTimeRatio)
  ├── deltaY = e.pageY - startY
  ├── newGroupOrder = คำนวณ group จาก deltaY (ใช้ groupTops)
  ├── dragSnap → snap to grid (default 15 min)
  ├── moveResizeValidator() → validate ก่อน apply
  └── props.onDrag({ itemId, time, newGroupOrder })
      └── Timeline setState → re-render with drag overlay

dragEnd(e):
  ├── props.onDrop(itemId, dragTime, newGroupOrder)
  │   └── Timeline เรียก onItemMove callback
  └── reset drag state
```

### 5.3 Resize Flow

```
resizeStart(e):
  ├── กำหนด edge (left หรือ right)
  └── จำตำแหน่งเริ่มต้น

resizeMove(e):
  ├── deltaX = distance dragged
  ├── resizeTime = คำนวณ time ใหม่
  ├── moveResizeValidator() → validate
  └── props.onResizing(itemId, resizeTime, edge)

resizeEnd(e):
  └── props.onResized(itemId, resizeTime, edge, delta)
      └── Timeline เรียก onItemResize callback
```

---

## 6. Header System

### 6.1 โครงสร้าง

```
TimelineHeaders (container)
├── SidebarHeader (left) — ช่องว่างเหนือ sidebar
├── Calendar Headers
│   ├── DateHeader (primaryHeader) — เช่น "January 2024"
│   └── DateHeader (secondary)     — เช่น "1, 2, 3, ..."
└── SidebarHeader (right, optional)
```

### 6.2 DateHeader คำนวณ intervals

```
DateHeader → CustomHeader → iterateTimes()

iterateTimes(canvasTimeStart, canvasTimeEnd, unit, timeSteps, callback):
  ├── เริ่มจาก startOf(unit) ของ canvasTimeStart
  ├── วนลูป: time → time.add(timeStep, unit)
  └── callback(time, nextTime) สำหรับแต่ละ interval
      └── render <Interval /> component
```

### 6.3 Zoom → Unit Selection

```
getMinUnit(zoom, width, timeSteps):
  zoom = visibleTimeEnd - visibleTimeStart (ms)

  ถ้า zoom ≈ 1 ชั่วโมง  → unit = "minute"
  ถ้า zoom ≈ 1 วัน      → unit = "hour"
  ถ้า zoom ≈ 1 เดือน    → unit = "day"
  ถ้า zoom ≈ 1 ปี       → unit = "month"
  ถ้า zoom ≈ หลายปี     → unit = "year"

  คำนวณจาก: กี่ cells จะ render ได้ที่ minCellWidth (17px)
```

---

## 7. Columns (Vertical Grid Lines)

```
Columns.tsx:
  ├── ใช้ iterateTimes() เหมือน DateHeader
  ├── สำหรับแต่ละ interval → render <div> แนวตั้ง
  └── verticalLineClassNamesForTime → เพิ่ม className (เช่น weekend)
```

---

## 8. Markers System

```
User API:
<Timeline>
  <TimelineMarkers>
    <TodayMarker />           ← เส้นแนวตั้งที่วันนี้
    <CursorMarker />          ← เส้นตาม cursor
    <CustomMarker date={...}> ← เส้นที่กำหนดเอง
  </TimelineMarkers>
</Timeline>

ข้างใน:
  ├── TimelineMarkersContext → เก็บ list ของ markers
  ├── MarkerCanvas → subscribe to context → render markers
  └── แต่ละ marker → คำนวณ left position จาก date → time → pixel
```

---

## 9. Performance Considerations

### Hot Paths (ทำงานบ่อย ระวัง performance)

1. **`stackTimelineItems()`** — ถูกเรียกทุกครั้งที่ props เปลี่ยน
   - ใช้ `memoize-one` เพื่อ cache ผลลัพธ์
   - O(n) สำหรับ n items

2. **`render()`** — ถูกเรียกทุกครั้งที่ scroll
   - `scrollOffset` เปลี่ยน → re-render
   - แต่ `dimensionItems` ไม่เปลี่ยน (ยกเว้น canvas เปลี่ยน)

3. **`shouldComponentUpdate`** — GroupRows, PinnedGroupRows มี SCU
   - เปรียบเทียบ groupHeights, canvasWidth
   - ป้องกัน re-render ที่ไม่จำเป็น

### ถ้า Timeline ช้า

1. ลดจำนวน items ที่ render (filter items ที่อยู่นอก canvas ออก)
2. ใช้ `buffer` prop ที่เล็กลง (default 3 → ลองใช้ 2)
3. ใช้ `React.memo` หรือ `shouldComponentUpdate` ใน custom renderers
4. ตรวจสอบว่า items/groups ไม่ถูกสร้างใหม่ทุก render (referential equality)
