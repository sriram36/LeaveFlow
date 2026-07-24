from locust import HttpUser, task, between

class LeaveFlowUser(HttpUser):
    wait_time = between(1, 5)

    @task(3)
    def view_dashboard(self):
        # Fetch dashboard statistics
        self.client.get("/api/v1/users/me", name="/api/v1/users/me")
        
    @task(2)
    def view_leave_requests(self):
        # Fetch paginated leave requests
        self.client.get("/api/v1/leave", name="/api/v1/leave")
        
    @task(1)
    def simulate_whatsapp_webhook(self):
        # Simulate an incoming read receipt (lightweight webhook event)
        self.client.post(
            "/webhook/whatsapp",
            json={
                "object": "whatsapp_business_account",
                "entry": [{
                    "id": "12345",
                    "changes": [{
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {"display_phone_number": "1234567890"},
                            "statuses": [{
                                "id": "wamid.HBgL...",
                                "status": "read",
                                "timestamp": "1631234567",
                                "recipient_id": "1234567890"
                            }]
                        },
                        "field": "messages"
                    }]
                }]
            },
            name="/webhook/whatsapp (Status)"
        )
