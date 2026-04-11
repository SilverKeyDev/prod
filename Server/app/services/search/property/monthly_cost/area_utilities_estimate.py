"""Placeholder for area-average monthly utilities; replace with Census/vendor data later."""


def estimate_area_utilities_monthly(
    *,
    zipcode: str,
) -> float:
    """
    Estimated typical monthly utilities (electric, gas, water, etc.) for the area.

    Parameters
    ----------
    zipcode:
        Listing ZIP (typically 5 digits); reserved for regional averages.

    Returns
    -------
    Always 0.0 until a data source is wired.
    """
    _ = zipcode
    return 0.0
