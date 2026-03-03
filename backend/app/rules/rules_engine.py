"""
SHREY

RulesEngine Class

Responsibility:
- Validates meld legality.
- Validates whether a player meets the round contract.
- Determines whether a player can go out.
- Enforces Shanghai-specific rules.

The RulesEngine does NOT:
- Control turn order.
- Store game state.
- Track scores.
"""

from typing import Iterable

from app.melds.run_meld import RunMeld
from app.melds.set_meld import SetMeld
from app.rules.contract import Contract


class RulesEngine:
    @staticmethod
    def validate_meld(meld) -> bool:
        return meld.is_valid()

    @classmethod
    def meets_contract(cls, melds: Iterable, contract: Contract) -> bool:
        melds = list(melds)
        if len(melds) != (contract.required_sets + contract.required_runs):
            return False

        set_count = 0
        run_count = 0
        for meld in melds:
            if not cls.validate_meld(meld):
                return False
            if isinstance(meld, SetMeld):
                set_count += 1
            elif isinstance(meld, RunMeld):
                run_count += 1
            else:
                return False

        return set_count == contract.required_sets and run_count == contract.required_runs

    @staticmethod
    def can_go_out(hand, has_laid_down: bool) -> bool:
        # A player can only go out after laying down.
        return has_laid_down and hand.is_empty()
