"""Download the raw source files that are not kept in the repo.

O*NET (about 50 MB unzipped) and the NCES crosswalk are downloaded here.
BLS OEWS files are kept in data/raw/bls/ because bls.gov blocks automated
downloads; refresh them by hand from https://www.bls.gov/oes/tables.htm.

Usage: python scripts/etl/download.py
"""
import io
import pathlib
import urllib.request
import zipfile

from config import ONET_VERSION

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
UA = {"User-Agent": "Mozilla/5.0 (careerchangefinder data build)"}

ONET_URL = f"https://www.onetcenter.org/dl_files/database/db_{ONET_VERSION}_excel.zip"
NCES_URL = "https://nces.ed.gov/ipeds/cipcode/Files/CIP2020_SOC2018_Crosswalk.xlsx"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def main() -> None:
    onet_dir = RAW / "onet"
    target = onet_dir / f"db_{ONET_VERSION}_excel"
    if target.exists():
        print(f"O*NET {ONET_VERSION} already present: {target}")
    else:
        print(f"Downloading {ONET_URL}")
        data = fetch(ONET_URL)
        onet_dir.mkdir(parents=True, exist_ok=True)
        zipfile.ZipFile(io.BytesIO(data)).extractall(onet_dir)
        print(f"Extracted to {target}")

    nces = RAW / "nces" / "CIP2020_SOC2018_Crosswalk.xlsx"
    if nces.exists():
        print(f"NCES crosswalk already present: {nces}")
    else:
        print(f"Downloading {NCES_URL}")
        nces.parent.mkdir(parents=True, exist_ok=True)
        nces.write_bytes(fetch(NCES_URL))

    for name in ("national_M2025_dl.xlsx", "state_M2025_dl.xlsx"):
        path = RAW / "bls" / name
        print(("OK  " if path.exists() else "MISSING (download by hand)  ") + str(path))


if __name__ == "__main__":
    main()
