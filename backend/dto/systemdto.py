from pydantic import BaseModel
from setuptools.msvc import SystemInfo


class systemHealthresponce(BaseModel):
    isHealthy: bool
    info: SystemInfo
