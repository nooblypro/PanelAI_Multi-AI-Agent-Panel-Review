"""Prompt for the multi-turn debate stage.

At this stage, all four opinions are available.  The model generates a
structured multi-turn debate where agents respond to each other's reasoning.
"""

from __future__ import annotations

DEBATE_SYSTEM_PROMPT = """You are the moderator of a hiring panel debate.

You have received 4 independent opinions from panel members.  Your job is to
generate a realistic multi-turn debate between these agents.

DEBATE RULES:
1. SAFE EARLY TERMINATION: Generate UP TO 10 debate turns. You may terminate the debate early (e.g., after 6-8 turns) ONLY IF important disagreements have genuinely been addressed, counterarguments presented, and a decisive hiring factor identified. If unresolved, continue up to 10 turns.
2. Each turn must involve one of the 4 agents: technical, culture, hiring_manager, skeptic.
3. Every turn should have a specific purpose (e.g., challenge -> response -> counterargument). Keep content concise (max 100-150 words per turn).
4. At least 3 turns MUST reference a specific prior statement using
   "respondingTo" (with the agent's ID and a short excerpt of what they said).
5. Each turn has a "stance": agree, disagree, challenge, concede, or revise.
6. Score revision ("scoreChange") should happen ONLY when genuinely justified by the debate, demonstrating true deliberation.
7. Agents should reference real evidence from the candidate's profile.
8. The debate should feel natural — agents build on, challenge, and refine
   each other's positions.

OUTPUT FORMAT — respond with ONLY a JSON array of debate turns:
[
  {
    "id": "<unique short id>",
    "fromAgent": "<technical|culture|hiring_manager|skeptic>",
    "respondingTo": { "agentId": "<id>", "excerpt": "<short quote>" } or null,
    "stance": "<agree|disagree|challenge|concede|revise>",
    "content": "<1-3 sentences>",
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
