from __future__ import annotations as _annotations

from typing import TypedDict
import feedparser  # type: ignore


from mkdocs.config import Config
from mkdocs.structure.files import Files
from mkdocs.structure.pages import Page


CHANNEL_ID = "UC91TdNbobUqT3d2CHcTkx8A"  # FastAPI Expert YouTube channel ID


def on_page_markdown(markdown: str, page: Page, config: Config, files: Files) -> str:
    if page.file.src_path == "youtube.md":
        markdown = populate_with_youtube_grid(markdown)
    return markdown


def fetch_videos() -> list[Video]:
    feed = feedparser.parse(f"http://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}")  # type: ignore
    videos = [{"title": entry.title, "videoId": entry.yt_videoid} for entry in feed.entries]  # type: ignore
    return videos  # type: ignore


class Video(TypedDict):
    title: str
    videoId: str


def populate_with_youtube_grid(markdown: str) -> str:
    videos = fetch_videos()
    youtube_grid = '<div class="youtube-grid">\n'

    latest_video = videos.pop(0)
    youtube_grid += f'<iframe class="latest-video" src="https://www.youtube.com/embed/{latest_video["videoId"]}" frameborder="0" allowfullscreen></iframe>\n'

    # Add the rest of the videos
    for video in videos:
        youtube_grid += f'<iframe src="https://www.youtube.com/embed/{video["videoId"]}" frameborder="0" allowfullscreen></iframe>\n'

    youtube_grid += "</div>\n"
    return markdown.replace("{{ youtube_grid }}", youtube_grid)
