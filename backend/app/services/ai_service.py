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
            print(f"[AI] [OK] Initialized with OpenRouter ({self.model})")
        else:
            self.client = None
            print("[AI] [WARN] No OpenRouter API key - using fallback mode")
            print("[AI] Get FREE key at: https://openrouter.ai/keys")
    
    async def parse_leave_request(self, user_message: str, user_name: str, conversation_history: list = None) -> Dict[str, Any]:
        """Parse natural language leave request into structured data with conversation context."""
        if not self.client:
            return {"error": "AI service not configured. Get free API key at https://openrouter.ai/keys"}
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation:\n"
            for msg in conversation_history[-10:]:  # Last 10 messages
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        prompt = f"""You are a professional and friendly HR assistant helping {user_name} with their leave request. 
Analyze their message carefully and extract leave details with high accuracy.

Today's date: {today}
Day of week: {datetime.now().strftime("%A")}
{context_text}

Current message: "{user_message}"

Parse the message and extract:
1. **start_date** (YYYY-MM-DD format):
   - If "tomorrow": calculate from today ({today})
   - If "next Monday/Tuesday/etc": calculate actual date
   - If "15th" or "Dec 15": use current/next month intelligently
   - If "from 20-22": start is 20th
   
2. **end_date** (YYYY-MM-DD format):
   - If single day mentioned, same as start_date
   - If "2 days", calculate end_date from start_date
   - If "from 20-22": end is 22nd
   - If "for 3 days": calculate end_date as start_date + 2
   
3. **leave_type**: Choose most appropriate:
   - "casual": general leave, personal work, vacation, family function
   - "sick": medical, health issues, doctor appointment, not feeling well
   - "special": emergency, bereavement, urgent family matter
   
4. **reason**: Extract in user's own words, keep natural and complete
   
5. **duration_type**:
   - "full": full day(s)
   - "half_morning": morning half day (first half)
   - "half_afternoon": afternoon half day (second half)
   
6. **is_half_day**: true if half day mentioned, else false

7. **half_day_period**: "morning" or "afternoon" if half day

Be intelligent about:
- Relative dates (tomorrow, next week, day after tomorrow)
- Casual language ("need off", "won't be in", "taking leave")
- Implicit information from conversation history
- Ambiguous dates (use context to resolve)

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "leave_type": "casual",
  "reason": "complete reason from user",
  "duration_type": "full",
  "is_half_day": false,
  "half_day_period": null
}}

If information is missing or ambiguous, respond:
{{"error": "polite, specific question about what's unclear (e.g., 'Which dates do you need leave for?')"}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,  # Lower for more accurate extraction
                max_tokens=400
            )
            
            text = response.choices[0].message.content.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            # Remove any remaining markdown
            text = text.strip().strip('`').strip()
            
            result = json.loads(text)
            
            # Validate the result
            if "error" not in result:
                required_fields = ["start_date", "end_date", "leave_type"]
                missing = [f for f in required_fields if f not in result or not result[f]]
                if missing:
                    return {"error": f"I need more details: {', '.join(missing)}. Can you clarify?"}
            
            return result
        
        except json.JSONDecodeError as e:
            print(f"[AI] JSON parse error: {e}")
            print(f"[AI] Raw response: {text[:200]}")
            return {"error": "I had trouble understanding that. Could you rephrase your leave request?"}
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
            
            return {"error": "Could you please provide the leave dates and reason?"}
    
    async def generate_natural_response(
        self, 
        action: str, 
        details: Dict[str, Any], 
        user_name: str = "there",
        conversation_history: list = None
    ) -> str:
        """Generate natural, conversational responses using LLM with conversation context."""
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
    
    async def generate_natural_response(self, action: str, details: Dict[str, Any], user_name: str = "there", conversation_history: list = None) -> str:
        """Generate natural, conversational responses using LLM with conversation context."""
        if not self.client:
            return self._fallback_response(action, details)
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation context:\n"
            for msg in conversation_history[-10:]:
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        # Create a natural language prompt based on the action
        if action == "leave_submitted":
            prompt = f"""You are a professional and friendly WhatsApp assistant for LeaveFlow (leave management system).
{user_name} just submitted a leave request successfully. Generate a warm confirmation message.
{context_text}

Leave request details:
- Request ID: #{details.get('id')}
- Dates: {details.get('start_date')} to {details.get('end_date')}
- Duration: {details.get('days')} day(s)
- Type: {details.get('type', 'casual')}
- Reason: {details.get('reason', 'Not specified')}

Your message should:
1. Confirm the submission with enthusiasm
2. Include the request ID and dates clearly
3. Mention their manager has been notified
4. Be encouraging and professional
5. Use 1-2 relevant emojis (✅ or 📅 work well)
6. Keep it concise (3-4 lines max)
7. Sound natural, not robotic

Generate ONLY the WhatsApp message, no explanations:"""

        elif action == "balance_info":
            prompt = f"""You are a helpful WhatsApp assistant for LeaveFlow.
{user_name} asked about their leave balance. Present it clearly and professionally.
{context_text}

Current balance:
- Casual Leave: {details.get('casual')} days
- Sick Leave: {details.get('sick')} days  
- Special Leave: {details.get('special')} days

Your message should:
1. Present the balance in a clear, organized way
2. Be positive and helpful
3. Use emojis to make it visually clear (📊, 🏖️, 🏥, ⭐)
4. Offer to help with leave requests if they want
5. Keep it friendly and professional

Generate ONLY the WhatsApp message:"""

        elif action == "status_check":
            prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
{user_name} checked their leave request status. Present the information clearly.
{context_text}

Leave requests:
{json.dumps(details.get('requests', []), indent=2)}

Your message should:
1. List each request with ID, dates, and status
2. Use emojis for status (⏳ pending, ✅ approved, ❌ rejected)
3. Be clear and organized
4. Sound encouraging
5. Keep it scannable and easy to read

Generate ONLY the WhatsApp message:"""

        elif action == "approval_done":
            prompt = f"""You are a professional WhatsApp assistant for LeaveFlow.
{user_name} (a manager) just approved a leave request. Confirm the action warmly.
{context_text}

Approval details:
- Request ID: #{details.get('request_id')}
- Employee: {details.get('employee_name')}
- Dates: {details.get('dates')}

Your message should:
1. Confirm the approval
2. Thank them for the quick action
3. Mention the employee has been notified
4. Be brief and professional
5. Use 1 emoji (✅)

Generate ONLY the WhatsApp message:"""

        elif action == "rejection_done":
            prompt = f"""You are a professional WhatsApp assistant for LeaveFlow.
{user_name} (a manager) just rejected a leave request. Confirm the action professionally.
{context_text}

Rejection details:
- Request ID: #{details.get('request_id')}
- Employee: {details.get('employee_name')}
- Reason: {details.get('reason')}

Your message should:
1. Confirm the rejection sensitively
2. Acknowledge this is a difficult decision
3. Mention the employee has been notified
4. Be professional and empathetic
5. Use 1 emoji (📋)

Generate ONLY the WhatsApp message:"""

        elif action == "leave_cancelled":
            prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
{user_name} just cancelled their leave request. Confirm the cancellation.
{context_text}

Cancellation details:
- Request ID: #{details.get('request_id')}

Your message should:
1. Confirm the cancellation clearly
2. Reassure them it's okay to change plans
3. Offer to help with future requests
4. Be positive and supportive
5. Use 1-2 emojis (✅, 📋)

Generate ONLY the WhatsApp message:"""

        elif action == "manager_notification":
            prompt = f"""You are a professional WhatsApp assistant for LeaveFlow.
You're notifying {user_name} (a manager) about a new leave request from their team member.
{context_text}

Leave request details:
- Employee: {details.get('employee_name')}
- Request ID: #{details.get('request_id')}
- Dates: {details.get('start_date')} to {details.get('end_date')}
- Duration: {details.get('days')} day(s)
- Type: {details.get('type')}
- Reason: {details.get('reason')}

Your message should:
1. Present the information clearly and organized
2. Use professional formatting (bold for headers)
3. Include all key details (employee, dates, type, reason)
4. Explain how to approve or reject
5. Use relevant emojis (📋, 👤, 📅, 💬)
6. Keep it scannable and actionable

Example actions to include:
- Reply 'approve {details.get('request_id')}' to approve
- Reply 'reject {details.get('request_id')} reason' to reject

Generate ONLY the WhatsApp message:"""

        elif action == "pending_list":
            requests = details.get('requests', [])
            if not requests or len(requests) == 0:
                prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
{user_name} (a manager) checked for pending leave requests but there are none.
{context_text}

Your message should:
1. Inform them there are no pending requests
2. Sound positive and light
3. Mention they can relax for now
4. Use 1-2 emojis (✅, 🎉)

Generate ONLY the WhatsApp message:"""
            else:
                prompt = f"""You are a professional WhatsApp assistant for LeaveFlow.
{user_name} (a manager) requested the list of pending leave approvals.
{context_text}

Pending requests:
{json.dumps(requests, indent=2)}

Your message should:
1. List all pending requests clearly
2. Include: ID, employee name, dates, leave type for each
3. Use emojis for organization (📋, 👤, 📅)
4. Remind how to approve/reject
5. Keep it organized and scannable
6. Sound professional and helpful

Generate ONLY the WhatsApp message:"""

        elif action == "team_today":
            leaves = details.get('leaves', [])
            if not leaves or len(leaves) == 0:
                prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
{user_name} checked who's on leave today but nobody is absent.
{context_text}

Your message should:
1. Inform them everyone is in
2. Sound positive
3. Keep it brief and cheerful
4. Use 1 emoji (✅ or 👥)

Generate ONLY the WhatsApp message:"""
            else:
                prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
{user_name} checked who's on leave today.
{context_text}

People on leave today:
{json.dumps(leaves, indent=2)}

Your message should:
1. List everyone on leave with their leave type
2. Use clear formatting
3. Sound professional and informative
4. Use emojis (📅, 🏖️, 🏥 for different types)
5. Keep it organized

Generate ONLY the WhatsApp message:"""

        elif action == "error":
            prompt = f"""You are a helpful WhatsApp assistant for LeaveFlow.
{user_name} encountered an issue. Provide a helpful, friendly error message.
{context_text}

Error context: {details.get('message', 'Unknown error')}

Your message should:
1. Acknowledge the issue politely
2. Explain what went wrong (if known)
3. Suggest next steps or how to fix it
4. Be empathetic and solution-focused
5. Keep it conversational, not technical
6. Use a friendly emoji if appropriate (🤔, 💡)

Generate ONLY the WhatsApp message:"""

        else:
            # Generic response
            prompt = f"""You are a professional and friendly WhatsApp assistant for LeaveFlow.
Generate a helpful response for: {action}
{context_text}

Context: {json.dumps(details, indent=2)}

Your message should:
1. Be professional yet warm
2. Address {user_name} naturally
3. Be clear and actionable
4. Use appropriate emojis (1-2 max)
5. Keep it concise

Generate ONLY the WhatsApp message:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,  # Balanced creativity and consistency
                max_tokens=250
            )
            
            msg = response.choices[0].message.content.strip()
            
            # Clean up markdown and formatting
            msg = msg.replace("```", "").replace("**Message:**", "").replace("**", "")
            msg = msg.strip().strip('"').strip()
            
            # Ensure proper line breaks
            if "\\n" in msg:
                msg = msg.replace("\\n", "\n")
            
            return msg if msg else self._fallback_response(action, details)
            
        except Exception as e:
            print(f"[AI] Error generating response: {e}")
            return self._fallback_response(action, details)
    
    async def process_greeting(self, user_message: str, user_name: str, conversation_history: list = None) -> str:
        """Process casual greetings and messages with LLM, considering conversation context."""
        if not self.client:
            return self._fallback_greeting(user_message)
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation:\n"
            for msg in conversation_history[-10:]:
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        prompt = f"""You are a friendly and professional WhatsApp assistant for LeaveFlow (leave management system).
{user_name} just sent you a message. Respond naturally and helpfully.
{context_text}

Current message: "{user_message}"

Your response should:
- Be conversational and warm (professional colleague tone)
- Consider the conversation history for context
- Include 1-2 emojis max (use sparingly)
- Be 2-3 sentences maximum
- Handle these scenarios appropriately:
  * Greetings (hi/hello): Greet back warmly and ask how you can help
  * Thanks/gratitude: Say you're welcome and offer further assistance
  * Goodbye: Wish them well and invite them back anytime
  * Questions/help: Explain you can help with leave requests, balance checks, status
  * Casual chat: Be friendly but gently guide toward leave management tasks
- Match their energy (casual for casual, formal for formal)
- If they seem stuck, offer specific examples

Generate ONLY the response message, nothing else:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,  # More natural/conversational
                max_tokens=150
            )
            
            msg = response.choices[0].message.content.strip()
            
            # Clean up any markdown or formatting
            msg = msg.replace("```", "").replace("**", "").strip()
            
            # Remove surrounding quotes if present
            if (msg.startswith('"') and msg.endswith('"')) or (msg.startswith("'") and msg.endswith("'")):
                msg = msg[1:-1]
            
            return msg if msg else self._fallback_greeting(user_message)
            
        except Exception as e:
            print(f"[AI] Error processing greeting: {e}")
            return self._fallback_greeting(user_message)
    
    def generate_natural_response(self, action: str, details: Dict[str, Any] = None, user_name: str = "user") -> str:
        """Generate natural, context-aware responses using AI."""
        if details is None:
            details = {}
        
        # Create prompt based on action type
        if action == "leave_submitted":
            prompt = f"""You are a friendly WhatsApp chat assistant. {user_name} just submitted a leave request.

Request details:
- Request ID: {details.get('id')}
- From: {details.get('start_date')}
- To: {details.get('end_date')}
- Type: {details.get('type', 'casual')}
- Duration: {details.get('days')} days
- Reason: {details.get('reason', 'Not specified')}

Your response should:
- Acknowledge their request warmly
- Mention the request ID for reference
- Let them know their manager will review it
- Use 2-3 emojis max
- Be encouraging and positive
- Keep it to 2-3 sentences

Generate ONLY the response message:"""
        
        elif action == "leave_approved":
            prompt = f"""You are a friendly WhatsApp chat assistant. {user_name}'s leave request #{details.get('id')} was just approved.
Generate a warm, celebratory response saying their leave is approved and they can enjoy their time off.

Keep it to 1-2 sentences with 1-2 emojis.
Generate ONLY the response message:"""
        
        elif action == "leave_rejected":
            prompt = f"""You are a friendly WhatsApp chat assistant. {user_name}'s leave request #{details.get('id')} was rejected.
Reason: {details.get('reason', 'Not specified')}

Generate a respectful, empathetic response explaining the rejection and encouraging them to discuss with their manager.
Keep it to 2 sentences with 1 emoji.
Generate ONLY the response message:"""
        
        elif action == "balance_check":
            prompt = f"""You are a friendly WhatsApp chat assistant. {user_name} just checked their leave balance.

Current Balance:
- Casual: {details.get('casual')} days
- Sick: {details.get('sick')} days  
- Special: {details.get('special')} days

Generate a brief, friendly message presenting this information naturally.
Use emojis to make it visually clear (like 📅 for casual, 🏥 for sick, ⭐ for special).
Keep it conversational.
Generate ONLY the response message:"""
        
        elif action == "balance_updated":
            prompt = f"""You are a friendly WhatsApp chat assistant. {user_name}'s leave balance was just updated because a leave request was approved.

Leave approved:
- Type: {details.get('type', 'casual')}
- Days deducted: {details.get('days')}
- New balance: {details.get('new_balance')} days

Generate a brief, neutral update message informing them of the balance change.
Keep it to 1-2 sentences with 1 emoji.
Generate ONLY the response message:"""
        
        else:
            return self._fallback_response(action, details)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,  # Natural but consistent
                max_tokens=150
            )
            
            msg = response.choices[0].message.content.strip()
            msg = msg.replace("```", "").replace("**", "").strip()
            
            if msg.startswith('"') and msg.endswith('"'):
                msg = msg[1:-1]
            
            return msg or self._fallback_response(action, details)
            
        except Exception as e:
            print(f"[AI] Error generating natural response: {e}")
            return self._fallback_response(action, details)
    
    def _fallback_response(self, action: str, details: Dict[str, Any]) -> str:
        """Fallback responses if AI is unavailable."""
        if action == "leave_submitted":
            return f"""✅ Got it! Your leave request is in.

📋 Request #{details.get('id')} for {details.get('start_date')} to {details.get('end_date')}
🏷️ {details.get('type', '').capitalize()} - {details.get('days')} days

Your manager will review it shortly. I'll let you know once they respond! 👍"""
        elif action == "leave_approved":
            return f"🎉 Great news! Your leave request #{details.get('id')} has been approved. Enjoy your time off!"
        elif action == "leave_rejected":
            return f"Hey, your leave request #{details.get('id')} wasn't approved. Reason: {details.get('reason', 'Not specified')}. Feel free to discuss with your manager."
        elif action == "balance_check":
            return f"""📊 Your Leave Balance

🏖️ Casual: {details.get('casual')} days
🏥 Sick: {details.get('sick')} days
⭐ Special: {details.get('special')} days

Ready to apply for leave?"""
        elif action == "balance_updated":
            return f"📍 Balance updated: {details.get('days')} {details.get('type')} days deducted. Your new balance is {details.get('new_balance')} days."
        else:
            return "✅ All done!"
    
    def _fallback_greeting(self, user_message: str) -> str:
        """Fallback greeting if AI is unavailable."""
        message_lower = user_message.lower().strip()
        
        if any(word in message_lower for word in ["hi", "hello", "hey", "hola"]):
            return "Hey there! 👋 How can I help you with your leaves today?"
        elif any(word in message_lower for word in ["thank", "tq", "ty", "thx"]):
            return "You're welcome! 😊 Anything else I can help with?"
        elif any(word in message_lower for word in ["bye", "goodbye", "cya"]):
            return "Goodbye! 👋 Talk soon!"
        elif any(word in message_lower for word in ["help", "how"]):
            return "I can help you apply for leaves, check your balance, and manage requests. Just ask naturally! 📋"
        else:
            return "Hey! 😊 How can I assist you today?"


# Global instance
ai_service = AIService()

# Backward compatibility alias
gemini_service = ai_service
