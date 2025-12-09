"""
WhatsApp API Service

Handles sending messages via WhatsApp Cloud API.
"""

import httpx
from typing import Optional, Dict, Any
from app.config import get_settings

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
    
    async def send_text(self, to: str, message: str) -> bool:
        """Send a text message."""
        if not self.token or not self.phone_id:
            print(f"[WhatsApp] Would send to {to}: {message}")
            return True
        
        url = f"{self.BASE_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return True
            except Exception as e:
                print(f"[WhatsApp] Error sending message: {e}")
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
            print(f"[WhatsApp] Would send interactive to {to}: {body}")
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
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return True
            except Exception as e:
                print(f"[WhatsApp] Error sending interactive: {e}")
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
                print(f"[WhatsApp] Error getting media URL: {e}")
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
                print(f"[WhatsApp] Error downloading media: {e}")
                return None


# Singleton instance
whatsapp = WhatsAppService()


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
    return f"""📋 *Leave Request #{request_id}*

👤 Employee: {employee_name}
📅 Dates: {start_date} to {end_date} ({days} day{'s' if days != 1 else ''})
📝 Type: {leave_type.capitalize()}
💬 Reason: {reason or 'Not specified'}

Reply:
• `approve {request_id}` to approve
• `reject {request_id} <reason>` to reject"""


def format_leave_confirmation(
    request_id: int,
    start_date: str,
    end_date: str,
    days: float,
    leave_type: str,
    warning: Optional[str] = None
) -> str:
    """Format leave request confirmation for employee."""
    msg = f"""✅ *Leave Request Submitted*

🎫 Request ID: #{request_id}
📅 Dates: {start_date} to {end_date}
📊 Days: {days}
📝 Type: {leave_type.capitalize()}

Your manager has been notified. You'll receive an update once it's reviewed."""
    
    if warning:
        msg += f"\n\n⚠️ Note: {warning}"
    
    return msg


def format_approval_notification(request_id: int, approver_name: str) -> str:
    """Format approval notification for employee."""
    return f"""✅ *Leave Approved*

Your leave request #{request_id} has been approved by {approver_name}.

Have a good time off! 🎉"""


def format_rejection_notification(request_id: int, approver_name: str, reason: Optional[str]) -> str:
    """Format rejection notification for employee."""
    return f"""❌ *Leave Rejected*

Your leave request #{request_id} has been rejected by {approver_name}.

Reason: {reason or 'No reason provided'}

You can apply for different dates if needed."""


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

Use `leave <date> <type> <reason>` to apply."""


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
