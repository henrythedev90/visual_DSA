"""Bubble sort trace generator.

Bubble sort repeatedly walks adjacent pairs, swapping them when they are out
of order. After pass `i`, the largest remaining value has "bubbled" to index
`n - 1 - i` and is in its final position.

We yield on every comparison, every swap, and whenever a pass finalizes an
element so the frontend can color those bars green (`sorted`).
"""

from typing import Dict, Iterator, List, Set


def _highlights(
    pairs: List[tuple[int, str]],
    sorted_indices: Set[int],
) -> List[Dict]:
    """Build a highlight list. Explicit roles win over `sorted`."""
    occupied = {index for index, _ in pairs}
    result = [{"index": index, "role": role} for index, role in pairs]
    for index in sorted(sorted_indices):
        if index not in occupied:
            result.append({"index": index, "role": "sorted"})
    return result


def trace_bubble_sort(arr: List[int]) -> Iterator[Dict]:
    a = list(arr)
    n = len(a)
    comparisons = 0
    swaps = 0
    sorted_indices: Set[int] = set()

    yield {
        "array": list(a),
        "highlights": [],
        "message": f"Starting bubble sort on {n} elements",
        "focus": "start",
        "comparisons": comparisons,
        "swaps": swaps,
    }

    for pass_num in range(n - 1):
        swapped_this_pass = False
        # Each pass shrinks the unsorted region from the right.
        last_unsorted = n - 1 - pass_num

        for j in range(last_unsorted):
            comparisons += 1
            left, right = a[j], a[j + 1]
            yield {
                "array": list(a),
                "highlights": _highlights(
                    [(j, "comparing"), (j + 1, "comparing")],
                    sorted_indices,
                ),
                "message": f"Comparing {left} and {right}",
                "focus": "compare",
                "comparisons": comparisons,
                "swaps": swaps,
            }

            if left > right:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
                swapped_this_pass = True
                yield {
                    "array": list(a),
                    "highlights": _highlights(
                        [(j, "swapping"), (j + 1, "swapping")],
                        sorted_indices,
                    ),
                    "message": f"Swapped {left} and {right}",
                    "focus": "swap",
                    "comparisons": comparisons,
                    "swaps": swaps,
                }

        # The element that bubbled to the end of this pass is in final position.
        finalized = last_unsorted
        sorted_indices.add(finalized)
        yield {
            "array": list(a),
            "highlights": _highlights([], sorted_indices),
            "message": f"{a[finalized]} is in its final position",
            "focus": "finalize",
            "comparisons": comparisons,
            "swaps": swaps,
        }

        if not swapped_this_pass:
            # Remaining prefix is already sorted — mark it all at once.
            for index in range(finalized):
                sorted_indices.add(index)
            yield {
                "array": list(a),
                "highlights": _highlights([], sorted_indices),
                "message": "No swaps this pass — the rest of the array is already sorted",
                "focus": "already_sorted",
                "comparisons": comparisons,
                "swaps": swaps,
            }
            return

    # After n-1 passes the leftmost element is also in place.
    sorted_indices.add(0)
    yield {
        "array": list(a),
        "highlights": _highlights([], sorted_indices),
        "message": "Bubble sort complete",
        "focus": "done",
        "comparisons": comparisons,
        "swaps": swaps,
    }
