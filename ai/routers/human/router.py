from fastapi import APIRouter

router = APIRouter(
    prefix='/humans',
    tags=['Human']
)


@router.get('')
async def get_all_humans():
    return "get all humans"