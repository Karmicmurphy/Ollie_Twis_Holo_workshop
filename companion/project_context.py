"""Private project intent; never execution authority or worker output."""
from __future__ import annotations

import copy
import json
import re

SCHEMA = "foundation-project-context-v1"
KINDS = {"goal", "correction", "decision", "note", "stop", "resume"}
IDENTITY = re.compile(r"[A-Za-z0-9_-]{8,80}\Z")


class ContextConflict(ValueError):
    pass


def empty_context(project_id):
    return {"schemaVersion": SCHEMA, "projectId": project_id, "events": []}


def project_view(document):
    if (not isinstance(document, dict) or document.get("schemaVersion") != SCHEMA
            or not isinstance(document.get("events"), list)):
        raise ValueError("invalid project context")
    goal = None
    enabled = True
    for event in document["events"]:
        if event["kind"] == "goal":
            goal = {"id": event["eventId"], "text": event["text"], "updatedAt": event["createdAt"]}
        elif event["kind"] == "correction" and goal and event["goalId"] == goal["id"]:
            goal = {**goal, "text": event["text"], "updatedAt": event["createdAt"]}
        elif event["kind"] in {"stop", "resume"}:
            enabled = event["kind"] == "resume"
    return {"projectId": document["projectId"], "goal": goal, "newLocalWorkEnabled": enabled,
            "events": copy.deepcopy(document["events"]), "executionAuthority": "NOT_GRANTED",
            "cancellationConfirmed": False}


def append_event(document, request, created_at):
    allowed = {"eventId", "kind", "text", "goalId", "expectedRevision"}
    if not isinstance(request, dict) or set(request) - allowed:
        raise ValueError("unexpected project context fields")
    if type(request.get("expectedRevision")) is not int or request["expectedRevision"] < 0:
        raise ValueError("nonnegative expectedRevision is required")
    event_id, kind, text = request.get("eventId"), request.get("kind"), request.get("text", "")
    if (not isinstance(event_id, str) or not IDENTITY.fullmatch(event_id)
            or not isinstance(kind, str) or kind not in KINDS):
        raise ValueError("invalid context event identity or kind")
    if not isinstance(text, str) or not text.strip() or len(text) > 4096:
        raise ValueError("context text must contain 1 to 4096 characters")
    try:
        text.encode("utf-8", errors="strict")
    except UnicodeError as exc:
        raise ValueError("context text must be valid UTF-8") from exc
    view = project_view(document)
    goal_id = event_id if kind == "goal" else request.get("goalId", "")
    if not isinstance(goal_id, str) or goal_id and not IDENTITY.fullmatch(goal_id):
        raise ValueError("invalid goal identity")
    event = {"eventId": event_id, "kind": kind, "text": text, "goalId": goal_id,
             "createdAt": created_at}
    for old in document["events"]:
        if old["eventId"] == event_id:
            if any(old[k] != event[k] for k in ("eventId", "kind", "text", "goalId")):
                raise ContextConflict("event identity already has different content")
            return document, True
    if kind == "correction" and (not view["goal"] or goal_id != view["goal"]["id"]):
        raise ContextConflict("correction must name the current goal")
    if len(document["events"]) >= 1000:
        raise ContextConflict("project context event limit reached; archive before appending")
    updated = {**document, "events": [*document["events"], event]}
    if len(json.dumps(updated, ensure_ascii=False).encode("utf-8")) > 256 * 1024:
        raise ContextConflict("project context storage limit reached; archive before appending")
    return updated, False
