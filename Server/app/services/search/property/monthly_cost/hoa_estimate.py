"""Placeholder for HOA monthly dues; replace with external/API-backed data later."""


def estimate_hoa_monthly_dues(
    *,
    zipcode: str,
    listing_payload: dict | None = None,
) -> float:
    """
    Estimated monthly HOA dues in USD.

    Parameters
    ----------
    zipcode:
        Listing ZIP (typically 5 digits); reserved for regional defaults.
    listing_payload:
        Optional raw listing fields (e.g. zpid, community id) for a future API.

    Returns
    -------
    Always 0.0 until a data source is wired.
    """
    _ = (zipcode, listing_payload)
    return 0.0
