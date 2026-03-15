---
name: aiready-advanced-grounding
description: Expert skill for improving AI agent grounding and context accuracy. Helps agents understand complex codebase boundaries, resolve semantic ambiguity, and maintain high-fidelity context windows.
license: MIT
triggers:
  files:
    - 'aiready.json'
    - '.aireadyignore'
    - '**/package.json'
    - 'README.md'
  keywords:
    - 'technical debt'
    - 'refactor'
    - 'ambiguous'
    - 'context window'
    - 'grounding'
metadata:
  author: aiready
  version: '0.1.0'
---

# AIReady Advanced Grounding

This skill provides advanced procedural knowledge for AI agents to improve their "grounding"—the ability to accurately relate their internal knowledge to the specific context of your codebase.

## When to Use

- When an agent seems "lost" or provides hallucinations about code structure.
- During large-scale refactorings where context boundaries are shifting.
- When preparing a repository for onboarding new AI-driven workflows.

## Core Capabilities

1.  **Context Boundary Analysis:** Identifying which files are essential for understanding a specific logic flow.
2.  **Semantic Gap Detection:** Finding where naming or documentation fails to explain intent to an AI.
3.  **Ambiguity Resolution:** Strategies for rewriting code to be "AI-obvious" without sacrificing human readability.

## Usage for Agents

Full grounding rules and workflows are integrated into this skill package.

### Quick Audit (via npx)

- **Grounding Scan:** `npx @aiready/cli scan --tools grounding .`
- **Context Analysis:** `npx @aiready/cli scan --tools context .`
