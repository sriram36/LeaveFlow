"""
Demo team: seed it, or put it back to its starting state.

The demo team is a fixed set of fake people (identified by their reserved phone numbers).
Reset only ever deletes data that belongs to those people, never anyone else's.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import delete, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AccountCreationRequest, AccountStatus, Attachment, AuditLog, ConversationHistory,
    DurationType, Holiday, LeaveBalance, LeaveBalanceHistory, LeaveRequest, LeaveStatus,
    LeaveType, User, UserRole,
)

DEMO_EMAIL = "demo@leaveflow.com"

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
DEMO_PHONES = [MANAGER[1], HR[1], *[p for _, p in WORKERS]]

# (worker index, leave type, start offset in days, length in working days, status, reason)
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

_ADVISORY_LOCK_KEY = 727001


def _working_span(start: date, length: int) -> tuple[date, date]:
    """First weekday on/after `start`, spanning `length` working days."""
    d = start
    while d.weekday() >= 5:
        d += timedelta(days=1)
    first, counted, last = d, 0, d
    while counted < length:
        if d.weekday() < 5:
            counted += 1
            last = d
        d += timedelta(days=1)
    return first, last


async def seed_demo_team(db: AsyncSession) -> Optional[dict]:
    """Create the demo team. Returns counts, or None if it already exists. Commits."""
    if await db.scalar(select(User.id).where(User.phone == MANAGER[1])):
        return None

    now = datetime.now(timezone.utc)
    today = date.today()

    manager = User(name=MANAGER[0], phone=MANAGER[1], role=UserRole.manager, account_status=AccountStatus.active)
    hr = User(name=HR[0], phone=HR[1], role=UserRole.hr, account_status=AccountStatus.active)
    db.add_all([manager, hr])
    await db.flush()

    workers = [
        User(name=n, phone=p, role=UserRole.worker, manager_id=manager.id, account_status=AccountStatus.active)
        for n, p in WORKERS
    ]
    db.add_all(workers)
    await db.flush()

    # Pending and approved requests keep their days reserved, so the balances reflect that.
    reserved = {w.id: {"casual": 0.0, "sick": 0.0, "special": 0.0} for w in workers}
    for idx, leave_type, offset, length, status, reason in REQUESTS:
        worker = workers[idx]
        start, end = _working_span(today + timedelta(days=offset), length)
        # Past requests were made before they started; upcoming ones were made recently.
        created = now - timedelta(days=max(2, -offset + 2)) if offset < 0 else now - timedelta(hours=3 + idx * 5)
        request = LeaveRequest(
            user_id=worker.id, start_date=start, end_date=end, days=float(length),
            leave_type=leave_type, duration_type=DurationType.full, reason=reason, status=status,
            created_at=created,
        )
        if status in (LeaveStatus.approved, LeaveStatus.rejected):
            request.approved_by = manager.id
            request.approved_at = now - timedelta(minutes=20) if (status == LeaveStatus.approved and offset == 0) \
                else created + timedelta(hours=6)
        if status == LeaveStatus.rejected:
            request.rejection_reason = reason
        db.add(request)
        await db.flush()

        db.add(AuditLog(leave_request_id=request.id, action="created", actor_id=worker.id, created_at=created))
        if status == LeaveStatus.approved:
            db.add(AuditLog(leave_request_id=request.id, action="approved", actor_id=manager.id, created_at=request.approved_at))
        elif status == LeaveStatus.rejected:
            db.add(AuditLog(leave_request_id=request.id, action="rejected", actor_id=manager.id,
                            details=reason, created_at=request.approved_at))
        elif status == LeaveStatus.cancelled:
            db.add(AuditLog(leave_request_id=request.id, action="cancelled", actor_id=worker.id,
                            created_at=created + timedelta(hours=2)))

        if status in (LeaveStatus.pending, LeaveStatus.approved):
            reserved[worker.id][leave_type.value] += float(length)

    for w in workers:
        used = reserved[w.id]
        casual, sick, special = 12.0 - used["casual"], 12.0 - used["sick"], 5.0 - used["special"]
        w.casual_leave_balance, w.sick_leave_balance, w.special_leave_balance = casual, sick, special
        db.add(LeaveBalance(user_id=w.id, year=today.year, casual=casual, sick=sick, special=special))

    year = today.year
    for d, name in [(date(year, 1, 26), "Republic Day"), (date(year, 8, 15), "Independence Day"),
                    (date(year, 10, 2), "Gandhi Jayanti"), (date(year, 12, 25), "Christmas Day")]:
        if not await db.scalar(select(Holiday.id).where(Holiday.date == d)):
            db.add(Holiday(date=d, name=name))

    await db.commit()
    return {"users": len(workers) + 2, "requests": len(REQUESTS)}


async def reset_demo_team(db: AsyncSession) -> dict:
    """Delete everything that belongs to the demo team, then seed it again. Commits.

    Other people's data is never deleted. Anything of theirs that points at a demo person
    (a manager link, an approver, an audit actor) is detached instead.
    """
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        # Serialize concurrent resets so two clicks cannot both seed.
        await db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": _ADVISORY_LOCK_KEY})

    ids = list((await db.scalars(select(User.id).where(User.phone.in_(DEMO_PHONES)))).all())
    if ids:
        request_ids = select(LeaveRequest.id).where(LeaveRequest.user_id.in_(ids))

        await db.execute(delete(Attachment).where(Attachment.leave_request_id.in_(request_ids)))
        await db.execute(delete(AuditLog).where(AuditLog.leave_request_id.in_(request_ids)))
        await db.execute(delete(LeaveBalanceHistory).where(
            or_(LeaveBalanceHistory.user_id.in_(ids), LeaveBalanceHistory.leave_request_id.in_(request_ids))))
        await db.execute(delete(ConversationHistory).where(ConversationHistory.user_id.in_(ids)))
        await db.execute(delete(AccountCreationRequest).where(or_(
            AccountCreationRequest.requested_by.in_(ids), AccountCreationRequest.manager_id.in_(ids),
            AccountCreationRequest.approved_by.in_(ids))))

        # Detach anything outside the demo team that points at a demo person.
        await db.execute(update(AuditLog).where(AuditLog.actor_id.in_(ids)).values(actor_id=None))
        await db.execute(update(LeaveRequest).where(LeaveRequest.approved_by.in_(ids)).values(approved_by=None))
        await db.execute(update(User).where(User.manager_id.in_(ids), User.id.not_in(ids)).values(manager_id=None))
        await db.execute(update(User).where(User.approved_by.in_(ids), User.id.not_in(ids)).values(approved_by=None))

        await db.execute(delete(LeaveRequest).where(LeaveRequest.user_id.in_(ids)))
        await db.execute(delete(LeaveBalance).where(LeaveBalance.user_id.in_(ids)))
        # The manager and HR user are referenced by the workers, so remove the workers first.
        await db.execute(update(User).where(User.id.in_(ids)).values(manager_id=None, approved_by=None))
        await db.execute(delete(User).where(User.id.in_(ids)))
        await db.flush()

    result = await seed_demo_team(db)
    return result or {"users": 0, "requests": 0}
