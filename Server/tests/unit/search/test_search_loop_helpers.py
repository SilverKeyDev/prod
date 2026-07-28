from unittest.mock import MagicMock, patch

from app.services.search.helpers.search_loop_helpers import search_properties_paginated


def _ok_response(props, page_size=20):
    return MagicMock(
        status_code=200,
        content=True,
        json=MagicMock(return_value={"props": props, "pageSize": page_size}),
    )


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_paginated_dedupes_by_zpid(mock_get):
    mock_get.return_value = _ok_response(
        [
            {"zpid": "1", "price": 100},
            {"zpid": "1", "price": 100},
            {"zpid": "2", "price": 200},
        ]
    )
    props, n, errors = search_properties_paginated(
        polygon_param="-84 33, -83 33, -83 34, -84 34, -84 33",
        filters={},
        status_type="ForSale",
        per_pages=1,
        target_limit=10,
        request_id="t1",
    )
    assert errors == []
    assert n == 1  # 1-based success must not re-run 0-based
    assert [p["zpid"] for p in props] == ["1", "2"]
    assert mock_get.call_args.kwargs["params"]["page"] == 1


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_does_not_rerun_zero_based_after_successful_exhaustion(mock_get):
    """End-of-results on 1-based must not walk pages again from 0."""

    def side_effect(*_args, **kwargs):
        page = kwargs["params"]["page"]
        if page == 1:
            return _ok_response([{"zpid": "1", "price": 100}], page_size=20)
        return _ok_response([], page_size=20)

    mock_get.side_effect = side_effect
    props, n, errors = search_properties_paginated(
        polygon_param="-84 33, -83 33, -83 34, -84 34, -84 33",
        filters={},
        status_type="ForSale",
        per_pages=5,
        target_limit=50,
        request_id="t-no-double",
    )
    assert errors == []
    assert [p["zpid"] for p in props] == ["1"]
    pages = [c.kwargs["params"]["page"] for c in mock_get.call_args_list]
    assert pages == [1, 2]
    assert 0 not in pages
    assert n == 2


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_falls_back_to_zero_based_when_page_one_empty(mock_get):
    def side_effect(*_args, **kwargs):
        page = kwargs["params"]["page"]
        if page == 1:
            return _ok_response([])
        if page == 0:
            return _ok_response([{"zpid": "9", "price": 90}])
        return _ok_response([])

    mock_get.side_effect = side_effect
    props, n, errors = search_properties_paginated(
        polygon_param="-84 33, -83 33, -83 34, -84 34, -84 33",
        filters={},
        status_type="ForSale",
        per_pages=2,
        target_limit=10,
        request_id="t-zero",
    )
    assert errors == []
    assert [p["zpid"] for p in props] == ["9"]
    pages = [c.kwargs["params"]["page"] for c in mock_get.call_args_list]
    assert pages[0] == 1
    assert 0 in pages
    assert n >= 2


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_forwards_rapidapi_filters(mock_get):
    mock_get.return_value = _ok_response([])
    search_properties_paginated(
        polygon_param="-84 33, -83 33, -83 34, -84 34, -84 33",
        filters={"bedsMin": 3, "maxPrice": 500000, "listPrice": "ignore-me"},
        status_type="ForSale",
        per_pages=1,
        target_limit=10,
        request_id="t2",
    )
    # page 1 empty → may also try page 0; assert filters on first call
    params = mock_get.call_args_list[0].kwargs["params"]
    assert params["bedsMin"] == 3
    assert params["maxPrice"] == 500000
    assert "listPrice" not in params  # Slipstream-style key must not leak
