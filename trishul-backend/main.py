from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.data_service import get_all_projects, get_project_by_id
from services.project_analyzer import analyze_project
from services.gemini_service import generate_investigation
from services.audit_service import log_event, get_all_events


app = FastAPI(
    title="Trishul API",
    description="AI-powered anomaly and risk detection system for MPLAD Scheme implementation.",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default dev port
        "http://localhost:5174",  # Vite fallback dev port (when 5173 is in use)
        "http://localhost:3000",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request bodies for action endpoints
# --------------------------------------------------

class ActionRequest(BaseModel):
    project_id: str


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "Trishul",
        "message": "Trishul backend is running",
        "status": "online"
    }


# --------------------------------------------------
# FILTERS API (distinct states & districts for dropdowns)
# --------------------------------------------------

@app.get("/api/filters")
def filters():
    projects = get_all_projects()

    states = sorted(set(p["state"] for p in projects))
    districts = sorted(set(p["district"] for p in projects))

    return {
        "states": states,
        "districts": districts,
    }


# --------------------------------------------------
# DASHBOARD API
# --------------------------------------------------

@app.get("/api/dashboard")
def dashboard(
    state: str | None = None,
    district: str | None = None,
):

    projects = get_all_projects()

    analyzed_projects = []
    for project in projects:
        analysis = analyze_project(project)

        if state and analysis["state"].lower() != state.lower():
            continue
        if district and analysis["district"].lower() != district.lower():
            continue

        analyzed_projects.append(analysis)

    total_projects = len(analyzed_projects)

    high_risk_projects = [
        project
        for project in analyzed_projects
        if project["severity"] in ["HIGH", "CRITICAL"]
    ]

    critical_projects = [
        project
        for project in analyzed_projects
        if project["severity"] == "CRITICAL"
    ]

    delayed_projects = [
        project
        for project in analyzed_projects
        if project["status"].lower() == "delayed"
    ]

    total_sanctioned = sum(
        project["sanctioned_amount"]
        for project in analyzed_projects
    )

    total_released = sum(
        project["released_amount"]
        for project in analyzed_projects
    )

    total_utilized = sum(
        project["utilized_amount"]
        for project in analyzed_projects
    )

    return {
        "total_projects": total_projects,
        "high_risk_projects": len(high_risk_projects),
        "critical_projects": len(critical_projects),
        "delayed_projects": len(delayed_projects),

        "total_sanctioned_amount": total_sanctioned,
        "total_released_amount": total_released,
        "total_utilized_amount": total_utilized,

        "projects": analyzed_projects
    }


# --------------------------------------------------
# ALL PROJECTS API
# --------------------------------------------------

@app.get("/api/projects")
def get_projects(
    district: str | None = None,
    state: str | None = None,
    severity: str | None = None,
    status: str | None = None
):
    projects = get_all_projects()

    analyzed_projects = []

    for project in projects:
        analysis = analyze_project(project)

        if district and analysis["district"].lower() != district.lower():
            continue

        if state and analysis["state"].lower() != state.lower():
            continue

        if severity and analysis["severity"].lower() != severity.lower():
            continue

        if status and analysis["status"].lower() != status.lower():
            continue

        analyzed_projects.append(analysis)

    return analyzed_projects


# --------------------------------------------------
# SINGLE PROJECT API
# --------------------------------------------------

@app.get("/api/projects/{project_id}")
def project_details(project_id: str):

    project = get_project_by_id(project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return analyze_project(project)


# --------------------------------------------------
# ALERTS API
# --------------------------------------------------

@app.get("/api/alerts")
def alerts(
    state: str | None = None,
    district: str | None = None,
):

    projects = get_all_projects()

    alert_list = []

    for project in projects:

        result = analyze_project(project)

        # Apply role-based filters
        if state and result["state"].lower() != state.lower():
            continue
        if district and result["district"].lower() != district.lower():
            continue

        for anomaly in result["anomalies"]:

            alert_list.append({
                "project_id": result["project_id"],
                "project_name": result["project_name"],
                "district": result["district"],
                "severity": anomaly["severity"],
                "type": anomaly["type"],
                "message": anomaly["message"],
                "risk_score": result["risk_score"]
            })

    return {
        "total_alerts": len(alert_list),
        "alerts": alert_list
    }


# --------------------------------------------------
# ANALYTICS API (pre-aggregated data)
# --------------------------------------------------

@app.get("/api/analytics")
def analytics(
    state: str | None = None,
    district: str | None = None,
):
    projects = get_all_projects()
    analyzed = []
    for project in projects:
        analysis = analyze_project(project)
        if state and analysis["state"].lower() != state.lower():
            continue
        if district and analysis["district"].lower() != district.lower():
            continue
        analyzed.append(analysis)

    # Risk by district — sum of risk scores per district
    district_map: dict[str, int] = {}
    for p in analyzed:
        district_map[p["district"]] = district_map.get(p["district"], 0) + p["risk_score"]
    risk_by_district = [{"name": k, "value": v} for k, v in district_map.items()]

    # Fund utilization per project
    fund_utilization = []
    for p in analyzed:
        sanctioned = p["sanctioned_amount"]
        utilized = p["utilized_amount"]
        # Convert to Lakhs for display
        allocated_lakhs = round(sanctioned / 100_000, 1)
        utilized_lakhs = round(utilized / 100_000, 1)
        fund_utilization.append({
            "name": f"{p['project_name']} ({p['project_id']})",
            "allocated": allocated_lakhs,
            "utilized": utilized_lakhs,
        })

    # Anomaly categories — count of each anomaly type
    anomaly_map: dict[str, int] = {}
    for p in analyzed:
        for a in p["anomalies"]:
            anomaly_map[a["type"]] = anomaly_map.get(a["type"], 0) + 1
    anomaly_categories = [{"name": k, "value": v} for k, v in anomaly_map.items()]

    # Project status counts
    status_map: dict[str, int] = {}
    for p in analyzed:
        status_map[p["status"]] = status_map.get(p["status"], 0) + 1
    project_status = [{"name": k, "value": v} for k, v in status_map.items()]

    return {
        "riskByDistrict": risk_by_district,
        "fundUtilization": fund_utilization,
        "anomalyCategories": anomaly_categories,
        "projectStatus": project_status,
    }


# --------------------------------------------------
# AUDIT TRAIL API
# --------------------------------------------------

@app.get("/api/audit")
def audit_trail():
    return {
        "events": get_all_events()
    }


# --------------------------------------------------
# AI INVESTIGATION API
# --------------------------------------------------

@app.post("/api/investigate/{project_id}")
def investigate_project(project_id: str):

    project = get_project_by_id(project_id)

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    analysis = analyze_project(project)

    try:
        investigation_report = generate_investigation(analysis)
    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc)
        )

    # Log the AI investigation to the audit trail
    log_event(
        event_type="AI_INVESTIGATION",
        project_id=project_id,
        description=f"AI investigation completed for {analysis['project_name']}. "
                    f"Severity: {analysis['severity']}, Score: {analysis['risk_score']}/100.",
        actor="System AI Engine",
    )

    return {
        "project_id": analysis["project_id"],
        "project_name": analysis["project_name"],
        "risk_score": analysis["risk_score"],
        "severity": analysis["severity"],
        "anomalies": analysis["anomalies"],
        "investigation_report": investigation_report
    }


# --------------------------------------------------
# ACTION ENDPOINTS
# --------------------------------------------------

@app.post("/api/actions/schedule-inspection")
def schedule_inspection(body: ActionRequest):
    project = get_project_by_id(body.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis = analyze_project(project)

    event = log_event(
        event_type="SCHEDULE_INSPECTION",
        project_id=body.project_id,
        description=f"Physical inspection scheduled for {analysis['project_name']} "
                    f"in {analysis['district']}, {analysis['state']}.",
        actor="User",
    )

    return {
        "status": "scheduled",
        "project_id": body.project_id,
        "project_name": analysis["project_name"],
        "district": analysis["district"],
        "state": analysis["state"],
        "message": f"Inspection scheduled for {analysis['project_name']}.",
        "timestamp": event["timestamp"],
    }


@app.post("/api/actions/verify-expenditure")
def verify_expenditure(body: ActionRequest):
    project = get_project_by_id(body.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis = analyze_project(project)

    event = log_event(
        event_type="VERIFY_EXPENDITURE",
        project_id=body.project_id,
        description=f"Expenditure verification initiated for {analysis['project_name']}. "
                    f"Sanctioned: ₹{analysis['sanctioned_amount']:,.0f}, "
                    f"Utilized: ₹{analysis['utilized_amount']:,.0f}.",
        actor="User",
    )

    return {
        "status": "verified",
        "project_id": body.project_id,
        "project_name": analysis["project_name"],
        "sanctioned_amount": analysis["sanctioned_amount"],
        "released_amount": analysis["released_amount"],
        "utilized_amount": analysis["utilized_amount"],
        "physical_progress": analysis["physical_progress"],
        "financial_progress": analysis["financial_progress"],
        "message": f"Expenditure verification initiated for {analysis['project_name']}.",
        "timestamp": event["timestamp"],
    }


@app.post("/api/actions/review-contractor")
def review_contractor(body: ActionRequest):
    project = get_project_by_id(body.project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    analysis = analyze_project(project)

    event = log_event(
        event_type="REVIEW_CONTRACTOR",
        project_id=body.project_id,
        description=f"Contractor review initiated for '{analysis['contractor']}' "
                    f"on project {analysis['project_name']}.",
        actor="User",
    )

    return {
        "status": "reviewed",
        "project_id": body.project_id,
        "project_name": analysis["project_name"],
        "contractor": analysis["contractor"],
        "district": analysis["district"],
        "state": analysis["state"],
        "risk_score": analysis["risk_score"],
        "severity": analysis["severity"],
        "anomalies": analysis["anomalies"],
        "message": f"Contractor review initiated for '{analysis['contractor']}'.",
        "timestamp": event["timestamp"],
    }