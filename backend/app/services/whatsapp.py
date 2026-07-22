from app.logging_config import logger
"""
WhatsApp API Service

Handles sending messages via WhatsApp Cloud API.
"""

import httpx
from typing import Optional, Dict, Any
from app.config import get_settings
from app.constants import (
    WHATSAPP_TYPING_TIMEOUT,
    WHATSAPP_READ_RECEIPT_TIMEOUT,
    WHATSAPP_MESSAGE_TIMEOUT,
    WHATSAPP_INTERACTIVE_TIMEOUT,
)

settings = get_settings()


class WhatsAppService:
    """Service for sending WhatsApp messages."""
    
    BASE_URL = "https://graph.facebook.com/v19.0"
    
    def __init__(self):
        self.token = settings.whatsapp_token
        self.phone_id = settings.whatsapp_phone_number_id
    
    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    async def send_typing_indicator(self, to: str) -> bool:
        """Send typing indicator (shows '...' in WhatsApp)."""
        if not self.token or not self.phone_id:
            logger.info(f"[WhatsApp] Would send typing indicator to {to}")
            return True
        
        url = f"{self.BASE_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "typing"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers, timeout=WHATSAPP_TYPING_TIMEOUT)
                response.raise_for_status()
                logger.info(f"[WhatsApp] Typing indicator sent to {to}")
                return True
            except Exception as e:
                logger.error(f"[WhatsApp] Error sending typing indicator: {e}")
                return False
    
    async def send_read_receipt(self, message_id: str) -> bool:
        """Send read receipt (blue ticks) for a message."""
        if not self.token or not self.phone_id:
            logger.info(f"[WhatsApp] Would send read receipt for message {message_id}")
            return True
        
        url = f"{self.BASE_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers, timeout=WHATSAPP_READ_RECEIPT_TIMEOUT)
                response.raise_for_status()
                logger.info(f"[WhatsApp] Read receipt sent for message {message_id}")
                return True
            except Exception as e:
                logger.error(f"[WhatsApp] Error sending read receipt: {e}")
                return False
    
    async def send_text(self, to: str, message: str) -> bool:
        """Send a text message."""
        if not self.token or not self.phone_id:
            logger.error(f"[WhatsApp] [ERROR] MISSING CREDENTIALS!")
            logger.info(f"[WhatsApp] Token present: {bool(self.token)}")
            logger.info(f"[WhatsApp] Phone ID present: {bool(self.phone_id)}")
            logger.info(f"[WhatsApp] Would send to {to}: {message[:50]}...")
            return False  # Changed from True to False
        
        url = f"{self.BASE_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        logger.info(f"[WhatsApp] 📤 Sending message to {to}")
        logger.info(f"[WhatsApp] URL: {url}")
        logger.info(f"[WhatsApp] Phone ID: {self.phone_id}")
        logger.info(f"[WhatsApp] Message preview: {message[:100]}...")
        
        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                try:
                    response = await client.post(url, json=payload, headers=self.headers, timeout=WHATSAPP_MESSAGE_TIMEOUT)
                    response.raise_for_status()
                    result = response.json()
                    logger.info(f"[WhatsApp] [OK] Message sent successfully to {to}")
                    return True
                except httpx.HTTPStatusError as e:
                    logger.error(f"[WhatsApp] [ERROR] HTTP Error {e.response.status_code}: {e.response.text}")
                    if attempt == 2:
                        return False
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                except Exception as e:
                    logger.error(f"[WhatsApp] [ERROR] Error sending message to {to}: {str(e)}")
                    if attempt == 2:
                        return False
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
            return False
    
    async def send_interactive_buttons(
        self,
        to: str,
        body: str,
        buttons: list[Dict[str, str]],
        header: Optional[str] = None
    ) -> bool:
        """Send an interactive message with buttons."""
        if not self.token or not self.phone_id:
            logger.info(f"[WhatsApp] Would send interactive to {to}: {body}")
            return True
        
        url = f"{self.BASE_URL}/{self.phone_id}/messages"
        
        action_buttons = [
            {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
            for b in buttons[:3]  # WhatsApp limit is 3 buttons
        ]
        
        interactive = {
            "type": "button",
            "body": {"text": body},
            "action": {"buttons": action_buttons}
        }
        
        if header:
            interactive["header"] = {"type": "text", "text": header}
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": interactive
        }
        
        async with httpx.AsyncClient() as client:
            for attempt in range(3):
                try:
                    response = await client.post(url, json=payload, headers=self.headers, timeout=WHATSAPP_INTERACTIVE_TIMEOUT)
                    response.raise_for_status()
                    return True
                except Exception as e:
                    logger.error(f"[WhatsApp] Error sending interactive: {e}")
                    if attempt == 2:
                        return False
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
            return False
    
    async def get_media_url(self, media_id: str) -> Optional[str]:
        """Get the download URL for a media file."""
        if not self.token:
            return None
        
        url = f"{self.BASE_URL}/{media_id}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                return data.get("url")
            except Exception as e:
                logger.error(f"[WhatsApp] Error getting media URL: {e}")
                return None
    
    async def download_media(self, media_url: str) -> Optional[bytes]:
        """Download media content from WhatsApp."""
        if not self.token:
            return None
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(media_url, headers=self.headers)
                response.raise_for_status()
                return response.content
            except Exception as e:
                logger.error(f"[WhatsApp] Error downloading media: {e}")
                return None


def get_whatsapp_service() -> WhatsAppService:
    return WhatsAppService()


# Message templates

def format_leave_request_notification(
    request_id: int,
    employee_name: str,
    start_date: str,
    end_date: str,
    days: float,
    leave_type: str,
    reason: Optional[str]
) -> str:
    """Format a leave request notification for managers."""
    duration = f"{days} day" if days == 1 else f"{days} days"
    return f"""📋 *New Leave Request*

👤 {employee_name}
📅 {start_date} to {end_date} ({duration})
🏷️ {leave_type.capitalize()}
💬 {reason or 'No reason'}

Reply: `approve {request_id}` or `reject {request_id} <reason>`"""


def format_leave_confirmation(
    request_id: int,
    start_date: str,
    end_date: str,
    days: float,
    leave_type: str,
    warning: Optional[str] = None
) -> str:
    """Format leave request confirmation for employee."""
    msg = f"""✅ *Leave Submitted*

🎫 ID: #{request_id}
📅 {start_date} to {end_date} ({days} days)
🏷️ {leave_type.capitalize()}

Manager notified. You'll get an update soon!"""
    
    if warning:
        msg += f"\n\n⚠️ {warning}"
    
    return msg


def format_approval_notification(request_id: int, approver_name: str) -> str:
    """Format approval notification for employee."""
    return f"""✅ *Leave Approved!*

Request #{request_id} approved by {approver_name}.

Enjoy your time off! 🎉"""


def format_rejection_notification(request_id: int, approver_name: str, reason: Optional[str]) -> str:
    """Format rejection notification for employee."""
    msg = f"""❌ *Leave Rejected*

Request #{request_id} rejected by {approver_name}."""
    
    if reason:
        msg += f"\n\nReason: {reason}"
    
    msg += "\n\nYou can apply for different dates if needed."
    
    return msg


def format_cancellation_confirmation(request_id: int) -> str:
    """Format cancellation confirmation for employee."""
    return f"""🚫 *Leave Cancelled*

Your leave request #{request_id} has been cancelled.

Your leave balance has been restored."""


def format_balance_message(casual: float, sick: float, special: float) -> str:
    """Format leave balance message."""
    return f"""📊 *Your Leave Balance*

🏖️ Casual: {casual} days
🏥 Sick: {sick} days
⭐ Special: {special} days

_Just chat: 'sick leave tomorrow'_"""


def format_status_message(
    request_id: int,
    status: str,
    start_date: str,
    end_date: str,
    leave_type: str,
    reason: Optional[str]
) -> str:
    """Format leave status message."""
    status_emoji = {
        "pending": "⏳",
        "approved": "✅",
        "rejected": "❌",
        "cancelled": "🚫"
    }
    
    return f"""📋 *Leave Request #{request_id}*

Status: {status_emoji.get(status, '❓')} {status.capitalize()}
📅 Dates: {start_date} to {end_date}
📝 Type: {leave_type.capitalize()}
💬 Reason: {reason or 'Not specified'}"""


def format_daily_summary(leaves: list[Dict[str, Any]]) -> str:
    """Format daily leave summary for managers."""
    if not leaves:
        return "📅 *Today's Leave Summary*\n\n✅ No one is on leave today."
    
    lines = ["📅 *Today's Leave Summary*\n"]
    for leave in leaves:
        lines.append(f"• {leave['name']} ({leave['type'].capitalize()})")
    
    return "\n".join(lines)


def format_pending_list(requests: list[Dict[str, Any]]) -> str:
    """Format pending requests list."""
    if not requests:
        return "📋 *Pending Requests*\n\n✅ No pending leave requests."
    
    lines = ["📋 *Pending Requests*\n"]
    for req in requests[:10]:  # Limit to 10
        lines.append(f"#{req['id']} - {req['name']}: {req['start_date']} ({req['type']})")
    
    if len(requests) > 10:
        lines.append(f"\n...and {len(requests) - 10} more")
    
    return "\n".join(lines)
