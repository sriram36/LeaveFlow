"""
Gemini AI Service

Natural language processing for leave requests using Google Gemini.
"""

import google.generativeai as genai
from typing import Optional, Dict, Any
from datetime import datetime
from app.config import get_settings

settings = get_settings()


class GeminiService:
    """Service for natural language processing with Gemini."""
    
    def __init__(self):
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            # Use gemini-1.5-flash (better free tier quota than 2.0)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            print("[Gemini] ✅ Initialized with gemini-1.5-flash")
        else:
            self.model = None
            print("[Gemini] ⚠️ No API key - using fallback mode")
    
    async def parse_leave_request(self, user_message: str, user_name: str) -> Dict[str, Any]:
        """Parse natural language leave request into structured data."""
        if not self.model:
            return {"error": "AI service not configured"}
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        prompt = f"""You are a helpful leave management assistant. Parse this leave request into structured data.

Current date: {today}
User: {user_name}
Message: "{user_message}"

Extract:
1. start_date (YYYY-MM-DD format)
2. end_date (YYYY-MM-DD format, same as start if not specified)
3. leave_type (casual/sick/special)
4. duration_type (full/half_morning/half_afternoon)
5. reason (brief description)

Respond ONLY with valid JSON in this exact format:
{{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "leave_type": "casual",
  "duration_type": "full",
  "reason": "brief reason"
}}

If the request is unclear or missing critical info, respond with:
{{
  "error": "What specific information is missing"
}}"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            import json
            return json.loads(text)
        
        except Exception as e:
            error_msg = str(e)
            print(f"[Gemini] Error parsing: {error_msg}")
            
            # Check if it's a quota error
            if "429" in error_msg or "quota" in error_msg.lower():
                print("[Gemini] ⚠️ Quota exceeded - please use structured format")
                return {
                    "error": "Please use format: 'leave from DD/MM/YYYY to DD/MM/YYYY for [reason]'"
                }
            
            return {"error": f"Could not understand your request. Please try: 'I need leave on 2024-12-15 for sick leave'"}
    
    async def generate_friendly_response(self, action: str, details: Dict[str, Any]) -> str:
        """Generate a friendly, natural response to user."""
        if not self.model:
            return self._fallback_response(action, details)
        
        prompt = f"""Generate a friendly, concise WhatsApp message (max 2-3 sentences) for this leave management action:

Action: {action}
Details: {details}

Tone: Professional but warm, like talking to a colleague.
Include emojis sparingly (1-2 max).
Keep it under 100 words."""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[Gemini] Error generating response: {e}")
            return self._fallback_response(action, details)
    
    def _fallback_response(self, action: str, details: Dict[str, Any]) -> str:
        """Fallback responses if Gemini is unavailable."""
        if action == "leave_submitted":
            return f"✅ Your leave request has been submitted! Request ID: #{details.get('id')}"
        elif action == "leave_approved":
            return f"🎉 Your leave request #{details.get('id')} has been approved!"
        elif action == "leave_rejected":
            return f"❌ Your leave request #{details.get('id')} was not approved. Reason: {details.get('reason', 'Not specified')}"
        else:
            return "✅ Done!"


# Global instance
gemini_service = GeminiService()
