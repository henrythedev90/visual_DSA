"""Shared snapshot helpers for node/pointer traces (linked lists now; queues later).

Nodes keep stable string ids. Spatial order (`order`) is independent of
`next`/`prev` so a reverse can rewire arrows without shuffling boxes.
"""

from typing import Dict, List, Optional


def new_id(counter: List[int]) -> str:
    counter[0] += 1
    return f"n{counter[0]}"


def build_chain(
    values: List[int],
    doubly: bool,
    counter: List[int],
) -> tuple[Dict[str, dict], List[str], Optional[str], Optional[str]]:
    store: Dict[str, dict] = {}
    order: List[str] = []
    prev_id: Optional[str] = None
    for value in values:
        nid = new_id(counter)
        store[nid] = {"value": value, "next": None, "prev": None}
        if prev_id is not None:
            store[prev_id]["next"] = nid
            if doubly:
                store[nid]["prev"] = prev_id
        order.append(nid)
        prev_id = nid
    head_id = order[0] if order else None
    tail_id = order[-1] if order else None
    return store, order, head_id, tail_id


def set_next(store: Dict[str, dict], node_id: str, new_target: Optional[str]) -> dict:
    old = store[node_id].get("next")
    store[node_id]["next"] = new_target
    return {
        "node_id": node_id,
        "pointer": "next",
        "old_target": old,
        "new_target": new_target,
    }


def set_prev(store: Dict[str, dict], node_id: str, new_target: Optional[str]) -> dict:
    old = store[node_id].get("prev")
    store[node_id]["prev"] = new_target
    return {
        "node_id": node_id,
        "pointer": "prev",
        "old_target": old,
        "new_target": new_target,
    }


def snapshot(
    store: Dict[str, dict],
    order: List[str],
    head_id: Optional[str],
    tail_id: Optional[str],
    highlights: Dict[str, str],
    message: str,
    focus: str,
    doubly: bool,
    pointer_changes: Optional[List[dict]] = None,
) -> dict:
    nodes = []
    for nid in order:
        node = store[nid]
        payload = {
            "id": nid,
            "value": node["value"],
            "next_id": node.get("next"),
            "highlight": highlights.get(nid, "default"),
        }
        if doubly:
            payload["prev_id"] = node.get("prev")
        nodes.append(payload)
    return {
        "nodes": nodes,
        "head_id": head_id,
        "tail_id": tail_id,
        "message": message,
        "pointer_changes": pointer_changes or [],
        "focus": focus,
    }
