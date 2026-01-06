# GlassBox

<p align="center">
  <img src="./public/logo.svg" alt="GlassBox Logo" width="120" height="120" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

**An X-Ray system for debugging multi-step, non-deterministic algorithmic pipelines.**

See through your algorithms. Understand **why** decisions are made, not just **what** happened.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Quick Start](#quick-start)
- [SDK Usage](#sdk-usage)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

---

## The Problem

Modern software increasingly relies on multi-step, non-deterministic processes:

- An LLM generates search keywords from a product description
- A search API returns thousands of results
- Filters narrow down candidates based on business rules
- A ranking algorithm selects the final output

**Traditional logging tells you what happened, but not why a particular decision was made.**

When the final output is wrong, you're left reverse-engineering the entire pipeline. GlassBox solves this.

---

## The Solution

GlassBox provides transparency into multi-step decision processes by capturing:

| Traditional Tracing     | GlassBox                              |
| ----------------------- | ------------------------------------- |
| Function calls & timing | **Decision reasoning**                |
| Service spans           | **Candidates evaluated**              |
| "What happened?"        | **"Why this output?"**                |
| Performance metrics     | **Filter logic & selection criteria** |

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/AtharvRG/glassbox.git
cd glassbox
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** and run the contents of `supabase.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo application.

---

## SDK Usage

### Basic Example

```typescript
import { GlassBox } from "@/lib/glassbox";

// 1. Create an instance for your pipeline
const xray = new GlassBox("Competitor Search");

// 2. Start a new execution session
const executionId = await xray.start({
  user_id: "abc123",
  environment: "production",
});

// 3. Wrap each step of your logic
const keywords = await xray.step(
  "keyword_generation",
  async () => ({
    output: await generateKeywords(input),
    reasoning: "Extracted key product attributes: material, size, features",
  }),
  { input_product: "Water Bottle" }
);

const candidates = await xray.step(
  "search",
  async () => ({
    output: await searchProducts(keywords),
    reasoning: `Found ${results.length} products matching search terms`,
  }),
  { keywords }
);

// 4. Mark execution as complete
await xray.finish("completed");
```

### The StepResult Pattern

Every step must return a `StepResult<T>` object:

```typescript
type StepResult<T> = {
  output: T; // The actual return value of your logic
  reasoning?: string; // The "Why" - human-readable explanation
};
```

The `reasoning` field is what makes GlassBox powerful—it captures the **why** behind each decision.

### Key Features

- **Non-blocking** - Step logging is fire-and-forget (async)
- **Fail-safe** - If logging fails, your app continues working
- **General-purpose** - Works with any pipeline, not just competitor search
- **Minimal overhead** - Only adds ~5-10ms per step for DB write

---

## Project Structure

```
glassbox/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── demo/                 # Demo Application
│   │   │   ├── page.tsx          # Competitor Finder UI
│   │   │   ├── actions.ts        # Server actions (pipeline logic)
│   │   │   └── data.ts           # Filter rules & category mappings
│   │   │
│   │   └── xray/                 # X-Ray Dashboard
│   │       ├── page.tsx          # Executions list view
│   │       └── [id]/page.tsx     # Trace detail view
│   │
│   └── lib/
│       ├── glassbox.ts           # THE SDK - Core library
│       ├── supabase.ts           # Supabase client
│       └── puter-llm.ts          # Puter.js LLM wrapper
│
├── supabase.sql                  # Database schema + seed data
├── ARCHITECTURE.md               # Technical architecture & design decisions
└── README.md                     # This file
```

### Key Files

| File                         | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `src/lib/glassbox.ts`        | **The SDK** - Lightweight wrapper class for capturing decision trails |
| `src/app/demo/actions.ts`    | Server-side pipeline logic with GlassBox instrumentation              |
| `src/app/xray/[id]/page.tsx` | Rich visualization of step-by-step decision reasoning                 |
| `supabase.sql`               | Complete database schema with 35 seed products                        |

---

## Documentation

### Architecture & Design

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:

- Data model rationale and design decisions
- Debugging walkthrough with examples
- Queryability patterns for cross-pipeline analysis
- Performance & scale trade-offs
- Developer experience guide
- Real-world application examples
- Future roadmap

### Database Schema

**Executions Table:**

```sql
executions (
  id uuid PRIMARY KEY,
  created_at timestamp,
  name text,
  status text,
  metadata jsonb
)
```

**Steps Table:**

```sql
steps (
  id uuid PRIMARY KEY,
  execution_id uuid REFERENCES executions(id),
  created_at timestamp,
  step_name text,
  step_order int,
  input jsonb,
  output jsonb,
  reasoning text,        -- The core X-Ray feature
  status text,
  duration_ms int
)
```

### Demo Application

The included demo showcases GlassBox with a **Competitor Product Finder** pipeline:

1. **Keyword Generation** (Puter.js LLM) - Generate search terms
2. **Candidate Search** (Supabase Query) - Retrieve products
3. **Apply Filters** (Business Rules) - Filter by price, rating, reviews
4. **Relevance Evaluation** (Puter.js LLM) - Classify TRUE_MATCH vs FALSE_POSITIVE
5. **Rank & Select** (Puter.js LLM) - Select winner with reasoning

**Sample Data:** 35 products across 6 categories (Water Bottles, Running Shoes, Wireless Earbuds, Backpacks, Yoga Mats, Tumblers)

---

## Dashboard Features

### Executions List (`/xray`)

View all pipeline executions with:

- Execution name and UUID
- Status badge (completed, failed, running)
- Relative timestamp
- Quick navigation to detailed trace

### Trace Detail View (`/xray/[id]`)

Step-by-step timeline visualization showing:

- **Reasoning** - Why each decision was made
- **Filter Breakdown** - Which filters each candidate passed/failed
- **Specific Failure Reasons** - "Price $8.99 < $10.00 minimum"
- **LLM Classifications** - TRUE_MATCH, CLOSE_ALTERNATIVE, FALSE_POSITIVE with scores
- **Selection Explanation** - Why the winner was chosen AND why others weren't #1

---

## Known Limitations

1. **Supabase Dependency** - SDK is tightly coupled to Supabase. A generic storage interface would improve portability.
2. **No Real-time Updates** - Dashboard requires page refresh to see new executions.
3. **No Trace Comparison** - Cannot compare two executions side-by-side.
4. **No Retention Policies** - Old executions accumulate indefinitely.
5. **Single-tenant Design** - No user authentication or multi-tenant isolation.

See [ARCHITECTURE.md](./ARCHITECTURE.md#future-roadmap) for the production roadmap.

---

## License

MIT License - Feel free to use this in your own projects.

---

<p align="center">
  <strong>Built for the Founding Full-Stack Engineer Take-Home Assignment</strong><br/>
  <em>Demonstrating system design, SDK architecture, and dashboard UX</em>
</p>
