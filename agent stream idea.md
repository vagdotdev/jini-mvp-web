# Agent Stream

**A real-time supervision interface for orchestrating AI agents — where the human watches the room think, and steps in only when judgment matters.**

---

## Origin

The idea came from a specific moment during a Cursor session. While watching a model's output stream in — token by token, line by line — a realization surfaced: *I'm not just reading this. I'm reacting to it. My brain is already deciding what to do next before the output finishes.* That mental activity — the half-formed "yes, keep going" or "wait, not like that" — is currently wasted. The interface doesn't capture it, and the model doesn't see it.

The next thought was: *what if this felt like a livestream?* One main participant (the orchestrator) working through a problem out loud on the primary screen. On the side, a group of specialized agents — not unlike Twitch chat participants or a production crew — watching, reacting when they have something real to contribute, and ready to peel off and execute once the direction locks.

That image — a live room where thinking is visible, reactions are ambient, and execution flows out of consensus — became Agent Stream.

---

## What it is

Agent Stream is a **real-time, watchable coordination surface for a team of AI agents**, designed around one principle: the human supervises by *presence and interruption*, not by reviewing after the fact.

It has two modes:

### 1. Live Stream (synchronous, first-person — the default)

The primary interface. One orchestrator agent ("Fable") plans and reasons out loud on the main stage. Specialist agents sit in the margin, visible as presence indicators. They react — briefly, only when genuinely triggered — as the plan develops.

The human watches this unfold. When the plan converges, agents deploy to execute in parallel. The human can interrupt at any point to redirect, override, or contribute judgment.

This mode is for **going deep** on a single problem: planning a feature, debugging a system, working through an architectural decision.

### 2. Team (asynchronous, multiplayer)

A secondary view, one click away in the sidebar. The entire team — humans and agents — share a single threaded channel. Agents post artifacts (diffs, test results, status), humans review and approve inline. Structured like a group chat, but every participant has a defined role and standing rules.

This mode is for **coordination across people and agents**: reviewing work, unblocking stalled runs, catching up on what happened while you were away.

The structural insight: **the stream is the intuitive default for a new user**; the team view is for when you need the full picture. Most competing tools invert this — they lead with the async/team surface (which reads as complex and enterprise-flavored to someone who just wants to get something done). Agent Stream leads with the thing that feels obvious: watch, react, steer.

---

## Core concepts

### The orchestrator

One primary agent — Fable — occupies the main stage. It plans out loud: reasoning through tradeoffs, naming edge cases, narrowing toward a concrete plan. Its output streams in real-time, like watching a model think.

Fable is not a chatbot waiting for prompts. It is a **visible planner** whose reasoning the human can observe, interrupt, and redirect at any point.

### Specialist agents

A set of purpose-built agents sit in the margin, each with a defined role and standing rules:

| Agent | Role | Standing rule (example) |
|-------|------|------------------------|
| Composer | Implementer | Match repo conventions. Smallest diff that works. No new dependencies without asking. |
| Sentry | Reviewer / critic | Flag security issues and judgment calls to a human. Never approve product voice alone. |
| Verify | Test runner | Block merge if coverage drops. Always test the critical path before green. |
| Ship | Deploy | Everything behind a feature flag. Never execute irreversible actions without human sign-off. |
| Scribe | Documentation / journal | Log every decision so context is never lost between sessions. |

These agents are **mostly quiet**. Their default state is *listening* — aware of what Fable is doing, but silent. They surface only when they have a real contribution: "I can take the implementation," "this is a security concern," "I have a test for that path." The design rule is deliberate: **silence is the default; a reaction means something.**

When the plan locks, agents deploy off the stream to execute in parallel. Progress is visible (status indicators, completion signals) without requiring the human to switch context.

### Standing rules

Each agent operates under explicit, human-defined rules that persist across sessions. These rules encode the human's standards, preferences, and non-negotiables — what the team calls "how we do things here."

Rules are visible in the interface (sidebar and team panel), editable by the human, and enforced during execution. They are the bridge between "I trust you to run" and "but not like *that*."

---

## Autopilot

The most distinctive mechanic. During a planning session, there are two kinds of human turns:

1. **Mechanical approvals** — "yes, do that," "sounds right, next," "go ahead." These are the ~90% of interactions where the human is simply confirming a recommended path. No original judgment is being added.

2. **Judgment calls** — product voice, naming, aesthetic direction, architectural tradeoffs, "actually, not like that." These are the ~10% where the human's specific perspective genuinely matters.

Autopilot automates the first category. The human engages with the orchestrator normally — explaining the goal, reacting to the plan, steering direction. At any point, they can activate autopilot, which:

- Continues generating the human's side of the conversation, conditioned on the session transcript and (critically) the codebase and git history as a model of this specific person's decision patterns
- Pushes through mechanical approvals without interruption
- **Automatically pauses when a judgment call is detected** — a decision that falls outside the human's established patterns, or that an agent flags as requiring human input
- Hands the seat back to the real human, who makes the call, then optionally resumes autopilot

The human can also pause manually at any time to inject direction.

The interface makes the distinction legible: autopilot-driven turns are visually marked (muted, labeled), while human turns are distinct (highlighted, attributed). At the end of a session, a tally shows: "Autopilot handled 14 turns. You stepped in on 3."

### The judgment classifier

The critical mechanism beneath autopilot is the **judgment classifier** — the system that decides whether a given decision is mechanical (autopilot proceeds) or requires human input (autopilot pauses).

This classifier draws on two sources:

**Durable prior: git history + codebase.** Every commit is a labeled decision. Reverts are negative signals. PR comments are explicit reasoning. Naming conventions, architectural choices, and patterns in the code itself encode the human's aesthetic and standards. This is "how they tend to decide."

**Live posterior: the current session.** How the human has been reacting *in this conversation* — what they approved quickly, what they pushed back on, what language they used. This is "how they are deciding right now, on this problem."

Autopilot proceeds when a decision is **in-distribution** against both sources. It pauses when a decision is:
- **Off-distribution** — no precedent in the history, or conflicts with established patterns
- **Flagged by a specialist** — e.g., Sentry identifying a product-voice call or a security-sensitive choice
- **Irreversible** — any action that cannot be undone (deploy to production, data deletion, public-facing copy) always requires explicit human confirmation, regardless of confidence

The honest reality: this classifier is the hardest unsolved component. The rest of the system — the streaming UI, the agent orchestration, the chat — is buildable with current tools. The judgment classifier is where the product either earns trust or becomes a yes-man. It is the core engineering challenge.

---

## Prior art and positioning

### AutoGPT (2023)

The first widely-seen attempt at "give an AI a goal and let it run autonomously." Went viral, then failed in practice: loops without termination, confident drift, hallucinated progress, runaway costs. The fundamental lesson: **a loop without a verifier produces confident garbage.** AutoGPT removed the human entirely; Agent Stream keeps them present but minimizes their effort.

### Goal mode (Cursor, Codex, Claude Code — current)

The human provides a single instruction; the agent executes autonomously, using tools, until done. This is **assistant-side autonomy** — the agent loops, the human waits.

Agent Stream's autopilot is different: it is **user-side autonomy** — the system generates the human's ongoing steering turns, not just the agent's execution. This is a strictly richer signal than a frozen goal, because it's conditioned on a live transcript of how the human reacts, not just what they initially asked for.

### Linzumi (YC S26)

Team chat where engineering teams direct fleets of coding agents from shared threads. Founded by Sean Grove (ex-OpenAI, sycophancy research). YC-backed, real funding.

Linzumi is **async and team-first**: agents post when done, humans review when they check. Agent Stream is **synchronous and individual-first**: the human watches in real-time and steers by presence.

| Dimension | Linzumi | Agent Stream |
|-----------|---------|--------------|
| Metaphor | Team chat (Slack) | Livestream (Twitch) |
| Primary user | Engineering team | Individual builder |
| Human role | Reviewer / unblocker | Active orchestrator |
| Interaction model | Async, pull-based | Sync, push-based |
| Default surface | Complex (team coordination) | Simple (one stream) |

The differentiation is in the **entry point and default mode**: Agent Stream leads with the intuitive, first-person stream; the team layer is secondary. Linzumi leads with the team channel. These are different bets on what feels natural to a new user.

### Trayce (open-source)

Agent-to-agent communication framework. A potential foundation for the inter-agent messaging layer — how agents share context, coordinate execution, and surface reactions to the orchestrator.

Forking or integrating Trayce's communication primitives could provide the infrastructure beneath Agent Stream's coordination layer, avoiding the need to build agent-to-agent messaging from scratch.

---

## Market context (July 2026)

The data is consistent and recent:

- **96% of developers** do not fully trust AI-generated code without manual review (Sonar, 2026). Trust has *fallen* even as capability and adoption increased.
- Developers spend **~24% of their work week** checking, fixing, and validating AI output — a phenomenon called the **"toil swap"** (you stopped writing code and started auditing it).
- The #1 daily pain point is **"near-correct" confident wrongness** — code that compiles, passes tests, and is wrong in ways you discover weeks later.
- **57% of engineering leaders** name code-review queue time as the top bottleneck; **49%** name spec/requirements clarity. The constraint has moved from generation to validation.
- The recognized missing layer is an **"agent control plane"** — lifecycle management, observability, fault tolerance, orchestration, governance. The quote that defines the gap: *"Between 'start the agents' and 'check the results tomorrow,' there is nothing."*
- The autonomous task ceiling in non-coding domains sits at **~3–5 steps** for anything not narrow, reversible, and low-stakes. Above that, human oversight is not optional.

### The structural insight

Coding agents work because **code has a free built-in verifier** — compiler, type checker, test suite. The loop gets honest yes/no feedback every iteration.

Most other domains — legal, finance, healthcare, commerce, communications — **have no automatic verifier**. The human *is* the verification layer. This means the cost of supervision directly determines whether agents are worth using at all.

Agent Stream's value proposition maps directly onto this: **reduce the cost of human supervision from "read the logs and review the diff" to "glance at the stream, type one sentence when it matters."** The cheaper supervision gets, the more domains agents become viable in.

This value **increases** as agents become more capable and parallel. Better agents don't eliminate the need for supervision — they make supervision the *only* remaining bottleneck.

---

## Architecture sketch

### Core surfaces

```
┌─────────────────────────────────────────────────────┐
│                    Agent Stream                      │
│                                                      │
│  ┌──────────┐  ┌────────────────────┐  ┌──────────┐ │
│  │          │  │                    │  │  Stream  │ │
│  │ Sidebar  │  │    Main Stage      │  │   Chat   │ │
│  │          │  │                    │  │          │ │
│  │ Modes    │  │  Fable plans out   │  │ Agent    │ │
│  │ Agents   │  │  loud — reasoning  │  │ presence │ │
│  │ + rules  │  │  streams in real   │  │ strip    │ │
│  │ Team     │  │  time              │  │          │ │
│  │ members  │  │                    │  │ Pinned   │ │
│  │          │  │  Plan card forms   │  │ context  │ │
│  │          │  │  when converging   │  │          │ │
│  │          │  │                    │  │ Reactions │ │
│  │          │  │  Autopilot banner  │  │ (sparse, │ │
│  │          │  │  + turn log when   │  │  signal  │ │
│  │          │  │  active            │  │  only)   │ │
│  │          │  │                    │  │          │ │
│  │          │  ├────────────────────┤  │ Send box │ │
│  │          │  │ Steer bar: input   │  │          │ │
│  │          │  │ + Go live / Pause  │  │          │ │
│  └──────────┘  └────────────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
```

### Mode switching

- **Live Stream** (default): main stage + stream chat. First-person, synchronous.
- **Team**: threaded channel with all humans + agents. Async, multiplayer.

One click in the sidebar switches between them. No context is lost — agents maintain state across both views.

### Agent communication layer

Agents need to:
1. **Observe** the orchestrator's reasoning stream (read access to Fable's output)
2. **React** with short, typed signals visible in the stream chat
3. **Receive assignments** when the plan locks (task + context + rules)
4. **Report progress** (status, artifacts, completion, errors)
5. **Escalate** to the human when they hit a defined boundary (irreversible action, off-distribution decision, explicit rule trigger)

This maps to a pub/sub message bus or a shared context document that agents read and write to. Trayce's agent-to-agent communication primitives are a candidate foundation.

### Judgment classifier inputs

```
                     ┌─────────────────────┐
                     │ Judgment Classifier  │
                     │                      │
  ┌──────────────┐   │   in-distribution?   │   ┌──────────────┐
  │  Git history  │──▶│   flagged by agent?  │◀──│ Live session  │
  │  + codebase   │   │   irreversible?      │   │  transcript   │
  └──────────────┘   │                      │   └──────────────┘
                     └──────┬───────────────┘
                            │
                    ┌───────▼───────┐
                    │  mechanical   │──▶ autopilot proceeds
                    └───────────────┘
                    ┌───────▼───────┐
                    │   judgment    │──▶ autopilot pauses,
                    └───────────────┘    human takes the seat
```

---

## Design principles

1. **Silence is the default.** Agents do not speak unless they have a real contribution. A quiet room means things are on track. Noise is reserved for signal.

2. **The stream is primary, the team view is secondary.** New users land in the intuitive, first-person mode. Complexity is one click away, not the front door.

3. **Presence over review.** The interface is designed for *watching* — ambient awareness of what's happening — not for *reviewing* after the fact. The human's value comes from being in the room, not from auditing a log.

4. **Autopilot-driven turns are visually distinct from human turns.** The user must always be able to tell their own words from the system's approximation. Trust depends on legibility.

5. **Irreversible actions always require explicit human confirmation.** No confidence threshold overrides this. Deploy, delete, publish — these pause regardless.

6. **Agent rules are visible, editable, and enforced.** The human's standards are not implicit prompt engineering. They are first-class, inspectable objects in the interface.

7. **The judgment classifier is the product.** Everything else — the UI, the orchestration, the streaming — is delivery mechanism. The thing that decides "mechanical or judgment call" is where trust is earned or lost.

---

## What exists today

A self-contained HTML prototype (`Agent Stream idea.html`) that demonstrates the feel of the core mechanics:

- **Live Stream mode**: Fable plans out loud (typewriter stream), specialist agents lean in and react in the Stream Chat, plan locks into a checklist with assigned owners, agents deploy in parallel with progress indicators
- **Autopilot mode**: drives mechanical turns in the user's voice, auto-pauses on a judgment call (the 429 microcopy — a product-voice decision), waits for the human's input, resumes, tallies at the end
- **Team mode**: async channel with humans and agents posting diffs, test results, reviews — with a right panel showing each agent's standing rules
- **Sidebar**: mode switching, agent roster with rules, team members

The prototype is offline, zero-dependency, runs in any browser. It is design/feel only — no real agent execution, no real LLM calls, no persistence. The "thinking" is scripted, the reactions are timed, the autopilot is hardcoded. Its purpose is to make the *experience* tangible so the idea can be evaluated viscerally, not just conceptually.

---

## Open questions

| Question | Notes |
|----------|-------|
| **Judgment classifier implementation** | The core unsolved problem. How does the system reliably distinguish mechanical approvals from genuine judgment calls? Git history + session transcript are the proposed inputs, but the classifier itself is unbuilt. |
| **Agent runtime** | Wrap existing tools (Claude Code, Codex CLI, etc.) or build custom agent execution? Wrapping is faster and commoditizes the model layer; custom is slower but more controllable. |
| **Trayce fork vs. custom messaging** | Trayce provides agent-to-agent communication primitives. Fork and extend, or build a lighter custom layer? Depends on how much of Trayce's model fits. |
| **Solo vs. team as the wedge** | Lead with single-user (individual builder, faster to prove) or multi-user (team coordination, bigger market but harder)? |
| **Coding-only vs. cross-domain** | Start with coding (strong verifier, known workflow) or target a domain with weak verifiers where supervision value is highest? |
| **Business model** | Free tier, usage-based, seat-based, or embedded in an existing tool? |
| **Context window management** | Full git history + codebase doesn't fit in context. Retrieval and compaction strategy needed — and context bloat degrades reasoning. |
| **Naming and positioning** | "Agent Stream" is descriptive but generic. Final name should convey the core value: supervised autonomy, not just "agents on a screen." |

---

## What this is not

- **Not a better chatbot.** It is a coordination and supervision layer, not a conversational interface.
- **Not AutoGPT redux.** The human stays on the loop. Autopilot is "run until you need me," not "run until done."
- **Not a Twitch clone for agents.** The livestream metaphor is the *shape* of the interface, not the *substance*. The substance is: reduce the cost of supervising agents to a glance and a sentence.
- **Not tied to one model or runtime.** The orchestrator and specialists should be model-agnostic. The value is the supervision layer, not the underlying LLM.

---

## Summary

Agent Stream started as a visual intuition — *what if watching an AI think felt like watching a livestream?* — and resolved into a specific product thesis:

> **The bottleneck in AI-assisted work is not capability. It is supervision. The interface that makes supervision cheap — ambient, glanceable, interruptible — unlocks autonomy in every domain where humans currently can't trust agents to run alone.**

The livestream shape works because it solves three problems no current agent UI handles well:
1. **Legibility** — you can see the work happening, not just the result
2. **Steerability** — you can redirect mid-stream, not just approve or reject at the end
3. **Presence** — it feels alive, which keeps you engaged enough to catch the moment that matters

Autopilot makes it practical: the system handles the 90% that's mechanical, and the human spends judgment only on the 10% that requires it. The judgment classifier — grounded in git history, codebase patterns, and live session behavior — is what makes this trustworthy rather than theatrical.

The opportunity is real and timed: as agents become more capable, supervision becomes the binding constraint, and the current interfaces (terminals, chat transcripts, diff reviews) scale poorly to fleets of parallel agents. The team that builds the supervision layer that *feels right* — simple by default, powerful underneath, trustworthy in practice — owns the human-agent interface for the next phase of the field.

---

*This document captures the idea as of July 2026. It is a snapshot of a conversation, not a spec. Build from it, argue with it, or throw it away — but don't let it get stale without updating it.*
