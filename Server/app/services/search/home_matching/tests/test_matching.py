"""
Unit tests for the home matching system.
Entry point: runs all test classes from test_matching_utils and test_matching_ensemble.
"""

import logging
import sys
import unittest
from pathlib import Path

# Add parent directories to path for imports (home_matching and tests)
_here = Path(__file__).resolve().parent
sys.path.insert(0, str(_here.parent))
sys.path.insert(0, str(_here))


def load_tests(loader, standard_tests, pattern):
    """Discover and load tests from test_matching_utils and test_matching_ensemble."""
    import test_matching_ensemble
    import test_matching_utils

    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromModule(test_matching_utils))
    suite.addTests(loader.loadTestsFromModule(test_matching_ensemble))
    return suite


if __name__ == "__main__":
    logging.basicConfig(level=logging.ERROR)
    unittest.main(verbosity=2)
