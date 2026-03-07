import unittest

try:
    from ._test_setup import setup_test_imports
except ImportError:
    from _test_setup import setup_test_imports

setup_test_imports()

from app.rules.contract import CONTRACTS, Contract


class TestContract(unittest.TestCase):
    def test_contract_count(self):
        self.assertEqual(len(CONTRACTS), 10)

    def test_round_progression(self):
        expected = [
            (2, 0),
            (1, 1),
            (0, 2),
            (3, 0),
            (2, 1),
            (1, 2),
            (0, 3),
            (3, 1),
            (1, 3),
            (4, 0),
        ]
        got = [(c.required_sets, c.required_runs) for c in CONTRACTS]
        self.assertEqual(got, expected)

    def test_contract_dataclass(self):
        c = Contract(required_sets=2, required_runs=1)
        self.assertEqual(c.required_sets, 2)
        self.assertEqual(c.required_runs, 1)


if __name__ == "__main__":
    unittest.main()
