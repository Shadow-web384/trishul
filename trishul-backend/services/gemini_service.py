import os
import json
from dotenv import load_dotenv
from google import genai


load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

# NOTE: We do NOT raise here so the backend can start without a Gemini key.
# The key is validated lazily inside generate_investigation() so all other
# endpoints remain available even when the AI feature is unconfigured.

_client = None


def _get_client():
    """Return a cached Gemini client, initialising it on first use."""
    global _client, API_KEY
    if _client is None:
        if not API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set in trishul-backend/.env. "
                "Add it to enable the AI investigation feature."
            )
        _client = genai.Client(api_key=API_KEY)
    return _client


def generate_investigation(project_analysis):

    prompt = f"""
You are Trishul, an AI-assisted monitoring system for
MPLAD Scheme implementation.

Analyze the following project evidence.

IMPORTANT RULES:
- Do not claim that fraud has definitely occurred.
- Treat anomalies as risk indicators requiring verification.
- Do not invent facts.
- Use only the provided project information.
- Give practical investigation recommendations.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add ```json or ``` around the response.

PROJECT DATA:

Project ID: {project_analysis["project_id"]}
Project Name: {project_analysis["project_name"]}
State: {project_analysis["state"]}
District: {project_analysis["district"]}
Sector: {project_analysis["sector"]}

Sanctioned Amount: {project_analysis["sanctioned_amount"]}
Released Amount: {project_analysis["released_amount"]}
Utilized Amount: {project_analysis["utilized_amount"]}

Physical Progress: {project_analysis["physical_progress"]}%
Financial Progress: {project_analysis["financial_progress"]}%

Status: {project_analysis["status"]}
Inspection Status: {project_analysis["inspection_status"]}
Days Since Last Inspection: {project_analysis["last_inspection_days"]}

Risk Score: {project_analysis["risk_score"]}
Risk Severity: {project_analysis["severity"]}

Detected Anomalies:
{project_analysis["anomalies"]}


Return exactly this JSON structure:

{{
    "summary": "Short explanation of the overall situation.",
    "key_findings": [
        "Finding 1",
        "Finding 2",
        "Finding 3"
    ],
    "risk_explanation": "Explain why the project received its risk score.",
    "recommended_actions": [
        "Action 1",
        "Action 2",
        "Action 3"
    ],
    "priority": "LOW"
}}

The priority must be one of:
LOW, MEDIUM, HIGH, CRITICAL.
"""

    response = _get_client().models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "summary": response.text,
            "key_findings": [],
            "risk_explanation": "",
            "recommended_actions": [],
            "priority": project_analysis["severity"]
    }