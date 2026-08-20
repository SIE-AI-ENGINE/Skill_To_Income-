from datetime import datetime, timezone
from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.sie import (
    CreateProjectBody,
    DeployProjectBody,
    DeploymentResponse,
    FeedbackBody,
    FeedbackResponse,
    HistoryEntry,
    ProjectResponse,
)

router = APIRouter()
projects: List[ProjectResponse] = []
deployments: List[DeploymentResponse] = []
feedback_entries: List[FeedbackResponse] = []
history_entries: List[HistoryEntry] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/projects", response_model=List[ProjectResponse], tags=["Projects"])
def list_projects():
    return projects


@router.post("/projects", response_model=ProjectResponse, status_code=201, tags=["Projects"])
def create_project(payload: CreateProjectBody):
    project = ProjectResponse(
        id=f"project-{uuid4().hex[:12]}",
        name=payload.name,
        description=payload.description,
        opportunityId=payload.opportunityId,
        status="Draft",
        createdAt=_now(),
    )
    projects.append(project)
    history_entries.append(HistoryEntry(id=f"history-{uuid4().hex[:12]}", action="project.created", resourceId=project.id, createdAt=project.createdAt))
    return project


@router.post("/deploy", response_model=DeploymentResponse, status_code=202, tags=["Deployments"])
def deploy_project(payload: DeployProjectBody):
    if not any(project.id == payload.projectId for project in projects):
        raise HTTPException(status_code=404, detail="Project not found")
    deployment = DeploymentResponse(
        id=f"deployment-{uuid4().hex[:12]}",
        projectId=payload.projectId,
        status="Queued",
        createdAt=_now(),
    )
    deployments.append(deployment)
    history_entries.append(HistoryEntry(id=f"history-{uuid4().hex[:12]}", action="deployment.queued", resourceId=deployment.id, createdAt=deployment.createdAt))
    return deployment


@router.get("/history", response_model=List[HistoryEntry], tags=["History"])
def get_history():
    return history_entries


@router.post("/feedback", response_model=FeedbackResponse, status_code=201, tags=["Feedback"])
def create_feedback(payload: FeedbackBody):
    entry = FeedbackResponse(id=f"feedback-{uuid4().hex[:12]}", createdAt=_now(), **payload.model_dump())
    feedback_entries.append(entry)
    history_entries.append(HistoryEntry(id=f"history-{uuid4().hex[:12]}", action="feedback.created", resourceId=entry.id, createdAt=entry.createdAt))
    return entry