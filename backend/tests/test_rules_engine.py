import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.cards.card import Card
from app.melds.run_meld import RunMeld
from app.melds.set_meld import SetMeld
from app.rules.contract import Contract
from app.rules.rules_engine import RulesEngine


class DummyHand:
    def __init__(self, empty):
        self._empty = empty

    def is_empty(self):
        return self._empty


class TestRulesEngine(unittest.TestCase):
    def test_validate_meld(self):
        meld = SetMeld([
            Card(suit="HEARTS", rank="8"),
            Card(suit="SPADES", rank="8"),
            Card(suit="DIAMONDS", rank="8"),
        ])
        self.assertTrue(RulesEngine.validate_meld(meld))

    def test_meets_contract_true(self):
        melds = [
            SetMeld([
                Card(suit="HEARTS", rank="8"),
                Card(suit="SPADES", rank="8"),
                Card(suit="DIAMONDS", rank="8"),
            ]),
            RunMeld([
                Card(suit="CLUBS", rank="4"),
                Card(suit="CLUBS", rank="5"),
                Card(suit="CLUBS", rank="6"),
                Card(suit="CLUBS", rank="7"),
            ]),
        ]
        contract = Contract(required_sets=1, required_runs=1)
        self.assertTrue(RulesEngine.meets_contract(melds, contract))

    def test_meets_contract_false_when_extra_meld(self):
        melds = [
            SetMeld([
                Card(suit="HEARTS", rank="8"),
                Card(suit="SPADES", rank="8"),
                Card(suit="DIAMONDS", rank="8"),
            ]),
            SetMeld([
                Card(suit="HEARTS", rank="9"),
                Card(suit="SPADES", rank="9"),
                Card(suit="DIAMONDS", rank="9"),
            ]),
        ]
        contract = Contract(required_sets=1, required_runs=0)
        self.assertFalse(RulesEngine.meets_contract(melds, contract))

    def test_meets_contract_false_when_invalid_meld(self):
        melds = [
            SetMeld([
                Card(suit="HEARTS", rank="8"),
                Card(suit="SPADES", rank="7"),
                Card(suit="DIAMONDS", rank="8"),
            ])
        ]
        contract = Contract(required_sets=1, required_runs=0)
        self.assertFalse(RulesEngine.meets_contract(melds, contract))

    def test_can_go_out(self):
        self.assertTrue(RulesEngine.can_go_out(DummyHand(empty=True), has_laid_down=True))
        self.assertFalse(RulesEngine.can_go_out(DummyHand(empty=True), has_laid_down=False))
        self.assertFalse(RulesEngine.can_go_out(DummyHand(empty=False), has_laid_down=True))


if __name__ == "__main__":
    unittest.main()
