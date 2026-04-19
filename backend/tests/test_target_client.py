from __future__ import annotations

import pytest

from app.target_client import is_valid_target_url, parse_target_response


@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        ({"response": "from response"}, "from response"),
        ({"text": "from text"}, "from text"),
        ({"message": "from message"}, "from message"),
        ({"content": "from content"}, "from content"),
        ({"message": {"content": "nested message"}}, "nested message"),
        ({"choices": [{"message": {"content": "openai style"}}]}, "openai style"),
    ],
)
def test_parse_target_response_common_shapes(payload, expected) -> None:
    assert parse_target_response(payload) == expected


def test_is_valid_target_url_requires_http_or_https() -> None:
    assert is_valid_target_url("https://example.com/chat") is True
    assert is_valid_target_url("http://localhost:3001/chat") is True
    assert is_valid_target_url("not-a-url") is False
    assert is_valid_target_url(None) is False

