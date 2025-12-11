"""
WhatsApp Webhook Routes

Handles incoming WhatsApp messages and webhook verification.
"""

from fastapi import APIRouter, Request, Response, Depends, HTTPException, Query
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
from app.services.ai_service import ai_service
from app.auth import get_user_by_phone, normalize_phone_number


def normalize_token(value: str | None) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    return value.strip().strip('"\'')


def debug_print_query(params: dict):
    try:
        print(f"[Webhook Debug] Query params: {params}")
    except Exception:
        pass

settings = get_settings()
router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])


@router.get("/whatsapp")
async def verify_webhook(
    request: Request,
    hub_mode: str = Query(..., alias="hub.mode", description="Verification mode, must be 'subscribe'"),
    hub_verify_token: str = Query(..., alias="hub.verify_token", description="Verification token provided by WhatsApp"),
    hub_challenge: str = Query(..., alias="hub.challenge", description="Challenge string to echo back")
):
    """Verify webhook for WhatsApp Cloud API.
    
    This endpoint is called by Meta (WhatsApp) to verify webhook ownership.
    It must return the challenge string when verification succeeds.
    
    Required query parameters:
    - hub.mode: Must be "subscribe"
    - hub.verify_token: Must match the configured WHATSAPP_VERIFY_TOKEN
    - hub.challenge: Random string to echo back on success
    """
    params = request.query_params
    
    mode = hub_mode
    token = hub_verify_token
    challenge = hub_challenge
    
    # Debug logging
    debug_print_query(dict(params))
    print(f"[Webhook Verify] Client: {request.client}")

    received_token = normalize_token(token)
    expected_token = normalize_token(settings.whatsapp_verify_token)
    print(f"[Webhook Verify] Mode: {mode}, Token match: {received_token == expected_token}")
    print(f"[Webhook Verify] Received token: {received_token!r}, Expected: {expected_token!r}")
    
    if mode == "subscribe" and received_token and received_token == expected_token:
        print(f"[Webhook Verify] ✓ Verification successful")
        return Response(content=challenge, media_type="text/plain")
    
    # Detailed failure reasons for debugging
    if mode != "subscribe":
        print(f"[Webhook Verify] ✗ Verification failed: wrong mode ({mode})")
    elif not expected_token:
        print(f"[Webhook Verify] ✗ Verification failed: server verify token not configured")
    else:
        print(f"[Webhook Verify] ✗ Verification failed: token mismatch")

    raise HTTPException(status_code=403, detail="Verification failed")


@router.get("/whatsapp/inspect-token")
async def inspect_whatsapp_verify_token():
    # Returns whether a verify token is configured (masked) to help diagnose production issues
    token = settings.whatsapp_verify_token
    length = len(token) if token else 0
    configured = bool(token)
    masked = None
    if configured:
        if length <= 4:
            masked = "*" * length
        else:
            masked = token[:2] + "*" * (length - 4) + token[-2:]
    return {"configured": configured, "length": length, "mask": masked}


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
    from_phone = normalize_phone_number(message.get("from"))  # Normalize phone number
    message_type = message.get("type")
    
    # Idempotency check
    if message_id:
        existing = await db.execute(
            select(ProcessedMessage).where(ProcessedMessage.message_id == message_id)
        )
        if existing.scalar_one_or_none():
            return {"status": "ok", "note": "already processed"}
        
        # Mark as processed - use try/except to handle race conditions
        try:
            db.add(ProcessedMessage(message_id=message_id))
            await db.commit()
        except Exception as e:
            # Handle race condition if another request already inserted this message
            await db.rollback()
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                return {"status": "ok", "note": "already processed"}
            # Re-raise other errors
            raise
    
    # Send read receipt immediately
    if message_id:
        await whatsapp.send_read_receipt(message_id)
    
    # Send typing indicator for instant feedback
    await whatsapp.send_typing_indicator(from_phone)
    
    # Get or create user
    user = await get_user_by_phone(db, from_phone)
    
    if not user:
        # Auto-register new users as workers
        # Find a default manager to assign
        manager_result = await db.execute(
            select(User)
            .where(User.role.in_([UserRole.manager, UserRole.hr]))
            .limit(1)
        )
        default_manager = manager_result.scalar_one_or_none()
        
        user = User(
            name=f"User {from_phone[-4:]}",
            phone=from_phone,
            role=UserRole.worker,
            manager_id=default_manager.id if default_manager else None
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        print(f"[Webhook] 👤 New user registered: {user.name} ({user.phone})")
        if default_manager:
            print(f"[Webhook] 👔 Assigned manager: {default_manager.name}")
        else:
            print(f"[Webhook] ⚠️ No manager available to assign!")
        
        await whatsapp.send_text(
            from_phone,
            "👋 Hey! Welcome to LeaveFlow!\n\n"
            "I'm here to help with your leaves. Just chat with me naturally:\n"
            "_'I need sick leave tomorrow'_\n"
            "_'Taking 2 days off next week'_\n\n"
            "Or try these:\n"
            "• `balance` - See your available leaves\n"
            "• `pending` - Check your requests\n"
            "• `help` - Get more tips\n\n"
            "Let's make leave management easy! 😊"
        )
        return {"status": "ok"}
    
    # Handle text messages
    if message_type == "text":
        text = message.get("text", {}).get("body", "")
        await process_text_message(db, user, text)
    
    # Handle interactive responses (button clicks)
    elif message_type == "interactive":
        interactive = message.get("interactive", {})
        button_reply = interactive.get("button_reply", {})
        button_id = button_reply.get("id", "")
        await process_text_message(db, user, button_id)
    
    # Handle image/document uploads
    elif message_type in ["image", "document", "video", "audio"]:
        await handle_media_message(db, user, message, message_type)
    
    return {"status": "ok"}


async def process_text_message(db: AsyncSession, user: User, text: str):
    """Process a text message from a user."""
    # Check if it's a casual greeting - send to LLM for natural response
    is_greeting = check_if_greeting(text)
    if is_greeting:
        response = await ai_service.process_greeting(text, user.name)
        await whatsapp.send_text(user.phone, response)
        return
    
    parsed = parse_message(text)
    service = LeaveService(db)
    
    try:
        # First try command-based parsing
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
            # Try natural language processing with LLM
            await handle_natural_language_request(db, user, text)
    
    except LeaveValidationError as e:
        await whatsapp.send_text(user.phone, f"❌ {e.message}")
    
    except Exception as e:
        import traceback
        print(f"Error processing message: {e}")
        print(traceback.format_exc())
        await whatsapp.send_text(
            user.phone,
            "Oops, something went wrong on my end! 😅\n\n"
            "Let's try again. Here are some things you can do:\n"
            "• Type `balance` to check your leaves\n"
            "• Type `pending` to see your requests\n"
            "• Or just tell me: _'I need sick leave tomorrow'_\n\n"
            "Need help? Just ask!"
        )


async def handle_natural_language_request(db: AsyncSession, user: User, text: str):
    """Handle natural language leave requests using AI."""
    # Parse with AI service
    parsed_data = await ai_service.parse_leave_request(text, user.name)
    
    if "error" in parsed_data:
        # Provide friendly, conversational help
        await whatsapp.send_text(
            user.phone,
            "Hey! I'm not quite sure what you mean. 🤔\n\n"
            "Here are some ways you can ask:\n"
            "• _'I need sick leave tomorrow'_\n"
            "• _'Taking 2 days off from Dec 15'_\n"
            "• _'Half day on Monday morning'_\n\n"
            "Or just type `balance` or `help` anytime!"
        )
        return
    
    # Create leave request with parsed data
    service = LeaveService(db)
    
    try:
        from datetime import datetime
        request = await service.create_leave_request(
            user_id=user.id,
            start_date=datetime.strptime(parsed_data["start_date"], "%Y-%m-%d").date(),
            end_date=datetime.strptime(parsed_data["end_date"], "%Y-%m-%d").date(),
            leave_type=parsed_data["leave_type"],
            reason=parsed_data["reason"],
            is_half_day=parsed_data["duration_type"] != "full",
            half_day_period=parsed_data["duration_type"] if parsed_data["duration_type"] != "full" else None
        )
        
        # Generate friendly confirmation using AI
        duration = "Half day" if parsed_data.get("duration_type", "full") != "full" else f"{request.days} day(s)"
        
        # Try to generate human-like response
        friendly_msg = await ai_service.generate_friendly_response(
            "leave_submitted",
            {
                "id": request.id,
                "date": parsed_data['start_date'],
                "type": parsed_data['leave_type'],
                "duration": duration,
                "reason": parsed_data.get('reason', '')
            }
        )
        
        await whatsapp.send_text(user.phone, friendly_msg)
    
    except Exception as e:
        await whatsapp.send_text(
            user.phone,
            f"❌ Error: {str(e)}\n\nTry: _'sick leave tomorrow'_"
        )


async def handle_leave_command(service: LeaveService, user: User, parsed):
    """Handle leave application command."""
    if parsed.error:
        await whatsapp.send_text(user.phone, f"❌ {parsed.error}")
        return
    
    leave_request = await service.create_leave_request(
        user_id=user.id,
        start_date=parsed.start_date,
        end_date=parsed.end_date,
        leave_type=parsed.leave_type or "casual",
        reason=parsed.reason,
        is_half_day=parsed.is_half_day,
        half_day_period=parsed.half_day_period
    )
    
    # Generate natural response using LLM
    response = await ai_service.generate_natural_response(
        action="leave_submitted",
        details={
            "id": leave_request.id,
            "start_date": str(parsed.start_date),
            "end_date": str(parsed.end_date),
            "type": parsed.leave_type or "casual",
            "days": leave_request.days,
            "duration": "Full Day" if not parsed.is_half_day else f"Half Day ({parsed.half_day_period})",
            "reason": parsed.reason
        },
        user_name=user.name
    )
    await whatsapp.send_text(user.phone, response)
    
    # Send notification to manager if assigned
    if user.manager_id:
        # Get manager from database
        from sqlalchemy import select
        db_session = service.db  # LeaveService has db session
        manager_result = await db_session.execute(
            select(User).where(User.id == user.manager_id)
        )
        manager = manager_result.scalar_one_or_none()
        
        if manager and manager.phone:
            # Send manager notification
            manager_message = (
                f"📋 New Leave Request\n\n"
                f"👤 *{user.name}* has applied for {leave_request.days}-day(s) {parsed.leave_type or 'casual'} leave\n\n"
                f"📅 *Dates:* {parsed.start_date} to {parsed.end_date}\n"
                f"💬 *Reason:* {parsed.reason or 'No reason provided'}\n"
                f"📌 *Request ID:* #{leave_request.id}\n\n"
                f"Reply with:\n"
                f"• `approve {leave_request.id}` to approve\n"
                f"• `reject {leave_request.id} reason` to reject"
            )
            await whatsapp.send_text(manager.phone, manager_message)


async def handle_balance_command(service: LeaveService, user: User):
    """Handle balance check command."""
    balance = await service.get_balance(user.id)
    
    # Generate natural response using LLM
    response = await ai_service.generate_natural_response(
        action="balance_check",
        details={
            "casual": balance["casual"],
            "sick": balance["sick"],
            "special": balance["special"]
        },
        user_name=user.name
    )
    await whatsapp.send_text(user.phone, response)


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
            f"❌ *Access Denied*\n\nYou're registered as _{user.role.value}_. Only managers can approve.\n\nContact HR if incorrect."
        )
        return
    
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `approve 32`")
        return
    
    request = await service.approve_leave(request_id, user.id)
    
    # Generate natural response using LLM
    response = await ai_service.generate_natural_response(
        action="leave_approved",
        details={"id": request_id},
        user_name=user.name
    )
    await whatsapp.send_text(user.phone, response)


async def handle_reject_command(service: LeaveService, user: User, request_id: Optional[int], reason: Optional[str]):
    """Handle reject command (managers only)."""
    # Verify user is a manager, HR, or admin
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        await whatsapp.send_text(
            user.phone, 
            f"❌ *Access Denied*\n\nYou're registered as _{user.role.value}_. Only managers can reject.\n\nContact HR if incorrect."
        )
        return
    
    if not request_id:
        await whatsapp.send_text(user.phone, "❌ Please provide a request ID: `reject 32 reason`")
        return
    
    request = await service.reject_leave(request_id, user.id, reason)
    
    # Generate natural response using LLM
    response = await ai_service.generate_natural_response(
        action="leave_rejected",
        details={"id": request_id, "reason": reason or "Not specified"},
        user_name=user.name
    )
    await whatsapp.send_text(user.phone, response)


async def handle_pending_command(service: LeaveService, user: User):
    """Handle pending list command (managers only)."""
    # Verify user is a manager, HR, or admin
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        await whatsapp.send_text(
            user.phone, 
            f"❌ *Access Denied*\n\nYou're registered as _{user.role.value}_. Only managers can view pending.\n\nContact HR if incorrect."
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
    from app.models import LeaveStatus
    result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.user_id == user.id)
        .where(LeaveRequest.status == LeaveStatus.pending)
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


def check_if_greeting(text: str) -> bool:
    """Check if message is a casual greeting or polite message."""
    text = text.strip().lower()
    
    # Greeting keywords
    greeting_keywords = [
        "hi", "hello", "hey", "hola", "howdy", "yo",
        "thank", "thanks", "thankyou", "thnks", "tq", "ty", "thx",
        "bye", "goodbye", "see you", "see ya", "cya", "ttyl", "gotta go",
        "help", "how", "ok", "okay", "understood", "got it",
        "yes", "yep", "yeah", "aye", "absolutely", "definitely", "of course",
        "no", "nope", "nah", "not now", "later"
    ]
    
    # Check if text matches or starts with any greeting keyword
    for keyword in greeting_keywords:
        if text == keyword or text.startswith(keyword):
            return True
    
    # Check if text contains greeting keywords
    for keyword in greeting_keywords:
        if keyword in text:
            return True
    
    return False


