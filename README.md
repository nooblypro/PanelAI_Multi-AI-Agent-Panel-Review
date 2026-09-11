# PanelAI — Multi-Agent Deliberative Hiring Committee

> An evidence-grounded multi-agent hiring committee that independently evaluates candidates, cross-examines findings through structured debate, and produces an auditable hiring verdict.

🔗 **Live Demo:** [https://promptwars-tau-lac.vercel.app/](https://promptwars-tau-lac.vercel.app/)

---

## 📌 Overview

PanelAI replaces traditional single-prompt AI resume screening with a multi-agent deliberative workflow. By extracting verifiable evidence quotes from raw candidate documents, executing four isolated evaluator personas in parallel, and conducting a structured cross-examination debate, PanelAI eliminates hallucinations and sycophancy to produce transparent, mathematically consistent hiring decisions.

---

## 🏗️ 5-Stage Deliberation Pipeline

```
┌─────────────────────────┐
│ 1. Document Intake      │  PDF / DOCX / TXT Parsing & Text Precedence
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 2. Fact-Base Profile    │  Zero-Hallucination Extraction with Evidence Quotes
└────────────┬────────────┘
             ▼
┌─────────────────────────┐  4 Isolated Evaluators (Parallel asyncio)
│ 3. Independent Review   │  • Technical  • HR/Culture  • Hiring Manager  • Skeptic
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 4. Debate Arena         │  Multi-Turn Cross-Examination (Challenge ⇄ Defend ⇄ Revise)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ 5. Mathematical Synthesis│ 5-Criteria Weighted Scoring Rubric & Verdict
└─────────────────────────┘
```

---

## 👥 Evaluator Personas

- **Technical Evaluator:** Systems architecture, CS fundamentals, algorithmic depth, & code quality.
- **HR & Culture Evaluator:** Communication, collaboration evidence, & professional maturity.
- **Hiring Manager:** Role alignment, delivery track record, & operational readiness.
- **Skeptic / Auditor:** Adversarial auditor that stress-tests claims & catches resume contradictions.

---

## 📊 Evaluation Rubric

| Criterion | Weight | Focus |
|---|:---:|---|
| **Technical Ability** | 30% | Architecture, algorithms, & code quality |
| **Agentic AI / LLM Experience** | 30% | Tool-calling, multi-agent workflows |
| **Production Engineering** | 20% | Scalability, SLAs, & outage remediation |
| **Problem Solving** | 10% | Root-cause breakdown & trade-offs |
| **Communication & Collaboration** | 10% | Cross-functional alignment |
