from fastapi import APIRouter
from .schema import SessionTasks
router = APIRouter(
    prefix='/tasks',
    tags=['Task']
)

@router.get('')
def get_all_tasks():
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
