from services.data_service import get_project_by_id
from services.project_analyzer import analyze_project
from services.gemini_service import generate_investigation


project = get_project_by_id("MPLAD-003")

if project is None:
    print("Project not found")
    exit()

analysis = analyze_project(project)

print("\n===================================")
print("       TRISHUL AI INVESTIGATION")
print("===================================\n")

print(f"Project: {analysis['project_name']}")
print(f"Risk Score: {analysis['risk_score']}")
print(f"Severity: {analysis['severity']}")

print("\nGenerating Gemini investigation...\n")

report = generate_investigation(analysis)

print(report)