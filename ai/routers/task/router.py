from fastapi import APIRouter
from .schemas import SessionTasks
router = APIRouter(
    prefix='/session_tasks',
    tags=['session']
)

@router.get('')
def get_all_session_tasks():
    return {
        'id': 1,
        'human': [
            {
                'name': 'Huy',
                'embedding': 2,
            },
            {
                'name': 'Huy2',
                'embedding': 22,
            },
            {
                'name': 'Huy3',
                'embedding': 23,
            }
        ]
    }
