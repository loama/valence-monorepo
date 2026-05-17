# SuperTruth — Grounded Research Protocol

**Purpose:** Produce verified, high-confidence answers to factual and data questions by running parallel independent research agents and a dedicated checker synthesizer. Use this when "good enough" is not acceptable and accuracy is critical.

---

## When to Use

**Use SuperTruth for:**
- Internal metrics: Stripe billing, API error rates, usage stats, Supabase query results
- Data questions where the answer will drive a business decision or action
- Anything where a past answer has been wrong and needs re-verification
- Explicit invocation: `/supertruth`, "I need to be sure about X", "verify this", "exact numbers"
- Complex multi-source analysis (e.g., summarize action items from recorded meetings)

**Do NOT use SuperTruth for:**
- Subjective or strategic questions ("what should we do about X?")
- Creative tasks, writing, design
- Simple lookups with one clear authoritative source and no ambiguity
- Questions where speed matters more than certainty

---

## Phase 0: Pre-flight Clarification (Blocking)

Before launching any research agents, the main agent conducts a blocking pre-flight interview.

**Step 1 — Identify all ambiguities in the question:**
- Time range (last 30 days? all time? fiscal quarter? specific dates?)
- Environment scope (production? staging? a specific account/tenant?)
- Definition of key terms (what counts as "active"? what counts as "error"? what's the unit?)
- Expected order of magnitude (if the user has intuition — useful to detect anomalies later)
- Depth requested (surface report vs. full audit — default is surface unless asked)
- Available data sources (which tools/APIs/DBs are accessible?)

**Step 2 — Ask all clarifying questions in ONE message.** Do not ask piecemeal. Wait for answers before proceeding.

**Step 3 — Write a precise Research Brief.** This becomes the input for all three agents:

```
QUESTION: [Restated precisely, with no ambiguity]
SCOPE: [Time range / environment / filters]
DEFINITIONS: [Key terms explicitly defined]
EXPECTED RANGE: [User's intuition, if shared — used for plausibility checking]
DATA SOURCES: [Which tools/APIs/DBs are accessible]
DEPTH: [surface | standard | deep audit]
TOOLS AVAILABLE: [List all MCP tools, APIs, databases the agents can reach]
```

---

## Phase 1: Parallel Research — 3 Independent Agents

Launch all three agents simultaneously using the `Agent` tool. Each receives the Research Brief and their specific lens. **Agents must not share work, see each other's output, or use each other as sources.**

The three paths are designed to force source independence — agreement across all three is meaningful because they took genuinely different routes.

---

### Agent A — Data Direct

**Role:** Pull exact numbers from primary data sources. Minimize interpretation. Report what the data literally says.

**Prompt template:**
```
You are Agent A in a SuperTruth research task. Your job is to answer the question below by going DIRECTLY to primary data sources — databases, APIs, raw logs, official dashboards. Do not interpret or editorialize. Report exactly what the data says.

RESEARCH BRIEF:
[Insert Research Brief]

Your output MUST include:

1. THE ANSWER: Exact numbers/facts pulled directly from data
2. SOURCES: Precisely which queries, endpoints, tables, or dashboards you used — include actual SQL or API calls if applicable
3. RAW DATA SNIPPETS: Key data points with timestamps and context (not summaries — actual values)
4. DATA CONFIDENCE: How certain are you that the data is accurate? (HIGH / MEDIUM / LOW + one sentence why)
5. ASSUMPTIONS: Any assumptions you had to make (e.g. timezone, filters applied, what counts as X)
6. FLAGS: Anything that seemed unusual, unexpected, suspiciously clean, or potentially wrong — even if you can't explain it
```

---

### Agent B — Corroborating Path

**Role:** Answer the same question via a DIFFERENT route. Derive the answer independently — not by querying the same table or endpoint. Cross-check from an orthogonal angle.

**Examples of orthogonal paths:**
- If A queries a `revenue` table → B derives revenue from `invoice_count × average_price`
- If A queries a `500_errors` log table → B checks rate from a metrics/monitoring API
- If A queries Supabase directly → B cross-checks via the application-layer API response logs
- If A counts rows in table X → B counts via a join or aggregation from a related table

**Prompt template:**
```
You are Agent B in a SuperTruth research task. Your job is to answer the question below using a DIFFERENT METHOD and DIFFERENT DATA PATH than a direct database query. Do not query the same primary table that a naive answer would use. Cross-check via an orthogonal route — a different calculation, a different API, a different aggregation.

RESEARCH BRIEF:
[Insert Research Brief]

Your output MUST include:

1. THE ANSWER: Your independently-derived answer
2. METHOD: Explicitly describe how your path differs from a direct source query
3. SOURCES: What you actually used
4. CONVERGENCE CHECK: Does your answer match what you'd expect from a direct source? If not, explain the delta
5. DATA CONFIDENCE: (HIGH / MEDIUM / LOW + one sentence why)
6. FLAGS: Discrepancies, anomalies, or anything that made you pause
```

---

### Agent C — Skeptical Adversary

**Role:** Actively try to find reasons the naive answer is wrong, incomplete, or misleading. You are not here to answer — you are here to break the answer. Check for configuration issues, definitional traps, data integrity issues, and misleading aggregations.

**Key failure modes to probe:**
- 100% rates (anything) — almost always a configuration artifact, not reality
- Sudden spikes or drops — could be a logging failure, not a real signal
- Deleted or soft-deleted records not excluded from counts
- Timezone or DST artifacts in time-ranged queries
- Schema changes or column renames in the recent period
- Default values written into rows by configuration (not by user action)
- Differences between what a tool *says* it tracks and what it *actually* tracks
- Filtered-out records that should be included (or vice versa)

**Prompt template:**
```
You are Agent C in a SuperTruth research task. Your job is to actively try to DISPROVE or COMPLICATE the answer to the question below. Assume the naive answer might be wrong. Your job is NOT to give the final answer — it is to surface every reason the data could be misleading, incomplete, or misinterpreted.

RESEARCH BRIEF:
[Insert Research Brief]

Your output MUST include:

1. THE NAIVE ANSWER: What the data would say at face value
2. RED FLAGS: Specific things that could make that answer wrong or incomplete (be concrete — not "data might be inaccurate" but "the `email_verified` column defaults to TRUE in this Supabase configuration, meaning 100% rates are expected regardless of actual user action")
3. ALTERNATIVE EXPLANATIONS: Other reasons the data might look this way
4. DATA CONFIDENCE: How confident are you that the numbers are accurate? (HIGH / MEDIUM / LOW + reason)
5. INTERPRETATION CONFIDENCE: Even if the data is accurate, how confident are you it means what we think it means? (HIGH / MEDIUM / LOW + reason)
6. DEPTH RECOMMENDATION: Would you recommend digging deeper into the source system? Why? (Respect the DEPTH setting in the brief — don't recommend deep audit if DEPTH=surface unless there's a blocking reason)
```

---

## Phase 2: Checker Synthesis

A fourth agent (the Checker) receives all three reports and synthesizes them. The Checker does NOT do additional research — it evaluates what the three agents found.

**Checker prompt template:**
```
You are the Checker in a SuperTruth research task. Three independent agents investigated the same question from different angles. Your job is to evaluate their findings and produce a verified, synthesized answer — or to clearly identify why that's not yet possible.

ORIGINAL RESEARCH BRIEF:
[Insert Research Brief]

AGENT A REPORT (Data Direct):
[Insert Agent A's full output]

AGENT B REPORT (Corroborating Path):
[Insert Agent B's full output]

AGENT C REPORT (Skeptical Adversary):
[Insert Agent C's full output]

Evaluate on these dimensions:

1. AGREEMENT: Do A and B converge on the same answer? This must be specific — not "roughly similar" but "A says 1,247, B says 1,251 (0.3% delta from different aggregation methods)". What explains any delta?

2. SOURCE INDEPENDENCE: Did A and B use genuinely different data paths, or did they ultimately rely on the same underlying source? If they both traced back to the same table or API, their agreement is less meaningful.

3. C's CONCERNS: Did the skeptical agent identify anything that changes the *interpretation* of the data even if the data itself is accurate? (e.g., 100% email verified = configuration artifact, not user behavior). These must be surfaced even if A and B perfectly agree.

4. PLAUSIBILITY: Does the answer pass a basic sanity check given the expected range and domain knowledge? (100% anything, suspiciously round numbers, and results that contradict stated expectations are red flags)

5. DUAL CONFIDENCE:
   - DATA CONFIDENCE: How certain are we the numbers are accurate? (HIGH / MEDIUM / LOW)
   - INTERPRETATION CONFIDENCE: How certain are we we're reading them correctly in context? (HIGH / MEDIUM / LOW)

Then assign a confidence tier:
- VERIFIED: A+B agree via genuinely independent paths, C found no blocking concerns, plausibility passes, both confidence dimensions are HIGH
- PROBABLE: Agreement exists but source paths partially overlap, or C raises minor concerns, or one confidence dimension is MEDIUM
- UNCERTAIN: A and B meaningfully disagree, or C raises a concern significant enough to change the answer → request a tiebreaker
- UNVERIFIABLE: The question cannot be answered with available tools and data

If UNCERTAIN: identify the exact point of disagreement and write a precise tiebreaker brief describing what a fourth agent should focus on to resolve it.
```

---

## Phase 3: Tiebreaker (if UNCERTAIN)

If the Checker returns UNCERTAIN, launch Agent D — a focused tiebreaker agent.

Agent D receives:
- The original Research Brief
- All three agent reports
- The Checker's specific tiebreaker brief (the exact conflict to resolve)

Agent D's job is narrow: resolve only the identified conflict. It may use any available data source.

**If Agent D resolves the conflict:** the Checker re-evaluates and assigns a final tier (VERIFIED or PROBABLE).

**If Agent D cannot resolve the conflict:** escalate to the user. Show them:
- What agents A and B found (the specific disagreement)
- What Agent C flagged
- What Agent D tried and why it couldn't resolve it
- A concrete question for the user to decide how to proceed

Do not collapse unresolved conflicts into a single answer.

---

## Phase 4: Output Format

**Never dump raw agent reports.** Always synthesize. The user gets one coherent answer, not four separate monologues.

### Standard output:

```
## Answer

[Clear, direct answer in 1–3 sentences. Include specific numbers/facts. No hedging.]

## Confidence

**[VERIFIED / PROBABLE / UNCERTAIN / UNVERIFIABLE]**
- Data confidence: [HIGH / MEDIUM / LOW] — [one sentence: why, and what would change it]
- Interpretation confidence: [HIGH / MEDIUM / LOW] — [one sentence: why, and what would change it]

## Key Notes

[2–4 bullet points max. Cover: important caveats, anomalies Agent C flagged, assumptions made, anything that changes how to act on the answer. Omit if nothing material.]

## Sources

[Bullet list of what was actually queried/checked — specific enough to reproduce]
```

### When UNVERIFIABLE, add:

```
## Best Guess

[Answer + explicit reasoning chain — how you got there from available evidence]

⚠️ This is an inference, not verified data. [Explain specifically why it can't be verified and what would be needed to verify it.]
```

### When PROBABLE or UNCERTAIN with C concerns, add an interpretation warning:

```
⚠️ Interpretation caveat: [Plain-language explanation of why the data might be technically accurate but contextually misleading — e.g., "100% email verification likely reflects a Supabase default configuration, not actual user-completed verification flows. Recommend checking email confirmation settings before acting on this number."]
```

---

## Mid-Research Clarification (Long Tasks)

For research tasks that run longer than 10–20 minutes of wall time:
1. Agents flag blocking ambiguities in their reports under a `NEEDS CLARIFICATION` section
2. If any agent flags a blocker, the Checker escalates before producing a final synthesis
3. The main agent asks the user the specific question
4. Relevant agents re-run with the clarification incorporated
5. Do not produce a final answer until the clarification is resolved

Short-running tasks: clarification only happens in Phase 0 (pre-flight). Agents flag assumptions, not questions.

---

## Confidence Tier Reference

| Tier | Meaning | When to use |
|---|---|---|
| **VERIFIED** | High confidence, independently confirmed | A+B agree via independent paths, C clean, plausibility passes |
| **PROBABLE** | Good confidence, minor caveats | Agreement exists but source overlap or minor C concerns |
| **UNCERTAIN** | Significant doubt | A/B disagree meaningfully, or C identifies interpretation-changing concern |
| **UNVERIFIABLE** | Cannot confirm with available tools | No data path leads to a reliable answer |

---

## Anti-patterns — Never Do These

- **Correlated agreement**: A and B both querying the same Supabase table via different queries is NOT independent verification. Trace all the way back to the root data source.
- **Plausibility blindness**: 100% anything, suspiciously round numbers, results that contradict user expectations — flag them, don't accept them silently.
- **Confidence inflation**: PROBABLE is not VERIFIED. The tier must be honest, not reassuring.
- **Depth creep**: Do not automatically audit the underlying system because something looks suspicious. Flag it, state your interpretation confidence, and let the user decide whether to go deeper.
- **Verbose dumps**: The user gets a synthesized answer. Never paste raw agent output.
- **False resolution**: If agents disagree and the tiebreaker can't resolve it, say so. Do not pick the "most reasonable" answer and call it VERIFIED.
- **Skipping Phase 0**: Pre-flight clarification is not optional. Ambiguous questions produce correlated wrong answers across all three agents.
