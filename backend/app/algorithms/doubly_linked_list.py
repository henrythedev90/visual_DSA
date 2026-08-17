"""Doubly linked list trace generators.

Same six operations as the singly file, but every `prev` reassignment is its
own yielded step so both directions are visible.
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


def trace_doubly_insert_head(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_head(
        values, operation_value, operation_index, doubly=True
    )


def trace_doubly_insert_tail(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_tail(
        values, operation_value, operation_index, doubly=True
    )


def trace_doubly_insert_index(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_insert_index(
        values, operation_value, operation_index, doubly=True
    )


def trace_doubly_delete(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_delete(values, operation_value, operation_index, doubly=True)


def trace_doubly_search(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_search(values, operation_value, operation_index, doubly=True)


def trace_doubly_reverse(
    values: List[int],
    operation_value: Optional[int] = None,
    operation_index: Optional[int] = None,
) -> Iterator[Dict]:
    yield from trace_reverse(values, operation_value, operation_index, doubly=True)
