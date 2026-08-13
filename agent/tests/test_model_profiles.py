from __future__ import annotations

import unittest

from model_profiles import (
    DEFAULT_MODEL,
    SUPPORTED_MODELS,
    build_model_settings,
)


class ModelProfilesTest(unittest.TestCase):
    def test_default_model_is_terra(self) -> None:
        self.assertEqual(DEFAULT_MODEL, "openai:gpt-5.6-terra")

    def test_supported_models_lists_terra(self) -> None:
        self.assertEqual(SUPPORTED_MODELS, ("gpt-5.6-terra",))

    def test_build_model_settings_none_for_terra(self) -> None:
        self.assertIsNone(build_model_settings("openai:gpt-5.6-terra"))

    def test_build_model_settings_none_for_unknown_model(self) -> None:
        self.assertIsNone(build_model_settings("openai:future-model"))


if __name__ == "__main__":
    unittest.main()
