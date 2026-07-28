from unittest.mock import MagicMock, patch

from app.services.search.helpers.search_loop_helpers import search_properties_paginated


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_paginated_dedupes_by_zpid(mock_get):
    mock_get.return_value = MagicMock(
        status_code=200,
        content=True,
        json=MagicMock(
            return_value={
                "props": [
                    {"zpid": "1", "price": 100},
                    {"zpid": "1", "price": 100},
                    {"zpid": "2", "price": 200},
                ],
                "pageSize": 20,
            }
        ),
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
    assert n >= 1
    assert [p["zpid"] for p in props] == ["1", "2"]


@patch("app.services.search.helpers.search_loop_helpers.rapidapi_get")
def test_forwards_rapidapi_filters(mock_get):
    mock_get.return_value = MagicMock(
        status_code=200,
        content=True,
        json=MagicMock(return_value={"props": [], "pageSize": 20}),
    )
    search_properties_paginated(
        polygon_param="-84 33, -83 33, -83 34, -84 34, -84 33",
        filters={"bedsMin": 3, "maxPrice": 500000, "listPrice": "ignore-me"},
        status_type="ForSale",
        per_pages=1,
        target_limit=10,
        request_id="t2",
    )
    params = mock_get.call_args.kwargs["params"]
    assert params["bedsMin"] == 3
    assert params["maxPrice"] == 500000
    assert "listPrice" not in params  # Slipstream-style key must not leak
