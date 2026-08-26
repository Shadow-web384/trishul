def calculate_risk(anomalies):
    """
    Calculate an overall risk score from detected anomalies.
    """

    score = 0

    for anomaly in anomalies:

        anomaly_type = anomaly["type"]

        if anomaly_type == "COST_OVERRUN":
            score += 30

        elif anomaly_type == "PROGRESS_MISMATCH":
            score += 25

        elif anomaly_type == "INSPECTION_OVERDUE":
            score += 15

        elif anomaly_type == "HIGH_SPENDING_LOW_PROGRESS":
            score += 20

        elif anomaly_type == "PROJECT_DELAY":
            score += 10

    # Never allow score above 100
    score = min(score, 100)

    if score >= 75:
        severity = "CRITICAL"

    elif score >= 50:
        severity = "HIGH"

    elif score >= 25:
        severity = "MEDIUM"

    else:
        severity = "LOW"

    return {
        "risk_score": score,
        "severity": severity
    }