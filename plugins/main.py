from __future__ import annotations as _annotations

import os
from typing import Any, TypedDict

import feedparser  # type: ignore
import httpx
from mkdocs.config import Config
from mkdocs.structure.files import Files
from mkdocs.structure.pages import Page

CHANNEL_ID = "UC91TdNbobUqT3d2CHcTkx8A"  # FastAPI Expert YouTube channel ID
GITHUB_TOKEN = os.getenv("GH_TOKEN")  # Use the GH_TOKEN environment variable


def on_page_markdown(markdown: str, page: Page, config: Config, files: Files) -> str:
    if page.file.src_path == "youtube.md":
        return populate_with_youtube_grid(markdown)
    if page.file.src_path == "sponsors.md":
        return populate_with_sponsors(markdown)
    return markdown


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


def populate_with_sponsors(markdown: str) -> str:
    data = fetch_sponsors()
    sponsors = parse_sponsors(data)
    sponsor_html_content = generate_sponsor_html(sponsors)

    return markdown.replace("{{ sponsors }}", sponsor_html_content)


# Utility functions


def fetch_videos() -> list[Video]:
    feed = feedparser.parse(f"http://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}")  # type: ignore
    videos = [{"title": entry.title, "videoId": entry.yt_videoid} for entry in feed.entries]  # type: ignore
    return videos  # type: ignore


class Video(TypedDict):
    title: str
    videoId: str


# GraphQL query for fetching sponsorships with avatars
query = """
query {
  user(login: "Kludex") {
    ... on Sponsorable {
      sponsors(first: 100) {
        totalCount
        nodes {
          ... on User { login avatarUrl }
          ... on Organization { login avatarUrl }
        }
      }
    }
  }
}
"""

headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Content-Type": "application/json"}


def fetch_sponsors():
    response = httpx.post("https://api.github.com/graphql", json={"query": query}, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Query failed to run by returning code of {response.status_code}. {query}")


class Sponsor(TypedDict):
    login: str
    avatarUrl: str


def parse_sponsors(data: Any) -> list[Sponsor]:
    sponsors = data["data"]["user"]["sponsors"]["nodes"]
    return [{"login": sponsor["login"], "avatarUrl": sponsor["avatarUrl"]} for sponsor in sponsors]


def generate_sponsor_html(sponsors: list[Sponsor]) -> str:
    content = """<div style="display: flex; flex-wrap: wrap;">"""

    for sponsor in sponsors:
        content += f"""
    <div style="margin: 10px; text-align: center; width: 120px;">
        <img src="{sponsor['avatarUrl']}" style="border-radius: 50%; width: 100px; height: 100px;">
        <div><a href="https://github.com/{sponsor['login']}">{sponsor['login']}</a></div>
    </div>
"""

    content += """\n</div>"""
    return content
