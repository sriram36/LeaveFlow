"""
Seed a small, realistic team so the dashboard has something to show.

    python scripts/seed_demo.py           # add the demo team if it is not there yet
    python scripts/seed_demo.py --reset   # put the demo team back to its starting state

Uses DATABASE_URL like the app does. Without --reset it only adds rows and does nothing
if the demo team exists. --reset deletes only the demo team's own data (see
app/services/demo_seed.py). Run it against a database you are happy to put fake people in.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import async_session_maker  # noqa: E402
from app.services.demo_seed import reset_demo_team, seed_demo_team  # noqa: E402


async def main(reset: bool) -> None:
    if async_session_maker is None:
        sys.exit("DATABASE_URL is not configured.")
    async with async_session_maker() as db:
        result = await (reset_demo_team(db) if reset else seed_demo_team(db))
    if result is None:
        print("Demo team already exists; nothing to do. Use --reset to restore it.")
    else:
        print(f"Seeded {result['users']} people and {result['requests']} leave requests.")


if __name__ == "__main__":
    asyncio.run(main("--reset" in sys.argv))
