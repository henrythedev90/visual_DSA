"""Singly linked list trace generators.

Registry ids: `singly-<operation>` (see algorithms/__init__.py).
"""

from typing import Dict, Iterator, List, Optional

from app.algorithms.list_ops import (
    trace_delete,
    trace_insert_head,
    trace_insert_index,
    trace_insert_tail,
    trace_reverse,
    trace_search,
)


def trace_singly_insert_head(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_head(
        values, operation_value, operation_index, doubly=False
    )


def trace_singly_insert_tail(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_tail(
        values, operation_value, operation_index, doubly=False
    )


def trace_singly_insert_index(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_index(
        values, operation_value, operation_index, doubly=False
    )


def trace_singly_delete(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_delete(values, operation_value, operation_index, doubly=False)


def trace_singly_search(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_search(values, operation_value, operation_index, doubly=False)


def trace_singly_reverse(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_reverse(values, operation_value, operation_index, doubly=False)
