"""
WhatsApp Webhook Routes

Handles incoming WhatsApp messages and webhook verification.
"""

from fastapi import APIRouter, Request, Response, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import json

from app.database import get_db
from app.config import get_settings
from app.models import User, ProcessedMessage, LeaveType, UserRole
from app.services.parser import parse_message, CommandType
from app.services.leave import LeaveService
from app.services.validator import LeaveValidationError
from app.services.whatsapp import (
    whatsapp, format_balance_message, format_status_message,
    format_pending_list
)
from app.auth import get_user_by_phone

settings = get_settings()
router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])


@router.get("/whatsapp")
async def verify_webhook(request: Request):
    """Verify webhook for WhatsApp Cloud API."""
    params = request.query_params
    
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return Response(content=challenge, media_type="text/plain")
    
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def handle_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle incoming WhatsApp messages."""
    try:
        body = await request.json()
    except:
        return {"status": "ok"}
    
    # Extract message data
    entry = body.get("entry", [{}])[0]
    changes = entry.get("changes", [{}])[0]
    value = changes.get("value", {})
    messages = value.get("messages", [])
    statuses = value.get("statuses", [])
    
    # Handle message status updates (delivery, read)
    if statuses:
        for status in statuses:
            status_type = status.get("status")
            if status_type == "read":
                print(f"[WhatsApp] Message {status.get('id')} marked as read")
        return {"status": "ok"}
    
    if not messages:
        return {"status": "ok"}
    
    message = messages[0]
    message_id = message.get("id")
    from_phone = message.get("from")
    message_type = message.get("type")
    
    # Idempotency check
    if message_id:
        existing = await db.execute(
            select(ProcessedMessage).where(ProcessedMessage.message_id == message_id)
        )
        if existing.scalar_one_or_none():
            return {"status": "ok", "note": "already processed"}
        
        # Mark as processed
        db.add(ProcessedMessage(message_id=message_id))
        await db.commit()
    
    # Send read receipt immediately
    if message_id:
        await whatsapp.send_read_receipt(message_id)
    
    # Get or create user
    user = await get_user_by_phone(db, from_phone)
    
    if not user:
        # Auto-register new users as workers
        user = User(
            name=f"User {from_phone[-4:]}",
            phone=from_phone,
            role=UserRole.worker
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        await whatsapp.send_text(
            from_phone,
            "👋 Welcome to LeaveFlow! You've been registered.\n\n"
            "Commands:\n"
            "• `leave <date> <type> <reason>` - Apply for leave\n"
            "• `balance` - Check leave balance\n"
            "• `status <id>` - Check request status\n"
            "• `cancel <id>` - Cancel a request"
        )
        return {"status": "ok"}
    
    # Handle text messages
    if message_type == "text":
        # Show typing indicator
        await whatsapp.send_typing_indicator(from_phone)
        
        text = message.get("text", {}).get("body", "")
        await process_text_message(db, user, text)
    
    # Handle interactive responses (button clicks)
    elif message_type == "interactive":
        await whatsapp.send_typing_indicator(from_phone)
        
        interactive = message.get("interactive", {})
        button_reply = interactive.get("button_reply", {})
        button_id = button_reply.get("id", "")
        await process_text_message(db, user, button_id)
    
    # Handle image/document uploads
    elif message_type in ["image", "document", "video", "audio"]:
        await whatsapp.send_typing_indicator(from_phone)
        await handle_media_message(db, user, message, message_type)
    
    return {"status": "ok"}


async def process_text_message(db: AsyncSession, user: User, text: str):
    """Process a text message from a user."""
    parsed = parse_message(text)
    service = LeaveService(db)
    
    try:
        if parsed.command_type == CommandType.LEAVE:
            await handle_leave_command(service, user, parsed)
        
        elif parsed.command_type == CommandType.HALF_LEAVE:
            await handle_leave_command(service, user, parsed)
        
        elif parsed.command_type == CommandType.BALANCE:
            await handle_balance_command(service, user)
        
        elif parsed.command_type == CommandType.STATUS:
            await handle_status_command(service, user, parsed.request_id)
        
        elif parsed.command_type == CommandType.CANCEL:
            await handle_cancel_command(service, user, parsed.request_id)
        
        elif parsed.command_type == CommandType.APPROVE:
            await handle_approve_command(service, user, parsed.request_id)
        
        elif parsed.command_type == CommandType.REJECT:
            await handle_reject_command(service, user, parsed.request_id, parsed.reason)
        
        elif parsed.command_type == CommandType.PENDING:
            await handle_pending_command(service, user)
        
        elif parsed.command_type == CommandType.TEAM_TODAY:
            await handle_team_today_command(service, user)
        
        else:
            await whatsapp.send_text(
                user.phone,
                "❓ I didn't understand that. Try:\n\n"
                "• `leave 12 Feb sick fever`\n"
                "• `balance`\n"
                "• `status 32`\n"
                "• `cancel 32`"
            )
    
    except LeaveValidationError as e:
        await whatsapp.send_text(user.phone, f"❌ {e.message}")
    
    except Exception as e:
        import traceback
        print(f"Error processing message: {e}")
        print(traceback.format_exc())
        await whatsapp.send_text(
            user.phone,
            "❌ Something went wrong. Please try again."
        )


async def handle_leave_command(service: LeaveService, user: User, parsed):
    """Handle leave application command."""
    if parsed.error:
        await whatsapp.send_text(user.phone, f"❌ {parsed.error}")
        return
    
    await service.create_leave_request(
        user_id=user.id,
        start_date=parsed.start_date,
        end_date=parsed.end_date,
        leave_type=parsed.leave_type or "casual",
        reason=parsed.reason,
        is_half_day=parsed.is_half_day,
        half_day_period=parsed.half_day_period
    )


async def handle_balance_command(service: LeaveService, user: User):
    """Handle balance check command."""
    balance = await service.get_balance(user.id)
    await whatsapp.send_text(
        user.phone,
        format_balance_message(balance["casual"], balance["sick"], balance["special"])
    )


async def handle_status_command(service: LeaveService, user: User, request_id: Optional[int]):
    """Handle status check command."""
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `status 32`")
        return
    
    request = await service.get_status(request_id)
    
    if not request:
        await whatsapp.send_text(user.phone, f"❌ Request #{request_id} not found")
        return
    
    if request.user_id != user.id and user.role == UserRole.worker:
        await whatsapp.send_text(user.phone, "❌ You can only check your own requests")
        return
    
    await whatsapp.send_text(
        user.phone,
        format_status_message(
            request_id=request.id,
            status=request.status.value,
            start_date=str(request.start_date),
            end_date=str(request.end_date),
            leave_type=request.leave_type.value,
            reason=request.reason
        )
    )


async def handle_cancel_command(service: LeaveService, user: User, request_id: Optional[int]):
    """Handle cancel command."""
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `cancel 32`")
        return
    
    await service.cancel_leave(request_id, user.id)


async def handle_approve_command(service: LeaveService, user: User, request_id: Optional[int]):
    """Handle approve command (managers only)."""
    # Verify user is a manager, HR, or admin
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        await whatsapp.send_text(
            user.phone, 
            "❌ Access Denied\n\n"
            f"You are registered as {user.role.value}, but only Managers, HR, and Admins can approve leave requests.\n\n"
            "Contact your HR department if you believe this is incorrect."
        )
        return
    
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `approve 32`")
        return
    
    request = await service.approve_leave(request_id, user.id)
    await whatsapp.send_text(user.phone, f"✅ Leave #{request_id} approved by {user.name}!")


async def handle_reject_command(service: LeaveService, user: User, request_id: Optional[int], reason: Optional[str]):
    """Handle reject command (managers only)."""
    # Verify user is a manager, HR, or admin
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        await whatsapp.send_text(
            user.phone, 
            "❌ Access Denied\n\n"
            f"You are registered as {user.role.value}, but only Managers, HR, and Admins can reject leave requests.\n\n"
            "Contact your HR department if you believe this is incorrect."
        )
        return
    
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `reject 32 reason`")
        return
    
    request = await service.reject_leave(request_id, user.id, reason)
    await whatsapp.send_text(user.phone, f"❌ Leave #{request_id} rejected by {user.name}")


async def handle_pending_command(service: LeaveService, user: User):
    """Handle pending list command (managers only)."""
    # Verify user is a manager, HR, or admin
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        await whatsapp.send_text(
            user.phone, 
            "❌ Access Denied\n\n"
            f"You are registered as {user.role.value}, but only Managers, HR, and Admins can view pending requests.\n\n"
            "Contact your HR department if you believe this is incorrect."
        )
        return
    
    requests = await service.get_pending_requests(manager_id=user.id)
    
    pending_list = [
        {
            "id": r.id,
            "name": r.user.name if r.user else "Unknown",
            "start_date": str(r.start_date),
            "type": r.leave_type.value
        }
        for r in requests
    ]
    
    await whatsapp.send_text(user.phone, format_pending_list(pending_list))


async def handle_team_today_command(service: LeaveService, user: User):
    """Handle team today command."""
    leaves = await service.get_today_leaves()
    
    if not leaves:
        await whatsapp.send_text(user.phone, "✅ No one is on leave today")
        return
    
    lines = ["📅 *On Leave Today*\n"]
    for leave in leaves:
        lines.append(f"• {leave['name']} ({leave['type'].capitalize()})")
    
    await whatsapp.send_text(user.phone, "\n".join(lines))


async def handle_media_message(db: AsyncSession, user: User, message: dict, media_type: str):
    """Handle media attachments (image, document, video, audio)."""
    from app.models import Attachment, LeaveRequest
    
    # Get media info from message
    media_data = message.get(media_type, {})
    media_id = media_data.get("id")
    mime_type = media_data.get("mime_type", "")
    caption = media_data.get("caption", "")
    
    if not media_id:
        return
    
    # Get the latest pending leave request from this user
    result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.user_id == user.id)
        .where(LeaveRequest.status == "pending")
        .order_by(LeaveRequest.created_at.desc())
    )
    latest_request = result.scalar_one_or_none()
    
    if not latest_request:
        await whatsapp.send_text(
            user.phone,
            "❌ No pending leave request found.\n\n"
            "Please apply for leave first using:\n"
            "`leave <date> <type> <reason>`\n\n"
            "Then send the attachment (medical certificate, etc.)"
        )
        return
    
    # Get media download URL from WhatsApp
    media_url = await whatsapp.get_media_url(media_id)
    
    if not media_url:
        await whatsapp.send_text(
            user.phone,
            "❌ Failed to retrieve attachment. Please try again."
        )
        return
    
    # Store attachment reference (in production, you'd download and store to cloud storage)
    attachment = Attachment(
        leave_request_id=latest_request.id,
        file_url=media_url,  # In production: upload to S3/Azure Blob and store that URL
        file_type=mime_type
    )
    db.add(attachment)
    await db.commit()
    
    # Notify user
    await whatsapp.send_text(
        user.phone,
        f"✅ Attachment added to leave request #{latest_request.id}\n\n"
        f"Type: {media_type.capitalize()}\n"
        "Your manager will be able to view this when reviewing your request."
    )
    
    # Notify manager about the attachment
    if latest_request.user.manager:
        manager_phone = latest_request.user.manager.phone
        await whatsapp.send_text(
            manager_phone,
            f"📎 *Attachment Received*\n\n"
            f"Request #{latest_request.id} from {user.name}\n"
            f"Type: {media_type.capitalize()}\n\n"
            f"View in dashboard: /requests/{latest_request.id}"
        )

