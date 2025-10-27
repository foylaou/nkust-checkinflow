from fastapi import APIRouter, status

from backend.dto.systemdto import systemHealthresponce

router = APIRouter(prefix="/api/v1/system", tags=["系統檢測"])


@router.get(
    "/health",
    response_model=systemHealthresponce,
    status_code=status.HTTP_200_OK,
)
async def get_system() -> systemHealthresponce:
    return systemHealthresponce()
