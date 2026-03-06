# Contributing — Dev Setup & Workflow

> เอกสารนี้เขียนสำหรับ dev ที่เพิ่งเข้ามาทำงานกับ lib นี้ อ่านจบแล้วสามารถ setup, run, test, build ได้เลย

---

## 1. Setup

```bash
# Clone repo
git clone https://github.com/YOUR_ORG/react-calendar-timeline.git
cd react-calendar-timeline

# Install dependencies
npm install

# Install demo dependencies
cd demo && npm install && cd ..
```

### Prerequisites
- Node.js >= 18
- npm >= 10

---

## 2. Development — รัน Demo App

```bash
cd demo
npm run dev
# → http://localhost:5173
```

Demo app มี routes ให้ทดสอบแต่ละฟีเจอร์:

| Route | ทดสอบอะไร |
|-------|-----------|
| `/` | Basic timeline |
| `/CustomPinnedGroups` | Pinned groups + sticky header |
| `/DemoPerformance` | 5000 items stress test |
| `/CustomItems` | Custom item renderer |
| `/CustomHeaders` | Custom header renderer |
| `/ControlledScrolling` | Controlled time range |
| `/RowHeight` | Dynamic row height |
| `/Renderers` | Group/item renderers |

### วิธีเพิ่ม Demo ใหม่

1. สร้างโฟลเดอร์ `demo/src/demo-xxx/index.jsx`
2. เพิ่ม route ใน `demo/src/App.tsx`:
```tsx
import DemoXxx from "./demo-xxx";

// เพิ่มใน routes array:
{ path: "/DemoXxx", Component: withLayout(DemoXxx) }
```

---

## 3. Testing

```bash
# รัน tests ทั้งหมด
npm test

# รัน tests แบบ watch mode (auto-rerun เมื่อแก้ไฟล์)
npm run test:watch

# รัน tests พร้อม coverage report
npm run test:coverage
```

### โครงสร้าง Tests

```
__tests__/
├── setup.ts                    ← Setup file (jsdom environment)
├── tsconfig.json               ← TypeScript config สำหรับ tests
├── index.test.tsx              ← Main timeline tests
├── test-utility/               ← Test helpers
│   ├── index.ts
│   ├── header-renderer.tsx
│   └── headerRenderers.tsx
├── components/
│   ├── Columns/
│   ├── GroupRow/
│   ├── Headers/
│   └── ...
└── utils/
    ├── calendar/               ← Unit tests สำหรับ calendar utilities
    ├── dom-helpers/
    ├── events.test.ts
    └── generic.test.ts
```

### เขียน Test ใหม่

```tsx
// __tests__/components/xxx.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('MyFeature', () => {
  it('should do something', () => {
    // arrange
    // act
    // assert
  })
})
```

---

## 4. Build

```bash
# Build library สำหรับ production
npm run build
# → output ไปที่ dist/
#   ├── react-calendar-timeline.es.js   (ESM)
#   ├── react-calendar-timeline.cjs.js  (CommonJS)
#   ├── index.d.ts                      (TypeScript types)
#   ├── style.css                       (Compiled CSS)
#   └── Timeline.scss                   (Source SCSS)
```

### Build เสร็จแล้วเช็คอะไร
- `dist/` มีไฟล์ครบ
- Types ไม่มี error: `npx tsc --noEmit`
- Lint ผ่าน: `npm run lint`

---

## 5. Linting & Formatting

```bash
# Lint
npm run lint

# Fix lint errors
npm run lint:fix
```

- **Prettier** — format อัตโนมัติเมื่อ commit (via husky + lint-staged)
- **ESLint** — TypeScript rules + React rules
- ไม่ต้อง format มือ — pre-commit hook ทำให้อัตโนมัติ

---

## 6. Git Workflow

### Branch Strategy
```
main        ← production branch, deploy จากที่นี่
feature/*   ← branch สำหรับฟีเจอร์ใหม่
fix/*       ← branch สำหรับ bug fix
```

### Commit Convention
```
feat: add new feature
fix: fix a bug
docs: documentation changes
refactor: code refactoring
test: add/update tests
chore: maintenance tasks
```

### ขั้นตอน
```bash
# 1. สร้าง branch
git checkout -b feature/my-new-feature

# 2. ทำงาน + commit
git add .
git commit -m "feat: add my new feature"

# 3. Push
git push origin feature/my-new-feature

# 4. สร้าง PR → main
```

---

## 7. โครงสร้างไฟล์สำคัญ

```
react-calendar-timeline/
├── src/
│   ├── index.ts              ← ★ Public exports (ต้องเพิ่มเมื่อสร้าง component ใหม่)
│   └── lib/
│       ├── Timeline.tsx      ← ★ God Component (~1,400 lines)
│       ├── Timeline.scss     ← ★ All styles
│       ├── types/main.ts     ← ★ All types
│       └── ...
├── __tests__/                ← Tests
├── demo/                     ← Demo app (Vite + React Router)
├── docs/                     ← เอกสาร dev (คุณกำลังอ่านอยู่)
├── vite.config.mts           ← Build config
├── vitest.config.ts          ← Test config
├── tsconfig.json             ← TypeScript config
└── package.json
```

---

## 8. Dependencies ที่ต้องรู้

| Package | ใช้ทำอะไร | อยู่ที่ไหน |
|---------|-----------|-----------|
| `interactjs` | Drag & resize items | `items/Item.tsx` |
| `dayjs` | Date math (แทน moment.js) | ทั่ว codebase |
| `lodash` | `isEqual` deep comparison | `items/Item.tsx` |
| `classnames` | CSS class composition | headers |
| `memoize-one` | Memoize expensive calculations | `utility/calendar.tsx` |

---

## 9. Troubleshooting

### "Build ไม่ผ่าน"
```bash
npm run clean    # ลบ dist/
npm run build    # build ใหม่
```

### "Test ไม่ผ่าน"
```bash
npm test -- --reporter=verbose    # ดู error detail
```

### "Demo ไม่ขึ้น"
```bash
cd demo
rm -rf node_modules
npm install
npm run dev
```

### "TypeScript error"
```bash
npx tsc --noEmit    # เช็ค type errors โดยไม่ build
```

### "Sticky ไม่ทำงาน"
- เช็คว่า parent container มี `overflow-y: auto` + fixed height
- เช็คว่าไม่มี ancestor ที่ `overflow: hidden` (ต้องเป็น `overflow: clip`)
- ดูรายละเอียดใน ARCHITECTURE.md section 9
