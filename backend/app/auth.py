"""
Verifies Auth0-issued access tokens (RS256, signed against Auth0's JWKS) and
resolves them to a local Usuario row, creating one on first sign-in.

Auth0 access tokens for a custom API audience only carry 'sub' (and scopes)
by default -- 'email'/'name' are NOT included unless an Auth0 Action adds
them as custom claims (namespaced, e.g. "https://chronos.app/email"). See
CLAUDE.md for the Action that needs to exist on the tenant for this to work.
"""
import datetime

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.config import AUTH0_AUDIENCE, AUTH0_DOMAIN
from app.db import get_session
from shared.models import Usuario

CLAIMS_NAMESPACE = "https://chronos.app/"

_jwks_client = jwt.PyJWKClient(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
_bearer = HTTPBearer()


def _decode_token(token: str) -> dict:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"invalid token: {exc}"
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: Session = Depends(get_session),
) -> Usuario:
    claims = _decode_token(credentials.credentials)
    sub = claims["sub"]

    usuario = session.exec(select(Usuario).where(Usuario.auth0_sub == sub)).first()
    if usuario is not None:
        return usuario

    usuario = Usuario(
        auth0_sub=sub,
        email=claims.get("email") or claims.get(f"{CLAIMS_NAMESPACE}email", ""),
        nombre=claims.get("name") or claims.get(f"{CLAIMS_NAMESPACE}name"),
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    return usuario
