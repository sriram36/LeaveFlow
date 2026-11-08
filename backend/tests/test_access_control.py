import hashlib
import hmac

import pytest
from fastapi import HTTPException

from app.auth import (
    require_admin, require_hr_admin, require_manager, require_user_access,
    verify_whatsapp_signature,
)
from app.models import User, UserRole

SECRET = "app-secret"
BODY = b'{"entry": []}'


def _sign(body: bytes, secret: str = SECRET) -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def test_valid_webhook_signature_is_accepted():
    verify_whatsapp_signature(BODY, _sign(BODY), SECRET)


@pytest.mark.parametrize("signature", [
    "",                              # header missing
    "sha256=deadbeef",               # wrong digest
    _sign(b"other body"),            # signed a different payload
    _sign(BODY, "wrong-secret"),     # signed with a different secret
    _sign(BODY).replace("sha256=", ""),  # no scheme prefix
])
def test_invalid_webhook_signature_is_rejected(signature):
    with pytest.raises(HTTPException) as exc:
        verify_whatsapp_signature(BODY, signature, SECRET)
    assert exc.value.status_code == 403


def test_signature_check_is_skipped_when_no_app_secret_is_configured():
    # Documented limitation: without WHATSAPP_APP_SECRET the webhook is unauthenticated.
    verify_whatsapp_signature(BODY, "", "")


def _user(id, role, manager_id=None):
    return User(id=id, name=f"u{id}", phone=f"+{id}", role=role, manager_id=manager_id)


@pytest.mark.asyncio
@pytest.mark.parametrize("role, dependency, allowed", [
    (UserRole.worker, require_manager, False),
    (UserRole.manager, require_manager, True),
    (UserRole.hr, require_manager, True),
    (UserRole.admin, require_manager, True),
    (UserRole.manager, require_hr_admin, False),
    (UserRole.hr, require_hr_admin, True),
    (UserRole.hr, require_admin, False),
    (UserRole.admin, require_admin, True),
])
async def test_role_dependencies(role, dependency, allowed):
    user = _user(1, role)
    if allowed:
        assert await dependency(user) is user
    else:
        with pytest.raises(HTTPException) as exc:
            await dependency(user)
        assert exc.value.status_code == 403


@pytest.mark.parametrize("current, target, allowed", [
    (_user(1, UserRole.admin), _user(2, UserRole.admin), True),
    (_user(1, UserRole.hr), _user(2, UserRole.worker), True),
    (_user(1, UserRole.hr), _user(2, UserRole.admin), False),
    (_user(1, UserRole.manager), _user(2, UserRole.worker, manager_id=1), True),
    (_user(1, UserRole.manager), _user(2, UserRole.worker, manager_id=9), False),
    (_user(1, UserRole.worker, manager_id=5), _user(1, UserRole.worker, manager_id=5), True),
    (_user(1, UserRole.worker, manager_id=5), _user(5, UserRole.manager), True),
    (_user(1, UserRole.worker, manager_id=5), _user(2, UserRole.worker), False),
])
def test_user_access_rules(current, target, allowed):
    if allowed:
        require_user_access(current, target)
    else:
        with pytest.raises(HTTPException) as exc:
            require_user_access(current, target)
        assert exc.value.status_code == 403
