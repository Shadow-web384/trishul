from services.data_service import get_all_projects
from services.project_analyzer import analyze_project


projects = get_all_projects()

print("\n===================================")
print("        TRISHUL AI ENGINE")
print("===================================\n")

for project in projects:

    result = analyze_project(project)

    print(
        f"{result['project_id']} | "
        f"{result['project_name']} | "
        f"Risk: {result['risk_score']} | "
        f"{result['severity']}"
    )

    for anomaly in result["anomalies"]:
        print(f"   ⚠ {anomaly['type']}")

    print()