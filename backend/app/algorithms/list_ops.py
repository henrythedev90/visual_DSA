"""Parameterized linked-list operations.

Singly and doubly variants share this control flow. Doubly traces yield a
separate step for every `prev` reassignment — never bundled with `next`.
"""

from typing import Dict, Iterator, List, Optional

from app.algorithms.list_common import (
    build_chain,
    new_id,
    set_next,
    set_prev,
    snapshot,
)


class ListState:
    def __init__(self, values: List[int], doubly: bool) -> None:
        self.doubly = doubly
        self.counter = [0]
        self.store, self.order, self.head, self.tail = build_chain(
            values, doubly, self.counter
        )

    def snap(
        self,
        message: str,
        focus: str,
        highlights: Optional[Dict[str, str]] = None,
        changes: Optional[List[dict]] = None,
    ) -> dict:
        return snapshot(
            self.store,
            self.order,
            self.head,
            self.tail,
            highlights or {},
            message,
            focus,
            self.doubly,
            changes,
        )

    def create(self, value: int, at: int) -> str:
        nid = new_id(self.counter)
        self.store[nid] = {"value": value, "next": None, "prev": None}
        self.order.insert(at, nid)
        return nid

    def drop(self, nid: str) -> None:
        self.order.remove(nid)
        del self.store[nid]

    def walk_ids(self) -> List[str]:
        ids: List[str] = []
        cur = self.head
        seen: set[str] = set()
        while cur and cur not in seen:
            seen.add(cur)
            ids.append(cur)
            cur = self.store[cur].get("next")
        return ids


def _kind(doubly: bool) -> str:
    return "doubly" if doubly else "singly"


def trace_insert_head(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,  # noqa: ARG001 — shared registry signature
    *,
    doubly: bool,
) -> Iterator[Dict]:
    state = ListState(values, doubly)
    value = int(operation_value)
    yield state.snap(
        f"Insert {value} at the head of a {_kind(doubly)} linked list",
        "start",
    )

    nid = state.create(value, 0)
    yield state.snap(
        f"Created node {nid} with value {value}",
        "create",
        highlights={nid: "new"},
    )

    old_head = state.head
    change = set_next(state.store, nid, old_head)
    yield state.snap(
        f"{nid}.next → {old_head or 'null'} (old head)",
        "link_next",
        highlights={nid: "new", **({old_head: "current"} if old_head else {})},
        changes=[change],
    )

    if doubly and old_head:
        change = set_prev(state.store, old_head, nid)
        yield state.snap(
            f"{old_head}.prev → {nid} (new head)",
            "link_prev",
            highlights={nid: "new", old_head: "current"},
            changes=[change],
        )

    state.head = nid
    if state.tail is None:
        state.tail = nid
    yield state.snap(
        f"head → {nid}",
        "update_head",
        highlights={nid: "new"},
    )
    yield state.snap(f"Inserted {value} at head", "done", highlights={nid: "new"})


def trace_insert_tail(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,  # noqa: ARG001
    *,
    doubly: bool,
) -> Iterator[Dict]:
    state = ListState(values, doubly)
    value = int(operation_value)
    yield state.snap(
        f"Insert {value} at the tail of a {_kind(doubly)} linked list",
        "start",
    )

    if state.head is None:
        nid = state.create(value, 0)
        yield state.snap(
            f"Created node {nid} with value {value}",
            "create",
            highlights={nid: "new"},
        )
        state.head = nid
        state.tail = nid
        yield state.snap(
            f"Empty list — head and tail → {nid}",
            "update_head",
            highlights={nid: "new"},
        )
        yield state.snap(f"Inserted {value} at tail", "done", highlights={nid: "new"})
        return

    # Singly lists have no usable tail pointer for the walk; we scan to the end.
    # Doubly lists still walk so the visualization matches, then link via tail.
    if not doubly:
        cur = state.head
        while True:
            yield state.snap(
                f"Walking: {cur} = {state.store[cur]['value']}",
                "walk",
                highlights={cur: "current"},
            )
            nxt = state.store[cur].get("next")
            if nxt is None:
                break
            cur = nxt
        last = cur
    else:
        last = state.tail
        assert last is not None
        yield state.snap(
            f"Tail pointer already at {last} = {state.store[last]['value']}",
            "walk",
            highlights={last: "current"},
        )

    nid = state.create(value, len(state.order))
    # create() appended; last was already in order so new node is at the end. Good.
    yield state.snap(
        f"Created node {nid} with value {value}",
        "create",
        highlights={nid: "new", last: "current"},
    )

    change = set_next(state.store, last, nid)
    yield state.snap(
        f"{last}.next → {nid}",
        "link_next",
        highlights={nid: "new", last: "current"},
        changes=[change],
    )

    if doubly:
        change = set_prev(state.store, nid, last)
        yield state.snap(
            f"{nid}.prev → {last}",
            "link_prev",
            highlights={nid: "new", last: "current"},
            changes=[change],
        )

    state.tail = nid
    yield state.snap(
        f"tail → {nid}",
        "update_tail",
        highlights={nid: "new"},
    )
    yield state.snap(f"Inserted {value} at tail", "done", highlights={nid: "new"})


def trace_insert_index(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
    *,
    doubly: bool,
) -> Iterator[Dict]:
    index = int(operation_index)
    if index == 0:
        yield from trace_insert_head(values, operation_value, doubly=doubly)
        return
    if index == len(values):
        yield from trace_insert_tail(values, operation_value, doubly=doubly)
        return

    state = ListState(values, doubly)
    value = int(operation_value)
    yield state.snap(
        f"Insert {value} at index {index}",
        "start",
    )

    pred = state.head
    for i in range(index):
        assert pred is not None
        yield state.snap(
            f"Walk to predecessor: index {i} → {pred} = {state.store[pred]['value']}",
            "walk",
            highlights={pred: "current"},
        )
        if i < index - 1:
            pred = state.store[pred].get("next")

    assert pred is not None
    old_next = state.store[pred].get("next")
    nid = state.create(value, index)
    yield state.snap(
        f"Created node {nid} with value {value} (splice after {pred})",
        "create",
        highlights={nid: "new", pred: "current", **({old_next: "target"} if old_next else {})},
    )

    change = set_next(state.store, nid, old_next)
    yield state.snap(
        f"{nid}.next → {old_next or 'null'}",
        "link_next",
        highlights={nid: "new", pred: "current", **({old_next: "target"} if old_next else {})},
        changes=[change],
    )

    if doubly:
        change = set_prev(state.store, nid, pred)
        yield state.snap(
            f"{nid}.prev → {pred}",
            "link_prev",
            highlights={nid: "new", pred: "current"},
            changes=[change],
        )
        if old_next:
            change = set_prev(state.store, old_next, nid)
            yield state.snap(
                f"{old_next}.prev → {nid}",
                "link_prev",
                highlights={nid: "new", old_next: "target"},
                changes=[change],
            )

    change = set_next(state.store, pred, nid)
    yield state.snap(
        f"{pred}.next → {nid}",
        "splice",
        highlights={nid: "new", pred: "current"},
        changes=[change],
    )
    yield state.snap(
        f"Inserted {value} at index {index}",
        "done",
        highlights={nid: "new"},
    )


def trace_delete(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,  # noqa: ARG001
    *,
    doubly: bool,
) -> Iterator[Dict]:
    state = ListState(values, doubly)
    value = int(operation_value)
    yield state.snap(f"Delete the first node with value {value}", "start")

    pred: Optional[str] = None
    cur = state.head
    while cur:
        node_val = state.store[cur]["value"]
        yield state.snap(
            f"Checking {cur} = {node_val}",
            "compare",
            highlights={cur: "comparing", **({pred: "current"} if pred else {})},
        )
        if node_val == value:
            break
        pred = cur
        cur = state.store[cur].get("next")

    if cur is None:
        yield state.snap(f"{value} was not in the list", "not_found")
        yield state.snap("Delete finished — no change", "done")
        return

    nxt = state.store[cur].get("next")
    prv = state.store[cur].get("prev") if doubly else pred

    yield state.snap(
        f"Found {value} at {cur} — unlinking",
        "compare",
        highlights={cur: "target", **({pred: "current"} if pred else {})},
    )

    if pred is None:
        state.head = nxt
        yield state.snap(
            f"head → {nxt or 'null'} (deleted the old head)",
            "unlink_next",
            highlights={cur: "target", **({nxt: "current"} if nxt else {})},
        )
    else:
        change = set_next(state.store, pred, nxt)
        yield state.snap(
            f"{pred}.next → {nxt or 'null'} (skip {cur})",
            "unlink_next",
            highlights={cur: "target", pred: "current", **({nxt: "current"} if nxt else {})},
            changes=[change],
        )

    if doubly:
        if nxt:
            change = set_prev(state.store, nxt, prv)
            yield state.snap(
                f"{nxt}.prev → {prv or 'null'}",
                "unlink_prev",
                highlights={cur: "target", nxt: "current"},
                changes=[change],
            )
        if state.tail == cur:
            state.tail = prv
            yield state.snap(
                f"tail → {prv or 'null'}",
                "update_tail",
                highlights={cur: "target", **({prv: "current"} if prv else {})},
            )
    elif state.tail == cur:
        state.tail = pred
        yield state.snap(
            f"tail → {pred or 'null'}",
            "update_tail",
            highlights={cur: "target", **({pred: "current"} if pred else {})},
        )

    yield state.snap(
        f"{cur} is unlinked — fading out",
        "removed",
        highlights={cur: "removed"},
    )
    state.drop(cur)
    yield state.snap(f"Removed {value} from the list", "drop")
    yield state.snap("Delete complete", "done")


def trace_search(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,  # noqa: ARG001
    *,
    doubly: bool,
) -> Iterator[Dict]:
    state = ListState(values, doubly)
    value = int(operation_value)
    yield state.snap(
        f"Search for {value} ({_kind(doubly)} list — walk next pointers)",
        "start",
    )

    cur = state.head
    while cur:
        node_val = state.store[cur]["value"]
        yield state.snap(
            f"Checking {cur} = {node_val}",
            "compare",
            highlights={cur: "comparing"},
        )
        if node_val == value:
            yield state.snap(
                f"Found {value} at {cur}",
                "found",
                highlights={cur: "target"},
            )
            yield state.snap(f"Search complete — {value} is in the list", "done", highlights={cur: "target"})
            return
        cur = state.store[cur].get("next")

    yield state.snap(f"{value} is not in the list", "not_found")
    yield state.snap("Search complete", "done")


def trace_reverse(
    values: List[int],
    operation_value: Optional[int] = None,  # noqa: ARG001
    operation_index: Optional[int] = None,  # noqa: ARG001
    *,
    doubly: bool,
) -> Iterator[Dict]:
    state = ListState(values, doubly)
    yield state.snap(
        f"Reverse a {_kind(doubly)} linked list one pointer at a time",
        "start",
    )

    if state.head is None or state.store[state.head].get("next") is None:
        yield state.snap("Zero or one node — already reversed", "done")
        return

    old_head = state.head
    prev: Optional[str] = None
    curr = state.head

    while curr:
        nxt = state.store[curr].get("next")
        yield state.snap(
            f"At {curr}; saved next = {nxt or 'null'}",
            "save",
            highlights={
                curr: "current",
                **({prev: "comparing"} if prev else {}),
                **({nxt: "target"} if nxt else {}),
            },
        )

        change = set_next(state.store, curr, prev)
        yield state.snap(
            f"{curr}.next → {prev or 'null'}",
            "reverse_next",
            highlights={curr: "current", **({prev: "comparing"} if prev else {})},
            changes=[change],
        )

        if doubly:
            old_prev = state.store[curr].get("prev")
            change = set_prev(state.store, curr, nxt)
            yield state.snap(
                f"{curr}.prev → {nxt or 'null'} (was {old_prev or 'null'})",
                "reverse_prev",
                highlights={curr: "current", **({nxt: "target"} if nxt else {})},
                changes=[change],
            )

        prev = curr
        curr = nxt
        yield state.snap(
            f"Advance: prev = {prev}, curr = {curr or 'null'}",
            "advance",
            highlights={prev: "current", **({curr: "target"} if curr else {})},
        )

    state.head = prev
    state.tail = old_head
    yield state.snap(
        f"head → {state.head}, tail → {state.tail}",
        "update_head",
        highlights={state.head: "new"} if state.head else {},
    )
    yield state.snap("Reverse complete", "done")
