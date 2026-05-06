"""Project Y — Module C: Telemetry & Cost Analytics.

Persists token usage per call and computes dashboard aggregations
(monthly spend, local vs cloud split, ROI / savings).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from models import UsageLog
from config import get_settings


def log_usage(
    session: Session,
    *,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> UsageLog:
    """Persist a single usage record and return it."""
    settings = get_settings()

    # Local calls are free; cloud calls use configured pricing
    if provider == "local":
        cost = 0.0
    else:
        cost = (
            (prompt_tokens / 1000) * settings.cloud_input_price
            + (completion_tokens / 1000) * settings.cloud_output_price
        )

    entry = UsageLog(
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        cost_usd=round(cost, 6),  # type: ignore
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def get_dashboard_data(session: Session) -> dict:
    """Aggregate telemetry for the frontend dashboard."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # --- Monthly totals ---
    monthly_logs = session.exec(
        select(UsageLog).where(UsageLog.created_at >= month_start)
    ).all()

    monthly_cost = sum(log.cost_usd for log in monthly_logs)
    monthly_tokens_local = sum(
        log.total_tokens for log in monthly_logs if log.provider == "local"
    )
    monthly_tokens_cloud = sum(
        log.total_tokens for log in monthly_logs if log.provider == "cloud"
    )

    # --- ROI Calculation ---
    # "What would these local tokens have cost on the cloud?"
    settings = get_settings()
    avg_price_per_token = (settings.cloud_input_price + settings.cloud_output_price) / 2 / 1000
    estimated_savings = round(monthly_tokens_local * avg_price_per_token, 4)

    # --- Daily breakdown (last 30 days) for the savings chart ---
    thirty_days_ago = now - timedelta(days=30)
    recent_logs = session.exec(
        select(UsageLog).where(UsageLog.created_at >= thirty_days_ago)
    ).all()

    daily_savings: dict[str, float] = {}
    for log in recent_logs:
        day_key = log.created_at.strftime("%Y-%m-%d")
        if log.provider == "local":
            daily_savings[day_key] = daily_savings.get(day_key, 0) + round(
                log.total_tokens * avg_price_per_token, 6
            )

    # --- All-time totals ---
    all_logs = session.exec(select(UsageLog)).all()
    all_time_cost = sum(log.cost_usd for log in all_logs)
    all_time_local = sum(log.total_tokens for log in all_logs if log.provider == "local")
    all_time_cloud = sum(log.total_tokens for log in all_logs if log.provider == "cloud")
    all_time_savings = round(all_time_local * avg_price_per_token, 4)

    return {
        "total_tokens": all_time_local + all_time_cloud,
        "prompt_tokens": sum(log.prompt_tokens for log in all_logs),
        "completion_tokens": sum(log.completion_tokens for log in all_logs),
        "monthly": {
            "cost_usd": round(monthly_cost, 4),
            "tokens_local": monthly_tokens_local,
            "tokens_cloud": monthly_tokens_cloud,
            "estimated_savings_usd": estimated_savings,
        },
        "all_time": {
            "cost_usd": round(all_time_cost, 4),
            "tokens_local": all_time_local,
            "tokens_cloud": all_time_cloud,
            "estimated_savings_usd": all_time_savings,
        },
        "daily_savings": daily_savings,
    }
