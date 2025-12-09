"""
Leave Service

Core business logic for leave operations.
"""

from datetime import date, datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.models import (
    User, LeaveRequest, LeaveBalance, AuditLog, Attachment,
    LeaveStatus, LeaveType, DurationType, UserRole
)
from app.services.validator import LeaveValidator, LeaveValidationError, deduct_balance, refund_balance
from app.services.whatsapp import (
    whatsapp, format_leave_request_notification, format_leave_confirmation,
    format_approval_notification, format_rejection_notification,
    format_cancellation_confirmation, format_balance_message, format_status_message
)


class LeaveService:
    """Service for managing leave requests."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.validator = LeaveValidator(db)
    
    async def create_leave_request(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        leave_type: str,
        reason: Optional[str] = None,
        is_half_day: bool = False,
        half_day_period: Optional[str] = None
    ) -> LeaveRequest:
        """Create a new leave request."""
        # Convert string type to enum
        l_type = LeaveType(leave_type) if isinstance(leave_type, str) else leave_type
        
        # Determine duration type
        if is_half_day:
            duration = DurationType.half_morning if half_day_period == "morning" else DurationType.half_afternoon
        else:
            duration = DurationType.full
        
        # Validate the request
        is_valid, days, warning = await self.validator.validate_leave_request(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            leave_type=l_type,
            is_half_day=is_half_day
        )
        
        # Create the request
        leave_request = LeaveRequest(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            days=days,
            leave_type=l_type,
            duration_type=duration,
            reason=reason,
            status=LeaveStatus.pending
        )
        
        self.db.add(leave_request)
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Log the action
        await self._log_action(leave_request.id, "created", user_id)
        
        # Get user and manager info for notifications
        user = await self._get_user(user_id)
        
        # Notify manager
        if user and user.manager_id:
            manager = await self._get_user(user.manager_id)
            if manager:
                await whatsapp.send_text(
                    manager.phone,
                    format_leave_request_notification(
                        request_id=leave_request.id,
                        employee_name=user.name,
                        start_date=str(start_date),
                        end_date=str(end_date),
                        days=days,
                        leave_type=leave_type,
                        reason=reason
                    )
                )
        
        # Confirm to employee
        if user:
            await whatsapp.send_text(
                user.phone,
                format_leave_confirmation(
                    request_id=leave_request.id,
                    start_date=str(start_date),
                    end_date=str(end_date),
                    days=days,
                    leave_type=leave_type,
                    warning=warning
                )
            )
        
        return leave_request
    
    async def approve_leave(
        self,
        request_id: int,
        approver_id: int
    ) -> LeaveRequest:
        """Approve a leave request."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.status != LeaveStatus.pending:
            raise LeaveValidationError(f"Request is already {leave_request.status.value}", "ALREADY_PROCESSED")
        
        # Update status
        leave_request.status = LeaveStatus.approved
        leave_request.approved_by = approver_id
        leave_request.approved_at = datetime.utcnow()
        
        # Deduct balance
        await deduct_balance(
            self.db,
            leave_request.user_id,
            leave_request.leave_type,
            leave_request.days
        )
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Log the action
        await self._log_action(request_id, "approved", approver_id)
        
        # Notify employee
        user = await self._get_user(leave_request.user_id)
        approver = await self._get_user(approver_id)
        
        if user:
            await whatsapp.send_text(
                user.phone,
                format_approval_notification(request_id, approver.name if approver else "Manager")
            )
        
        return leave_request
    
    async def reject_leave(
        self,
        request_id: int,
        approver_id: int,
        reason: Optional[str] = None
    ) -> LeaveRequest:
        """Reject a leave request."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.status != LeaveStatus.pending:
            raise LeaveValidationError(f"Request is already {leave_request.status.value}", "ALREADY_PROCESSED")
        
        # Update status
        leave_request.status = LeaveStatus.rejected
        leave_request.approved_by = approver_id
        leave_request.approved_at = datetime.utcnow()
        leave_request.rejection_reason = reason
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Log the action
        await self._log_action(request_id, "rejected", approver_id, reason)
        
        # Notify employee
        user = await self._get_user(leave_request.user_id)
        approver = await self._get_user(approver_id)
        
        if user:
            await whatsapp.send_text(
                user.phone,
                format_rejection_notification(request_id, approver.name if approver else "Manager", reason)
            )
        
        return leave_request
    
    async def cancel_leave(
        self,
        request_id: int,
        user_id: int
    ) -> LeaveRequest:
        """Cancel a leave request (by employee)."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.user_id != user_id:
            raise LeaveValidationError("You can only cancel your own requests", "FORBIDDEN")
        
        if leave_request.status not in [LeaveStatus.pending, LeaveStatus.approved]:
            raise LeaveValidationError(f"Cannot cancel a {leave_request.status.value} request", "INVALID_STATUS")
        
        # If approved, refund balance
        if leave_request.status == LeaveStatus.approved:
            await refund_balance(
                self.db,
                leave_request.user_id,
                leave_request.leave_type,
                leave_request.days
            )
        
        # Update status
        leave_request.status = LeaveStatus.cancelled
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Log the action
        await self._log_action(request_id, "cancelled", user_id)
        
        # Notify employee
        user = await self._get_user(user_id)
        if user:
            await whatsapp.send_text(user.phone, format_cancellation_confirmation(request_id))
        
        return leave_request
    
    async def get_balance(self, user_id: int) -> Dict[str, float]:
        """Get user's leave balance."""
        result = await self.db.execute(
            select(LeaveBalance).where(LeaveBalance.user_id == user_id)
        )
        balance = result.scalar_one_or_none()
        
        if not balance:
            # Create default balance
            balance = LeaveBalance(
                user_id=user_id,
                year=date.today().year,
                casual=12.0,
                sick=12.0,
                special=5.0
            )
            self.db.add(balance)
            await self.db.commit()
            await self.db.refresh(balance)
        
        return {
            "casual": balance.casual,
            "sick": balance.sick,
            "special": balance.special
        }
    
    async def get_status(self, request_id: int) -> Optional[LeaveRequest]:
        """Get leave request status."""
        return await self._get_leave_request(request_id)
    
    async def get_pending_requests(self, manager_id: Optional[int] = None) -> List[LeaveRequest]:
        """Get pending leave requests."""
        query = select(LeaveRequest).options(
            selectinload(LeaveRequest.user)
        ).where(
            LeaveRequest.status == LeaveStatus.pending
        ).order_by(LeaveRequest.created_at.desc())
        
        if manager_id:
            # Get requests from team members
            query = query.join(User, LeaveRequest.user_id == User.id).where(
                User.manager_id == manager_id
            )
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_today_leaves(self) -> List[Dict[str, Any]]:
        """Get employees on leave today."""
        today = date.today()
        
        result = await self.db.execute(
            select(LeaveRequest).options(
                selectinload(LeaveRequest.user)
            ).where(
                and_(
                    LeaveRequest.status == LeaveStatus.approved,
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today
                )
            )
        )
        
        requests = result.scalars().all()
        return [
            {
                "id": r.id,
                "name": r.user.name if r.user else "Unknown",
                "type": r.leave_type.value,
                "start_date": str(r.start_date),
                "end_date": str(r.end_date)
            }
            for r in requests
        ]
    
    async def get_history(
        self,
        user_id: Optional[int] = None,
        status: Optional[LeaveStatus] = None,
        limit: int = 100
    ) -> List[LeaveRequest]:
        """Get leave request history."""
        query = select(LeaveRequest).options(
            selectinload(LeaveRequest.user),
            selectinload(LeaveRequest.attachments)
        ).order_by(LeaveRequest.created_at.desc()).limit(limit)
        
        if user_id:
            query = query.where(LeaveRequest.user_id == user_id)
        
        if status:
            query = query.where(LeaveRequest.status == status)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def _get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_leave_request(self, request_id: int) -> Optional[LeaveRequest]:
        """Get leave request by ID."""
        result = await self.db.execute(
            select(LeaveRequest).options(
                selectinload(LeaveRequest.user),
                selectinload(LeaveRequest.attachments)
            ).where(LeaveRequest.id == request_id)
        )
        return result.scalar_one_or_none()
    
    async def _log_action(
        self,
        request_id: int,
        action: str,
        actor_id: int,
        details: Optional[str] = None
    ):
        """Log an action to audit log."""
        log = AuditLog(
            leave_request_id=request_id,
            action=action,
            actor_id=actor_id,
            details=details
        )
        self.db.add(log)
        await self.db.commit()
