"""Quick sort trace generator.

Lomuto partition: the last element of the current range is the pivot.
Everything smaller than (or equal to) the pivot is swapped to the left
side; then the pivot is swapped into the gap between the two sides —
that index is its *final* position.

Recursive calls then sort the left and right partitions. `active_range`
marks the subarray the current call owns; already-placed pivots stay
green (`sorted`) for the rest of the trace.
"""

from typing import Dict, Iterator, List, Set


def _highlights(
    pairs: List[tuple[int, str]],
    lo: int,
    hi: int,
    sorted_indices: Set[int],
) -> List[Dict]:
    """Priority: explicit roles > sorted > active_range."""
    occupied = {index for index, _ in pairs}
    result = [{"index": index, "role": role} for index, role in pairs]

    for index in sorted(sorted_indices):
        if index not in occupied:
            result.append({"index": index, "role": "sorted"})
            occupied.add(index)

    for index in range(lo, hi + 1):
        if index not in occupied:
            result.append({"index": index, "role": "active_range"})
    return result


def trace_quick_sort(arr: List[int]) -> Iterator[Dict]:
    a = list(arr)
    n = len(a)
    comparisons = 0
    swaps = 0
    sorted_indices: Set[int] = set()

    yield {
        "array": list(a),
        "highlights": _highlights([], 0, n - 1, sorted_indices),
        "message": f"Starting quick sort on {n} elements",
        "comparisons": comparisons,
        "swaps": swaps,
    }

    def partition(lo: int, hi: int) -> Iterator[Dict]:
        """Yield steps, then yield the final pivot index as the last value.

        Nested generators can't `return` a useful value to the caller while
        also yielding steps, so the pivot index is the last yielded dict's
        `_pivot_index` key (stripped before sending to the client).
        """
        nonlocal comparisons, swaps
        pivot_index = hi
        pivot_value = a[hi]
        yield {
            "array": list(a),
            "highlights": _highlights(
                [(pivot_index, "pivot")],
                lo,
                hi,
                sorted_indices,
            ),
            "message": f"Partitioning [{lo}, {hi}] with pivot {pivot_value}",
            "comparisons": comparisons,
            "swaps": swaps,
        }

        # `i` is the boundary: everything to the left is <= pivot.
        i = lo
        for j in range(lo, hi):
            comparisons += 1
            yield {
                "array": list(a),
                "highlights": _highlights(
                    [(j, "comparing"), (pivot_index, "pivot")],
                    lo,
                    hi,
                    sorted_indices,
                ),
                "message": f"Comparing {a[j]} with pivot {pivot_value}",
                "comparisons": comparisons,
                "swaps": swaps,
            }

            if a[j] <= pivot_value:
                if i != j:
                    left, right = a[i], a[j]
                    a[i], a[j] = a[j], a[i]
                    swaps += 1
                    yield {
                        "array": list(a),
                        "highlights": _highlights(
                            [(i, "swapping"), (j, "swapping"), (pivot_index, "pivot")],
                            lo,
                            hi,
                            sorted_indices,
                        ),
                        "message": f"Swapped {left} and {right} — {right} belongs on the left of the pivot",
                        "comparisons": comparisons,
                        "swaps": swaps,
                    }
                i += 1

        # Drop the pivot into the hole between the two sides.
        if i != hi:
            left, right = a[i], a[hi]
            a[i], a[hi] = a[hi], a[i]
            swaps += 1
            yield {
                "array": list(a),
                "highlights": _highlights(
                    [(i, "swapping"), (hi, "swapping")],
                    lo,
                    hi,
                    sorted_indices,
                ),
                "message": f"Moved pivot {pivot_value} to index {i}",
                "comparisons": comparisons,
                "swaps": swaps,
            }

        sorted_indices.add(i)
        yield {
            "array": list(a),
            "highlights": _highlights([(i, "sorted")], lo, hi, sorted_indices),
            "message": f"Pivot {a[i]} is in its final position at index {i}",
            "comparisons": comparisons,
            "swaps": swaps,
            "_pivot_index": i,
        }

    def sort_range(lo: int, hi: int) -> Iterator[Dict]:
        nonlocal comparisons, swaps
        if lo > hi:
            return

        if lo == hi:
            sorted_indices.add(lo)
            yield {
                "array": list(a),
                "highlights": _highlights([], lo, hi, sorted_indices),
                "message": f"{a[lo]} is a partition of one — already in place",
                "comparisons": comparisons,
                "swaps": swaps,
            }
            return

        yield {
            "array": list(a),
            "highlights": _highlights([], lo, hi, sorted_indices),
            "message": f"Quick-sorting subarray [{lo}, {hi}]",
            "comparisons": comparisons,
            "swaps": swaps,
        }

        pivot_index = None
        for step in partition(lo, hi):
            pivot_index = step.pop("_pivot_index", pivot_index)
            yield step

        assert pivot_index is not None
        yield from sort_range(lo, pivot_index - 1)
        yield from sort_range(pivot_index + 1, hi)

    yield from sort_range(0, n - 1)

    yield {
        "array": list(a),
        "highlights": [{"index": i, "role": "sorted"} for i in range(n)],
        "message": "Quick sort complete",
        "comparisons": comparisons,
        "swaps": swaps,
    }
