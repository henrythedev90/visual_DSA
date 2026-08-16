"""Merge sort trace generator.

Recursive divide-and-conquer: split the array in half until pieces are
length 1, then merge sorted halves back together.

All recursive calls share one backing array so the frontend can render a
single bar chart. Each step tags the current `[lo, hi)` slice as
`active_range` (the frontend dims everything outside it). During a merge,
the write position and the two values being chosen between are `merging`.

Elements are only in their *global* final position after the top-level
merge, so `sorted` is reserved for that last step.
"""

from typing import Dict, Iterator, List


def _highlights(
    pairs: List[tuple[int, str]],
    lo: int,
    hi: int,
) -> List[Dict]:
    """Explicit roles first, then `active_range` for the rest of [lo, hi)."""
    occupied = {index for index, _ in pairs}
    result = [{"index": index, "role": role} for index, role in pairs]
    for index in range(lo, hi):
        if index not in occupied:
            result.append({"index": index, "role": "active_range"})
    return result


def trace_merge_sort(arr: List[int]) -> Iterator[Dict]:
    a = list(arr)
    n = len(a)
    comparisons = 0
    swaps = 0  # counted as placements into the backing array

    yield {
        "array": list(a),
        "highlights": _highlights([], 0, n),
        "message": f"Starting merge sort on {n} elements",
        "focus": "start",
        "comparisons": comparisons,
        "swaps": swaps,
    }

    def merge(lo: int, mid: int, hi: int) -> Iterator[Dict]:
        nonlocal comparisons, swaps
        left = a[lo:mid]
        right = a[mid:hi]
        i = 0
        j = 0
        k = lo

        yield {
            "array": list(a),
            "highlights": _highlights([], lo, hi),
            "message": (
                f"Merging {left} and {right}"
            ),
            "focus": "merge",
            "comparisons": comparisons,
            "swaps": swaps,
        }

        while i < len(left) and j < len(right):
            comparisons += 1
            left_val, right_val = left[i], right[j]
            yield {
                "array": list(a),
                "highlights": _highlights([(k, "merging")], lo, hi),
                "message": f"Comparing {left_val} and {right_val}",
                "focus": "compare",
                "comparisons": comparisons,
                "swaps": swaps,
            }

            if left_val <= right_val:
                a[k] = left_val
                chosen = left_val
                i += 1
            else:
                a[k] = right_val
                chosen = right_val
                j += 1
            swaps += 1
            yield {
                "array": list(a),
                "highlights": _highlights([(k, "merging")], lo, hi),
                "message": f"Placed {chosen} at index {k}",
                "focus": "place",
                "comparisons": comparisons,
                "swaps": swaps,
            }
            k += 1

        while i < len(left):
            a[k] = left[i]
            swaps += 1
            yield {
                "array": list(a),
                "highlights": _highlights([(k, "merging")], lo, hi),
                "message": f"Placed remaining {left[i]} at index {k}",
                "focus": "remainder",
                "comparisons": comparisons,
                "swaps": swaps,
            }
            i += 1
            k += 1

        while j < len(right):
            a[k] = right[j]
            swaps += 1
            yield {
                "array": list(a),
                "highlights": _highlights([(k, "merging")], lo, hi),
                "message": f"Placed remaining {right[j]} at index {k}",
                "focus": "remainder",
                "comparisons": comparisons,
                "swaps": swaps,
            }
            j += 1
            k += 1

        yield {
            "array": list(a),
            "highlights": _highlights([], lo, hi),
            "message": f"Merged subarray [{lo}, {hi}) is now {a[lo:hi]}",
            "focus": "merged",
            "comparisons": comparisons,
            "swaps": swaps,
        }

    def sort_range(lo: int, hi: int) -> Iterator[Dict]:
        nonlocal comparisons, swaps
        length = hi - lo
        if length <= 1:
            if length == 1:
                yield {
                    "array": list(a),
                    "highlights": _highlights([(lo, "merging")], lo, hi),
                    "message": f"{a[lo]} is a run of length 1 — already sorted",
                    "focus": "base",
                    "comparisons": comparisons,
                    "swaps": swaps,
                }
            return

        mid = (lo + hi) // 2
        yield {
            "array": list(a),
            "highlights": _highlights([], lo, hi),
            "message": f"Splitting indices [{lo}, {hi}) at {mid}",
            "focus": "split",
            "comparisons": comparisons,
            "swaps": swaps,
        }
        yield from sort_range(lo, mid)
        yield from sort_range(mid, hi)
        yield from merge(lo, mid, hi)

    yield from sort_range(0, n)

    yield {
        "array": list(a),
        "highlights": [{"index": i, "role": "sorted"} for i in range(n)],
        "message": "Merge sort complete",
        "focus": "done",
        "comparisons": comparisons,
        "swaps": swaps,
    }
