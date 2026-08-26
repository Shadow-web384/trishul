import json
from pathlib import Path


DATA_PATH = Path(__file__).parent.parent / "data" / "projects.json"


def load_projects():
    """Load all projects from the JSON dataset."""
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def get_all_projects():
    """Return all projects."""
    return load_projects()


def get_project_by_id(project_id):
    """Return a single project by ID."""
    projects = load_projects()

    for project in projects:
        if project["project_id"] == project_id:
            return project

    return None


def get_projects_by_district(district):
    """Return projects belonging to a district."""
    projects = load_projects()

    return [
        project
        for project in projects
        if project["district"].lower() == district.lower()
    ]


def get_projects_by_state(state):
    """Return projects belonging to a state."""
    projects = load_projects()

    return [
        project
        for project in projects
        if project["state"].lower() == state.lower()
    ]