import asyncio
import time
from app.services.profile_builder import build_candidate_profile
from app.services.independent_review import run_independent_reviews
from app.services.debate import run_debate
from app.services.synthesis import synthesize_decision
import os

os.environ["LLM_PROVIDER"] = "openrouter"
os.environ["LLM_MODEL"] = "nvidia/nemotron-3-ultra-550b-a55b:free"
# Assuming key is in .env

async def main():
    start = time.time()
    profile = await build_candidate_profile("Senior Dev", "Resume of Senior Dev", "Transcript here")
    print(f"Profile: {time.time() - start:.2f}s")
    
    start2 = time.time()
    opinions, _ = await run_independent_reviews(profile)
    print(f"Reviews: {time.time() - start2:.2f}s")
    
    start3 = time.time()
    turns, _ = await run_debate(profile, opinions)
    print(f"Debate: {time.time() - start3:.2f}s")
    
    start4 = time.time()
    synthesis, _ = await synthesize_decision(profile, opinions, turns)
    print(f"Synthesis: {time.time() - start4:.2f}s")
    
    print(f"Total: {time.time() - start:.2f}s")

asyncio.run(main())
