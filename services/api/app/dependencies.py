from __future__ import annotations

from fastapi import Depends

from .auth import AuthenticatedUser, get_current_user
from .config import create_user_client


def get_supabase_client(
    user: AuthenticatedUser = Depends(get_current_user),
):
    return create_user_client(user.access_token)
