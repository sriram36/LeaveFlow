"""
AI Service for Natural Language Processing

Uses OpenRouter with FREE models (Llama, Mistral, etc.)
"""

from openai import OpenAI
from typing import Optional, Dict, Any
from datetime import datetime
from app.config import get_settings
import json

settings = get_settings()


class AIService:
    """Service for natural language processing with OpenRouter (free models)."""
    
    def __init__(self):
        if settings.openrouter_api_key:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key
            )
            # Use Mistral 7B (reliable free model)
            self.model = "mistralai/mistral-7b-instruct:free"
            print(f"[AI] ✅ Initialized with OpenRouter ({self.model})")
        else:
            self.client = None
            print("[AI] ⚠️ No OpenRouter API key - using fallback mode")
            print("[AI] Get FREE key at: https://openrouter.ai/keys")
    
    async def parse_leave_request(self, user_message: str, user_name: str) -> Dict[str, Any]:
        """Parse natural language leave request into structured data."""
        if not self.client:
            return {"error": "AI service not configured. Get free API key at https://openrouter.ai/keys"}
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        prompt = f"""You are a helpful leave management assistant. Parse this leave request into structured data.

Current date: {today}
User: {user_name}
Message: "{user_message}"

Extract:
1. start_date (YYYY-MM-DD format)
2. end_date (YYYY-MM-DD format, same as start if not specified)
3. leave_type (sick/vacation/personal/other)
4. reason (brief description)

Respond ONLY with valid JSON in this exact format:
{{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "leave_type": "sick",
  "reason": "brief reason"
}}

If the request is unclear or missing critical info, respond with:
{{
  "error": "What specific information is missing"
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300
            )
            
            text = response.choices[0].message.content.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        
        except Exception as e:
            error_msg = str(e)
            print(f"[AI] Error parsing: {error_msg}")
            
            # Check if it's an auth error
            if "401" in error_msg or "authentication" in error_msg.lower():
                print("[AI] ❌ Invalid API key - get one at https://openrouter.ai/keys")
                return {"error": "AI service authentication failed"}
            elif "429" in error_msg or "rate" in error_msg.lower():
                print("[AI] ⚠️ Rate limit - please try again in a moment")
                return {"error": "Too many requests, please wait a moment"}
            
            return {"error": "Please use format: 'leave from DD/MM/YYYY to DD/MM/YYYY for [reason]'"}
    
    async def generate_friendly_response(self, action: str, details: Dict[str, Any]) -> str:
        """Generate a friendly, natural response to user."""
        if not self.client:
            return self._fallback_response(action, details)
        
        prompt = f"""Generate a friendly, concise WhatsApp message (max 2-3 sentences) for this leave management action:

Action: {action}
Details: {details}

Tone: Professional but warm, like talking to a colleague.
Include emojis sparingly (1-2 max).
Keep it under 100 words."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[AI] Error generating response: {e}")
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
ai_service = AIService()

# Backward compatibility alias
gemini_service = ai_service
