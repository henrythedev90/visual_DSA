"""Algorithm registry.

Routes and the frontend never hard-code algorithm ids. Adding a new
visualizer is: write `trace_<name>()`, then register it here.
"""

from typing import Any, Callable, Dict

from app.algorithms.bubble_sort import trace_bubble_sort
from app.algorithms.insertion_sort import trace_insertion_sort
from app.algorithms.merge_sort import trace_merge_sort
from app.algorithms.quick_sort import trace_quick_sort

# Each entry is the metadata the UI needs plus the generator that produces
# a step dict at every visually meaningful moment (comparison, swap, etc.).
ALGORITHM_REGISTRY: Dict[str, Dict[str, Any]] = {
    "bubble-sort": {
        "name": "Bubble Sort",
        "category": "sorting",
        "description": (
            "Repeatedly compares adjacent pairs and swaps them if they are "
            "out of order. After each pass the next-largest value is in "
            "its final position. Simple, but O(n²) comparisons."
        ),
        "trace_fn": trace_bubble_sort,
    },
    "insertion-sort": {
        "name": "Insertion Sort",
        "category": "sorting",
        "description": (
            "Grows a sorted prefix from left to right. Each new value is "
            "shifted into place — like sorting a hand of cards. Fast on "
            "nearly-sorted input; still O(n²) in the worst case."
        ),
        "trace_fn": trace_insertion_sort,
    },
    "merge-sort": {
        "name": "Merge Sort",
        "category": "sorting",
        "description": (
            "Divide-and-conquer: split the array in half, sort each half, "
            "then merge the two sorted runs. Always O(n log n), at the "
            "cost of extra memory for the merge."
        ),
        "trace_fn": trace_merge_sort,
    },
    "quick-sort": {
        "name": "Quick Sort",
        "category": "sorting",
        "description": (
            "Pick a pivot, partition smaller values to its left and larger "
            "to its right, then recurse. Average O(n log n); worst case "
            "O(n²) if pivots are consistently poor."
        ),
        "trace_fn": trace_quick_sort,
    },
}


def get_trace_fn(algorithm_id: str) -> Callable:
    return ALGORITHM_REGISTRY[algorithm_id]["trace_fn"]
