"""Insertion sort trace generator.

Insertion sort grows a sorted prefix from left to right. The next unsorted
value is pulled out and shifted left until it sits in the correct spot.

Unlike bubble sort (which only swaps neighbors and finalizes from the right),
insertion sort moves an element multiple positions in one go via shifts.
The green `sorted` highlights here mean "sorted prefix" — those values can
still move later if a smaller key is inserted in front of them.
"""

from typing import Dict, Iterator, List, Set


def _highlights(
    pairs: List[tuple[int, str]],
    sorted_indices: Set[int],
) -> List[Dict]:
    occupied = {index for index, _ in pairs}
    result = [{"index": index, "role": role} for index, role in pairs]
    for index in sorted(sorted_indices):
        if index not in occupied:
            result.append({"index": index, "role": "sorted"})
    return result


def trace_insertion_sort(arr: List[int]) -> Iterator[Dict]:
    a = list(arr)
    n = len(a)
    comparisons = 0
    swaps = 0
    # Index 0 is a trivially sorted prefix of length 1.
    sorted_indices: Set[int] = {0}

    yield {
        "array": list(a),
        "highlights": _highlights([], sorted_indices),
        "message": f"Starting insertion sort — {a[0]} is a sorted prefix of one",
        "comparisons": comparisons,
        "swaps": swaps,
    }

    for i in range(1, n):
        key = a[i]
        j = i - 1

        yield {
            "array": list(a),
            "highlights": _highlights([(i, "comparing")], sorted_indices),
            "message": f"Inserting {key} into the sorted prefix",
            "comparisons": comparisons,
            "swaps": swaps,
        }

        # Walk left, shifting larger prefix values one slot to the right.
        while j >= 0:
            comparisons += 1
            yield {
                "array": list(a),
                "highlights": _highlights(
                    [(j, "comparing"), (j + 1, "comparing")],
                    sorted_indices - {j + 1},
                ),
                "message": f"Comparing {a[j]} with {key}",
                "comparisons": comparisons,
                "swaps": swaps,
            }

            if a[j] > key:
                a[j + 1] = a[j]
                swaps += 1
                yield {
                    "array": list(a),
                    "highlights": _highlights(
                        [(j, "swapping"), (j + 1, "swapping")],
                        sorted_indices - {j, j + 1},
                    ),
                    "message": f"Shifted {a[j + 1]} one slot to the right",
                    "comparisons": comparisons,
                    "swaps": swaps,
                }
                j -= 1
            else:
                break

        insert_at = j + 1
        if a[insert_at] != key:
            a[insert_at] = key
            swaps += 1
            yield {
                "array": list(a),
                "highlights": _highlights([(insert_at, "swapping")], sorted_indices),
                "message": f"Inserted {key} at index {insert_at}",
                "comparisons": comparisons,
                "swaps": swaps,
            }
        else:
            yield {
                "array": list(a),
                "highlights": _highlights([(insert_at, "sorted")], sorted_indices),
                "message": f"{key} is already in the right place",
                "comparisons": comparisons,
                "swaps": swaps,
            }

        sorted_indices = set(range(i + 1))
        yield {
            "array": list(a),
            "highlights": _highlights([], sorted_indices),
            "message": f"Sorted prefix is now {a[: i + 1]}",
            "comparisons": comparisons,
            "swaps": swaps,
        }

    yield {
        "array": list(a),
        "highlights": _highlights([], set(range(n))),
        "message": "Insertion sort complete",
        "comparisons": comparisons,
        "swaps": swaps,
    }
