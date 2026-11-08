"""
Seed a small, realistic team so the dashboard has something to show.

    python scripts/seed_demo.py

Uses DATABASE_URL like the app does. Safe to re-run: it does nothing if the demo team
already exists. It only adds rows; it never deletes or changes existing ones.
Run it against a database you are happy to put fake people in.
"""
import asyncio
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select  # noqa: E402

from app.database import async_session_maker  # noqa: E402
from app.models import (  # noqa: E402
    AccountStatus, AuditLog, Holiday, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType,
    DurationType, User, UserRole,
)

MANAGER = ("Meera Nair", "+919000000001")
HR = ("Karan Mehta", "+919000000002")
WORKERS = [
    ("Asha Rao", "+919000000011"),
    ("Rahul Kumar", "+919000000012"),
    ("Priya Sharma", "+919000000013"),
    ("Arjun Nair", "+919000000014"),
    ("Neha Reddy", "+919000000015"),
    ("Vikram Singh", "+919000000016"),
    ("Anita Desai", "+919000000017"),
]

# (worker index, leave type, start offset in days, length in days, status, reason)
REQUESTS = [
    (0, LeaveType.sick, 1, 1, LeaveStatus.pending, "Fever"),
    (1, LeaveType.casual, 6, 3, LeaveStatus.pending, "Family function"),
    (2, LeaveType.casual, 9, 2, LeaveStatus.pending, "Travel"),
    (3, LeaveType.special, 14, 1, LeaveStatus.pending, "Moving house"),
    (4, LeaveType.casual, 3, 2, LeaveStatus.approved, "Wedding"),
    (5, LeaveType.sick, 0, 1, LeaveStatus.approved, "Doctor appointment"),
    (6, LeaveType.casual, 11, 4, LeaveStatus.approved, "Holiday"),
    (1, LeaveType.sick, -12, 2, LeaveStatus.approved, "Flu"),
    (2, LeaveType.casual, -20, 1, LeaveStatus.approved, "Personal errand"),
    (3, LeaveType.casual, -6, 1, LeaveStatus.rejected, "Short notice during release"),
    (0, LeaveType.casual, -30, 2, LeaveStatus.rejected, "Overlaps with a deadline"),
    (6, LeaveType.sick, -3, 1, LeaveStatus.cancelled, "Felt better"),
]


def weekdays_from(start: date, length: int) -> tuple[date, date, float]:
    """Start on the first weekday on/after `start`; span `length` working days."""
    d = start
    while d.weekday() >= 5:
        d += timedelta(days=1)
    first, days_counted, last = d, 0, d
    while days_counted < length:
        if d.weekday() < 5:
            days_counted += 1
            last = d
        d += timedelta(days=1)
    return first, last, float(length)


async def main() -> None:
    if async_session_maker is None:
        sys.exit("DATABASE_URL is not configured.")

    async with async_session_maker() as db:
        if await db.scalar(select(User).where(User.phone == MANAGER[1])):
            print("Demo team already exists; nothing to do.")
            return

        manager = User(name=MANAGER[0], phone=MANAGER[1], role=UserRole.manager,
                       account_status=AccountStatus.active)
        hr = User(name=HR[0], phone=HR[1], role=UserRole.hr, account_status=AccountStatus.active)
        db.add_all([manager, hr])
        await db.flush()

        workers = [
            User(name=n, phone=p, role=UserRole.worker, manager_id=manager.id,
                 account_status=AccountStatus.active)
            for n, p in WORKERS
        ]
        db.add_all(workers)
        await db.flush()

        # Requests and the balance they hold (pending/approved requests keep days reserved).
        used = {w.id: {"casual": 0.0, "sick": 0.0, "special": 0.0} for w in workers}
        today = date.today()
        for idx, leave_type, offset, length, status, reason in REQUESTS:
            worker = workers[idx]
            start, end, days = weekdays_from(today + timedelta(days=offset), length)
            request = LeaveRequest(
                user_id=worker.id, start_date=start, end_date=end, days=days,
                leave_type=leave_type, duration_type=DurationType.full, reason=reason, status=status,
            )
            if status in (LeaveStatus.approved, LeaveStatus.rejected):
                request.approved_by = manager.id
                if status == LeaveStatus.rejected:
                    request.rejection_reason = reason
            db.add(request)
            await db.flush()

            db.add(AuditLog(leave_request_id=request.id, action="created", actor_id=worker.id))
            if status == LeaveStatus.approved:
                db.add(AuditLog(leave_request_id=request.id, action="approved", actor_id=manager.id))
            elif status == LeaveStatus.rejected:
                db.add(AuditLog(leave_request_id=request.id, action="rejected", actor_id=manager.id, details=reason))
            elif status == LeaveStatus.cancelled:
                db.add(AuditLog(leave_request_id=request.id, action="cancelled", actor_id=worker.id))

            if status in (LeaveStatus.pending, LeaveStatus.approved):
                used[worker.id][leave_type.value] += days

        for w in workers:
            u = used[w.id]
            casual, sick, special = 12.0 - u["casual"], 12.0 - u["sick"], 5.0 - u["special"]
            w.casual_leave_balance, w.sick_leave_balance, w.special_leave_balance = casual, sick, special
            db.add(LeaveBalance(user_id=w.id, year=today.year, casual=casual, sick=sick, special=special))

        year = today.year
        for d, name in [(date(year, 1, 26), "Republic Day"), (date(year, 8, 15), "Independence Day"),
                        (date(year, 10, 2), "Gandhi Jayanti"), (date(year, 12, 25), "Christmas Day")]:
            if not await db.scalar(select(Holiday).where(Holiday.date == d)):
                db.add(Holiday(date=d, name=name))

        await db.commit()
        print(f"Seeded 1 manager, 1 HR user, {len(workers)} workers and {len(REQUESTS)} leave requests.")


if __name__ == "__main__":
    asyncio.run(main())
