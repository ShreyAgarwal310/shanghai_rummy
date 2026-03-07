"""
SHREY

Contract Class

Responsibility:
- Defines the requirements for a round.
- Stores required number of sets.
- Stores required number of runs.
- Stores cards required per meld.

The Contract class does NOT:
- Validate melds.
- Control turns.
- Track scores.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Contract:
    required_sets: int
    required_runs: int


# Custom house-rule progression: 10 rounds total.
CONTRACTS = [
    Contract(required_sets=2, required_runs=0),  # 1. Two Sets
    Contract(required_sets=1, required_runs=1),  # 2. One Set & One Run
    Contract(required_sets=0, required_runs=2),  # 3. Two Runs
    Contract(required_sets=3, required_runs=0),  # 4. Three Sets
    Contract(required_sets=2, required_runs=1),  # 5. Two Sets & One Run
    Contract(required_sets=1, required_runs=2),  # 6. Two Runs & One Set
    Contract(required_sets=0, required_runs=3),  # 7. Three Runs
    Contract(required_sets=3, required_runs=1),  # 8. Three Sets & One Run
    Contract(required_sets=1, required_runs=3),  # 9. Three Runs & One Set
    Contract(required_sets=4, required_runs=0),  # 10. Four Sets
]
