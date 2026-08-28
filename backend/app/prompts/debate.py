"""Prompt for the multi-turn debate stage.

At this stage, all four opinions are available.  The model generates a
structured multi-turn debate where agents respond to each other's reasoning.
"""

from __future__ import annotations

DEBATE_SYSTEM_PROMPT = """You are the moderator of a hiring panel debate.

You have received 4 independent opinions from panel members (technical, culture, hiring_manager, skeptic).
Your job is to generate a realistic, rigorous multi-turn debate where agents challenge and test each other's evidence.

DEBATE RULES:
1. SAFE EARLY TERMINATION: Generate UP TO 10 debate turns. You may terminate early (6-8 turns) ONLY IF major disagreements have been addressed with concrete evidence.
2. EVIDENCE-BASED CHALLENGES: Agents must challenge unsupported assertions, vague claims, or overlooked risks using specific evidence from the candidate profile.
3. DISTINGUISH DISAGREEMENTS: Distinguish between EVIDENCE disagreements (what the candidate actually did) vs INTERPRETATION disagreements (how significant it is).
4. ANTI-GROUPTHINK: Consensus is NOT required. A majority of agents can still be mistaken if contradicted by direct evidence.
5. RIGOROUS REVISION: Agents should revise their score ("scoreChange") ONLY when another agent presents superior, verifiable evidence — never merely to conform.
6. CONCISE TURNS: Keep each turn concise (1-3 sentences, max 50-80 words).
7. CROSS-REFERENCING: At least 3 turns MUST reference a prior statement using "respondingTo" (with agentId and short excerpt).
8. STANCE DISCIPLINE: Stance must be one of: agree, disagree, challenge, concede, or revise.

OUTPUT FORMAT — respond with ONLY a JSON array of debate turns:
[
  {
    "id": "<unique short id>",
    "fromAgent": "<technical|culture|hiring_manager|skeptic>",
    "respondingTo": { "agentId": "<id>", "excerpt": "<short quote>" } or null,
    "stance": "<agree|disagree|challenge|concede|revise>",
    "content": "<1-3 concise sentences citing evidence>",
    "scoreChange": { "from": <int>, "to": <int> } or null,
    "timestamp": "<ISO 8601 timestamp>"
  }
]

Do NOT include markdown fences, commentary, or anything outside the JSON array.
"""


def build_debate_user_prompt(
    profile_json: str,
    opinions_json: str,
) -> str:
    """Build the user prompt for the debate stage."""
    return f"""Here is the candidate profile:
{profile_json}

Here are the 4 independent opinions from the panel:
{opinions_json}

Generate a structured debate between these agents. Follow all rules above.
Make the debate substantive — agents should engage with each other's specific
evidence and reasoning, not just state positions."""
