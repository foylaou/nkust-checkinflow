from pydantic import BaseModel
from typing import Optional


class systemHealthresponce(BaseModel):
    isHealthy: bool = True
    info: Optional[str] = "System is running"
