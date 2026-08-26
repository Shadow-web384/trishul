from services.anomaly_engine import detect_anomalies
from services.risk_engine import calculate_risk


def analyze_project(project):

    anomalies = detect_anomalies(project)

    risk = calculate_risk(anomalies)

    return {
        "project_id": project["project_id"],
        "project_name": project["project_name"],
        "state": project["state"],
        "district": project["district"],
        "sector": project["sector"],

        "sanctioned_amount": project["sanctioned_amount"],
        "released_amount": project["released_amount"],
        "utilized_amount": project["utilized_amount"],

        "physical_progress": project["physical_progress"],
        "financial_progress": project["financial_progress"],

        "status": project["status"],
        "inspection_status": project["inspection_status"],
        "last_inspection_days": project["last_inspection_days"],

        "contractor": project["contractor"],

        "anomalies": anomalies,

        "risk_score": risk["risk_score"],
        "severity": risk["severity"]
    }