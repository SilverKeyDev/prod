"""Chart generation for research reports (matplotlib)."""

import logging
from io import BytesIO
from typing import cast

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.axes import Axes

logger = logging.getLogger(__name__)

# Consistent font sizes for all charts
TITLE_FONTSIZE = 16
LABEL_FONTSIZE = 12
TICK_FONTSIZE = 10
AUTOPCT_FONTSIZE = 10


def format_label(label: str) -> str:
    """Format label by capitalizing and replacing underscores with spaces.

    Args:
        label: Raw label string (e.g., 'example_text')

    Returns:
        Formatted label string (e.g., 'Example Text')
    """
    return label.replace("_", " ").title()


def generate_vertical_lollipop_chart(data: dict, title: str) -> BytesIO | None:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and val.endswith("%"):
                    sizes.append(float(val.strip("%")))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.error(
                    f"❌ Skipping non-numeric value in vertical lollipop chart for '{title}': {val} - {e}"
                )
                return None

        if not sizes or sum(sizes) == 0:
            logger.error(
                f"❌ Skipping vertical lollipop chart for '{title}' due to empty or invalid data."
            )
            return None

        fig, ax = plt.subplots(figsize=(0.6 * len(labels) + 1, 4))
        ax = cast(Axes, ax)
        x_pos = np.arange(len(labels))

        ax.vlines(x=x_pos, ymin=0, ymax=sizes, color="gray", alpha=0.7, linewidth=2)
        ax.plot(x_pos, sizes, "o", color="#2A9D8F", markersize=10)
        ax.set_xticks(x_pos)  # type: ignore[reportCallIssue]
        ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=TICK_FONTSIZE)  # type: ignore[reportCallIssue]
        ax.set_ylabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight="bold")
        ax.grid(axis="y", linestyle="--", alpha=0.3)
        ax.tick_params(axis="y", labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.error(f"❌ Failed to generate vertical lollipop chart for {title}: {e}")
        return None


def generate_horizontal_bar_chart(data: dict, title: str) -> BytesIO | None:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and "%" in val:
                    val = val.split("%")[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.error(
                    f"❌ Skipping non-numeric value in bar chart for '{title}': {val} - {e}"
                )
                return None

        if not sizes or sum(sizes) == 0:
            logger.error(f"❌ Skipping bar chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots(figsize=(6, 0.4 * len(labels) + 1))
        ax = cast(Axes, ax)
        cmap = getattr(plt.cm, "PuBuGn_r", getattr(plt.cm, "viridis", plt.cm.get_cmap("viridis")))
        colors = cmap(np.linspace(0.3, 0.9, len(sizes)))
        ax.barh(labels, sizes, color=colors)
        ax.set_xlabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight="bold")
        ax.grid(axis="x", linestyle="--", alpha=0.4)
        ax.tick_params(axis="both", labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.error(f"❌ Failed to generate horizontal bar chart for {title}: {e}")
        return None


def generate_donut_chart(data: dict, title: str) -> BytesIO | None:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and "%" in val:
                    val = val.split("%")[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(
                    f"Skipping non-numeric value in donut chart for '{title}': {val} - {e}"
                )
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping donut chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots()
        ax = cast(Axes, ax)
        pie_colors = [
            "#A3B18A",
            "#E5E5E5",
            "#4A5A28",
            "#4A3228",
            "#DAD7CD",
            "#588157",
            "#BC6C25",
            "#6C584C",
            "#CCD5AE",
            "#B5838D",
        ]
        colors = [pie_colors[i % len(pie_colors)] for i in range(len(sizes))]
        pie_result = ax.pie(
            sizes,
            labels=labels,
            autopct="%1.1f%%",
            startangle=140,
            colors=colors,
            wedgeprops={"width": 0.4},
            textprops={"fontsize": TICK_FONTSIZE},
        )
        autotexts = pie_result[2] if len(pie_result) > 2 else []
        for autotext in autotexts:
            autotext.set_fontsize(AUTOPCT_FONTSIZE)
            autotext.set_fontweight("bold")
        ax.axis("equal")
        plt.title(title, fontsize=TITLE_FONTSIZE, fontweight="bold")

        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate donut chart for {title}: {e}")
        return None


def generate_lollipop_chart(data: dict, title: str) -> BytesIO | None:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and "%" in val:
                    val = val.split("%")[0]  # Keep everything before the first %
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(
                    f"Skipping non-numeric value in lollipop chart for '{title}': {val} - {e}"
                )
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping lollipop chart for '{title}' due to empty or invalid data.")
            return None

        fig, ax = plt.subplots(figsize=(6, 0.4 * len(labels) + 1))
        ax = cast(Axes, ax)
        y_pos = np.arange(len(labels))

        ax.hlines(y=y_pos, xmin=0, xmax=sizes, color="gray", alpha=0.7, linewidth=2)
        ax.plot(sizes, y_pos, "o", color="#2A9D8F", markersize=10)
        ax.set_yticks(y_pos)  # type: ignore[reportCallIssue]
        ax.set_yticklabels(labels, fontsize=TICK_FONTSIZE)  # type: ignore[reportCallIssue]
        ax.set_xlabel("Value", fontsize=LABEL_FONTSIZE)
        ax.set_title(title, fontsize=TITLE_FONTSIZE, fontweight="bold")
        ax.grid(axis="x", linestyle="--", alpha=0.3)
        ax.tick_params(axis="x", labelsize=TICK_FONTSIZE)

        plt.tight_layout()
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate lollipop chart for {title}: {e}")
        return None


def generate_pie_chart(data: dict, title: str) -> BytesIO | None:
    try:
        labels = [format_label(key) for key in data.keys()]
        sizes = []
        for val in data.values():
            try:
                if isinstance(val, str) and "%" in val:
                    val = val.split("%")[0]
                    sizes.append(float(val))
                else:
                    sizes.append(float(val))
            except Exception as e:
                logger.warning(
                    f"Skipping non-numeric value in pie chart for '{title}': {val} - {e}"
                )
                return None

        if not sizes or sum(sizes) == 0:
            logger.warning(f"Skipping pie chart for '{title}' due to empty or invalid data.")
            return None

        pie_colors = [
            "#A3B18A",
            "#E5E5E5",
            "#4A5A28",
            "#4A3228",
            "#DAD7CD",
            "#588157",
            "#BC6C25",
            "#6C584C",
            "#CCD5AE",
            "#B5838D",
        ]
        colors = [pie_colors[i % len(pie_colors)] for i in range(len(sizes))]
        fig, ax = plt.subplots()
        ax = cast(Axes, ax)
        pie_result = ax.pie(
            sizes,
            labels=labels,
            autopct="%1.1f%%",
            startangle=140,
            colors=colors,
            textprops={"fontsize": TICK_FONTSIZE},
        )
        autotexts = pie_result[2] if len(pie_result) > 2 else []
        for autotext in autotexts:
            autotext.set_fontsize(AUTOPCT_FONTSIZE)
            autotext.set_fontweight("bold")
        ax.axis("equal")
        plt.title(title, fontsize=TITLE_FONTSIZE, fontweight="bold")
        img_buffer = BytesIO()
        plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
        plt.close(fig)
        img_buffer.seek(0)
        return img_buffer
    except Exception as e:
        logger.warning(f"Failed to generate pie chart for {title}: {e}")
        return None
