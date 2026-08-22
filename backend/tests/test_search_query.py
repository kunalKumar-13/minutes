"""FTS5 will reject or misread raw user input, so it is always escaped first."""
from __future__ import annotations

import pytest

from app.services.search import make_snippet, to_match_query


@pytest.mark.parametrize("raw", ['AND OR NOT', '"unbalanced', 'a AND b', "NEAR(x y)", "*", "()"])
def test_operators_and_punctuation_are_neutralised(raw: str) -> None:
    """Nothing a user types should reach FTS5 as syntax."""
    result = to_match_query(raw)
    tokens = result.split()
    assert all(token.startswith('"') for token in tokens if token), result


def test_the_last_token_gets_a_prefix_wildcard() -> None:
    assert to_match_query("onboarding exper").endswith('"exper"*')


def test_a_quoted_phrase_is_preserved() -> None:
    assert '"weekly active seats"' in to_match_query('"weekly active seats"')


def test_snippet_windows_around_the_first_match() -> None:
    body = "x" * 200 + " renewal condition " + "y" * 200
    snippet = make_snippet(body, "renewal", radius=40)
    assert "renewal" in snippet
    assert snippet.startswith("…") and snippet.endswith("…")
    assert len(snippet) < len(body)


def test_snippet_without_a_match_still_returns_a_prefix() -> None:
    assert make_snippet("nothing relevant in here", "zebra").startswith("nothing")


def test_any_mode_ors_content_words_and_drops_question_words() -> None:
    """A question needs OR semantics; ANDing every word matches no single line."""
    result = to_match_query("What did we decide about mobile?", mode="any")
    assert " OR " in result
    assert '"decide"' in result and '"mobile"*' in result
    assert '"what"' not in result.lower()


def test_any_mode_keeps_raw_tokens_when_everything_is_a_stopword() -> None:
    assert to_match_query("what is it", mode="any") != ""


def test_all_mode_is_still_implicit_and() -> None:
    assert " OR " not in to_match_query("weekly active seats")
