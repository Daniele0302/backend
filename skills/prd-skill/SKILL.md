---
name: prd-skill
description: Create product requirements documents (PRDs) for applications and digital products. Use when asked to draft, outline, or refine a PRD, including problem framing, goals, scope, requirements, user stories, metrics, risks, and rollout plans.
---

# PRD Skill

## Overview
Create a clear, structured PRD in English using a standard template. Ask focused questions when inputs are missing and mark assumptions explicitly.

## Workflow

### 1. Intake
- Ask for the minimum missing info: target users, problem statement, goals, platform, constraints, timeline, stakeholders, and success metrics.
- If the user prefers a specific template, follow it. Otherwise use the standard template in `references/prd-template.md`.
- If details are missing and the user wants you to proceed, list assumptions and open questions.

### 2. Draft
- Produce a complete PRD in Markdown.
- Use requirement IDs (e.g., `FR-1`, `NFR-1`) with acceptance criteria.
- Separate MVP scope from future enhancements.
- Keep language concise and unambiguous.

### 3. Quality Pass
- Ensure goals align with requirements and success metrics.
- Include risks and mitigations.
- Highlight dependencies and integrations.
- End with open questions if any remain.

## Output Rules
- Default output is a single Markdown PRD.
- Include a short executive summary (2-4 sentences) near the top.
- Use tables for requirements and non-functional requirements.
- Use English even if the user writes in another language (unless they explicitly request otherwise).

## Resource
- `references/prd-template.md`: Standard PRD structure to follow when no custom template is provided.
