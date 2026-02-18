#!/usr/bin/env python3
"""
Export a Figma-ready SVG of event nodes + titles from an XLSX "Events" sheet.

This uses the current timeline scale:
- start year: 4004 BC
- end year:   400 BC
- pixels/year: 2
"""

from __future__ import annotations

import argparse
import re
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"a": NS_MAIN, "r": NS_REL, "pr": NS_PKG_REL}

START_YEAR = 4004
END_YEAR = 400
PX_PER_YEAR = 2

LEFT_MARGIN = 120
RIGHT_MARGIN = 80
TOP_MARGIN = 40
BOTTOM_MARGIN = 60

NODE_HEIGHT = 20
LANE_GAP = 8
LANE_STRIDE = NODE_HEIGHT + LANE_GAP


@dataclass
class Event:
    title: str
    start_year: int
    end_year: int
    lane: int = 0

    @property
    def lo(self) -> int:
        return min(self.start_year, self.end_year)

    @property
    def hi(self) -> int:
        return max(self.start_year, self.end_year)


def esc_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def col_to_idx(col: str) -> int:
    value = 0
    for ch in col:
        value = value * 26 + (ord(ch) - 64)
    return value - 1


def parse_num(value: str | None) -> int | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return int(round(float(text)))
    except ValueError:
        return None


def shared_strings(zf: zipfile.ZipFile) -> list[str]:
    path = "xl/sharedStrings.xml"
    if path not in zf.namelist():
        return []

    root = ET.fromstring(zf.read(path))
    out: list[str] = []
    for si in root.findall("a:si", NS):
        parts = [node.text or "" for node in si.findall(".//a:t", NS)]
        out.append("".join(parts))
    return out


def workbook_sheet_target(zf: zipfile.ZipFile, sheet_name: str) -> str:
    wb = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

    rel_map: dict[str, str] = {}
    for rel in rels.findall("pr:Relationship", NS):
        rel_map[rel.attrib["Id"]] = rel.attrib["Target"]

    for sheet in wb.findall("a:sheets/a:sheet", NS):
        if sheet.attrib.get("name") != sheet_name:
            continue
        rid = sheet.attrib.get(f"{{{NS_REL}}}id")
        if rid is None or rid not in rel_map:
            break
        return f"xl/{rel_map[rid]}"

    raise ValueError(f'Sheet "{sheet_name}" not found in workbook.')


def read_events_from_sheet(xlsx_path: Path, sheet_name: str = "Events") -> list[Event]:
    with zipfile.ZipFile(xlsx_path) as zf:
        strings = shared_strings(zf)
        sheet_xml_path = workbook_sheet_target(zf, sheet_name)
        sheet = ET.fromstring(zf.read(sheet_xml_path))

    rows: list[list[str]] = []
    for row in sheet.findall(".//a:sheetData/a:row", NS):
        values: dict[int, str] = {}
        for cell in row.findall("a:c", NS):
            ref = cell.attrib.get("r", "")
            match = re.match(r"([A-Z]+)", ref)
            if not match:
                continue

            idx = col_to_idx(match.group(1))
            cell_type = cell.attrib.get("t")
            value_node = cell.find("a:v", NS)

            if cell_type == "s" and value_node is not None and value_node.text:
                value = strings[int(value_node.text)]
            elif cell_type == "inlineStr":
                value = "".join((t.text or "") for t in cell.findall(".//a:t", NS))
            elif value_node is not None:
                value = value_node.text or ""
            else:
                value = ""

            values[idx] = value

        if values:
            width = max(values.keys()) + 1
            row_values = [""] * width
            for idx, val in values.items():
                row_values[idx] = val
            rows.append(row_values)

    if not rows:
        return []

    header = [str(h).strip() for h in rows[0]]
    header_idx = {name: i for i, name in enumerate(header) if name}

    if "Name" not in header_idx or "year" not in header_idx:
        raise ValueError('Expected "Name" and "year" columns in Events sheet.')

    idx_name = header_idx["Name"]
    idx_start = header_idx["year"]
    idx_end = header_idx.get("endYear")

    events: list[Event] = []
    for row in rows[1:]:
        if idx_name >= len(row):
            continue

        title = str(row[idx_name]).strip()
        if not title:
            continue

        start = parse_num(row[idx_start] if idx_start < len(row) else None)
        if start is None:
            continue

        end = parse_num(row[idx_end] if idx_end is not None and idx_end < len(row) else None)
        if end is None:
            end = start

        events.append(Event(title=title, start_year=start, end_year=end))

    return events


def overlaps(a: Event, b_lo: int, b_hi: int) -> bool:
    return not (a.hi < b_lo or b_hi < a.lo)


def assign_lanes(events: list[Event]) -> int:
    # Older-to-newer ordering keeps BC layout stable.
    ordered = sorted(events, key=lambda e: (-e.start_year, -e.end_year, e.title.lower()))
    lane_ranges: list[list[tuple[int, int]]] = []

    for event in ordered:
        assigned = False
        for lane_idx, ranges in enumerate(lane_ranges):
            if all(not overlaps(event, lo, hi) for lo, hi in ranges):
                event.lane = lane_idx
                ranges.append((event.lo, event.hi))
                assigned = True
                break
        if not assigned:
            event.lane = len(lane_ranges)
            lane_ranges.append([(event.lo, event.hi)])

    return len(lane_ranges)


def year_to_x(year: int) -> int:
    return LEFT_MARGIN + (START_YEAR - year) * PX_PER_YEAR


def build_svg(events: list[Event], lane_count: int) -> str:
    timeline_width = (START_YEAR - END_YEAR) * PX_PER_YEAR
    width = LEFT_MARGIN + timeline_width + RIGHT_MARGIN
    track_height = max(1, lane_count) * LANE_STRIDE
    height = TOP_MARGIN + track_height + BOTTOM_MARGIN

    lines: list[str] = []
    lines.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" font-family="Inter, system-ui, sans-serif">'
    )
    lines.append(f'  <rect x="0" y="0" width="{width}" height="{height}" fill="#FAF6F0" />')

    # Subtle track guide to preserve placement scale in Figma.
    lines.append(
        f'  <line x1="{LEFT_MARGIN}" y1="{TOP_MARGIN + track_height}" '
        f'x2="{LEFT_MARGIN + timeline_width}" y2="{TOP_MARGIN + track_height}" '
        'stroke="#D8CCB5" stroke-width="1" />'
    )

    for event in events:
        x = year_to_x(event.start_year)
        y = TOP_MARGIN + (event.lane * LANE_STRIDE)
        is_point = event.start_year == event.end_year
        label = esc_xml(event.title)

        lines.append(
            f'  <g data-kind="event" data-title="{label}" '
            f'data-start-year="{event.start_year}" data-end-year="{event.end_year}" '
            f'data-lane="{event.lane}">'
        )

        if is_point:
            cx = x + (NODE_HEIGHT // 2)
            cy = y + (NODE_HEIGHT // 2)
            lines.append(
                f'    <circle cx="{cx}" cy="{cy}" r="{NODE_HEIGHT // 2}" '
                'fill="#E6C7C0" stroke="#2D241C" stroke-width="1.25" />'
            )
            text_x = x + NODE_HEIGHT + 6
            text_y = cy + 4
        else:
            width_px = max(NODE_HEIGHT, (event.start_year - event.end_year) * PX_PER_YEAR)
            lines.append(
                f'    <rect x="{x}" y="{y}" width="{width_px}" height="{NODE_HEIGHT}" rx="6" '
                'fill="#E6C7C0" stroke="#2D241C" stroke-width="1.25" />'
            )
            text_x = x + width_px + 6
            text_y = y + 14

        lines.append(
            f'    <text x="{text_x}" y="{text_y}" font-size="12" font-weight="600" '
            f'fill="#2D241C">{label}</text>'
        )
        lines.append("  </g>")

    lines.append("</svg>")
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export event node/title SVG from an XLSX Events sheet."
    )
    parser.add_argument(
        "--xlsx",
        default="/Users/Stephen1/Downloads/TimelineDB.xlsx",
        help="Path to source XLSX file",
    )
    parser.add_argument(
        "--sheet",
        default="Events",
        help='Worksheet name (default: "Events")',
    )
    parser.add_argument(
        "--out",
        default="Resources/figma-export/events-sheet-nodes.svg",
        help="Output SVG path",
    )
    args = parser.parse_args()

    xlsx_path = Path(args.xlsx).expanduser().resolve()
    out_path = Path(args.out).resolve()

    events = read_events_from_sheet(xlsx_path, args.sheet)
    lane_count = assign_lanes(events)
    svg = build_svg(events, lane_count)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(svg, encoding="utf-8")

    print(f"Source: {xlsx_path}")
    print(f"Sheet: {args.sheet}")
    print(f"Events exported: {len(events)}")
    print(f"Lanes used: {lane_count}")
    print(f"SVG: {out_path}")


if __name__ == "__main__":
    main()
