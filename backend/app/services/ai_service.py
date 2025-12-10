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
        
        prompt = f"""You are a friendly HR assistant helping {user_name} with their leave request. Parse this message naturally.

Today's date: {today}
Message: "{user_message}"

Extract and infer:
- start_date (YYYY-MM-DD) - if they say "tomorrow", calculate it from today
- end_date (YYYY-MM-DD) - if not mentioned, same as start_date  
- leave_type (sick/vacation/personal/other) - infer from context
- reason (their own words, keep it natural)
- duration_type (full/half_first/half_second) - default "full" unless they mention half day

Respond ONLY with valid JSON:
{{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "leave_type": "sick",
  "reason": "their reason",
  "duration_type": "full"
}}

If unclear, respond:
{{"error": "friendly question about what's missing"}}"""

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
        
        if action == "leave_submitted":
            prompt = f"""Write a warm, friendly WhatsApp message confirming a leave request was submitted.

Details:
- Request ID: {details.get('id')}
- Date: {details.get('date')}
- Type: {details.get('type')}
- Duration: {details.get('duration')}
- Reason: {details.get('reason')}

Tone: Like a helpful colleague, not a robot. Be encouraging and reassuring.
Length: 2-3 sentences max.
Include: 1-2 relevant emojis, mention their manager will review it.
Format: Professional but friendly.

Write the message:"""
        else:
            prompt = f"""Generate a friendly WhatsApp message for: {action}
Details: {details}
Tone: Professional but warm, like talking to a colleague.
Keep it under 100 words."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,  # More creative/natural
                max_tokens=200
            )
            
            msg = response.choices[0].message.content.strip()
            
            # Remove any markdown artifacts
            msg = msg.replace("```", "").replace("**Message:**", "").strip()
            
            # Ensure it has proper line breaks
            if "\\n" in msg:
                msg = msg.replace("\\n", "\n")
            
            return msg
            
        except Exception as e:
            print(f"[AI] Error generating response: {e}")
            return self._fallback_response(action, details)
    
    def _fallback_response(self, action: str, details: Dict[str, Any]) -> str:
        """Fallback responses if AI is unavailable."""
        if action == "leave_submitted":
            return f"""✅ Got it! Your leave request is in.

📋 Request #{details.get('id')} for {details.get('date')}
🏷️ {details.get('type', '').capitalize()} - {details.get('duration')}

Your manager will review it shortly. I'll let you know once they respond! 👍"""
        elif action == "leave_approved":
            return f"🎉 Great news! Your leave request #{details.get('id')} has been approved. Enjoy your time off!"
        elif action == "leave_rejected":
            return f"Hey, your leave request #{details.get('id')} wasn't approved. Reason: {details.get('reason', 'Not specified')}. Feel free to discuss with your manager."
        else:
            return "✅ All done!"


# Global instance
ai_service = AIService()

# Backward compatibility alias
gemini_service = ai_service
