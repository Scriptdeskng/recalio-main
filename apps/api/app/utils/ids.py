from uuid import uuid4


def new_id() -> str:
    return str(uuid4())


def new_public_id(prefix: str = "chl") -> str:
    return f"{prefix}_{uuid4().hex[:12]}"
