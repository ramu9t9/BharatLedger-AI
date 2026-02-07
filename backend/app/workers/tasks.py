"""
Celery tasks for async invoice processing.
Wire in main.py to enqueue process_invoice_task(invoice_id) after upload instead of sync.
"""
from app.core.config import settings

# Celery app stub - uncomment and use when Redis is required for queue
# from celery import Celery
# celery_app = Celery("bharatledger", broker=settings.redis_url, backend=settings.redis_url)
# @celery_app.task
# def process_invoice_task(invoice_id: str):
#     ...
pass
