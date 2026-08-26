from datetime import datetime


def detect_anomalies(project):
    """
    Detect suspicious indicators in an MPLADS project.

    Returns a list of detected anomalies.
    """

    anomalies = []

    sanctioned = project["sanctioned_amount"]
    utilized = project["utilized_amount"]

    physical = project["physical_progress"]
    financial = project["financial_progress"]

    inspection_days = project["last_inspection_days"]

    # 1. Cost Overrun
    if utilized > sanctioned:
        overrun_percentage = ((utilized - sanctioned) / sanctioned) * 100

        anomalies.append({
            "type": "COST_OVERRUN",
            "severity": "HIGH",
            "message": (
                f"Utilized amount exceeds sanctioned amount "
                f"by {overrun_percentage:.1f}%."
            ),
            "value": round(overrun_percentage, 2)
        })

    # 2. Progress Mismatch
    progress_gap = financial - physical

    if progress_gap >= 20:
        severity = "HIGH" if progress_gap >= 30 else "MEDIUM"

        anomalies.append({
            "type": "PROGRESS_MISMATCH",
            "severity": severity,
            "message": (
                f"Financial progress is {progress_gap:.1f}% "
                f"higher than physical progress."
            ),
            "value": round(progress_gap, 2)
        })

    # 3. Inspection overdue
    if inspection_days > 60:

        severity = "HIGH" if inspection_days > 90 else "MEDIUM"

        anomalies.append({
            "type": "INSPECTION_OVERDUE",
            "severity": severity,
            "message": (
                f"Last inspection was {inspection_days} days ago."
            ),
            "value": inspection_days
        })

    # 4. High spending with low physical progress
    utilization_percentage = (utilized / sanctioned) * 100

    if utilization_percentage >= 80 and physical < 50:

        anomalies.append({
            "type": "HIGH_SPENDING_LOW_PROGRESS",
            "severity": "HIGH",
            "message": (
                f"{utilization_percentage:.1f}% of sanctioned funds "
                f"utilized while physical progress is only {physical}%."
            ),
            "value": round(utilization_percentage, 2)
        })

    # 5. Delayed project
    if project["status"].lower() == "delayed":

        anomalies.append({
            "type": "PROJECT_DELAY",
            "severity": "MEDIUM",
            "message": "Project is currently marked as delayed.",
            "value": None
        })

    return anomalies