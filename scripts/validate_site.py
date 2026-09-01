from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import sys

root = Path(__file__).resolve().parents[1]
errors = []

class AssetParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        attribute = "href" if tag in {"a", "link"} else "src"

        if attribute not in values:
            return

        reference = values[attribute].strip()
        parsed = urlparse(reference)

        if (
            not reference
            or reference.startswith(("#", "mailto:", "tel:", "data:"))
            or parsed.scheme
            or reference.startswith("//")
        ):
            return

        path = reference.split("#")[0].split("?")[0].lstrip("/")
        if path.startswith("morzea/"):
            path = path[len("morzea/"):]

        if path and not (root / path).exists():
            errors.append(f"{tag}: missing local resource: {reference}")

for html_file in root.glob("*.html"):
    parser = AssetParser()
    parser.feed(html_file.read_text(encoding="utf-8"))

required = ["index.html", "robots.txt", "sitemap.xml"]
for filename in required:
    if not (root / filename).exists():
        errors.append(f"Required file missing: {filename}")

if errors:
    print("\n".join(errors))
    sys.exit(1)

print("Static website validation passed.")