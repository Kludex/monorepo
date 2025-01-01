---
date: 2025-01-01
categories:
- Open Source
readtime: 2
---

# 2024 Open Source Report

This is my first yearly report on Open Source! :tada:

I dedicate a lot of my free time doing Open Source work, and I would like to share with you
some numbers. I hope you find them interesting!

| Project | Downloads/month | Time spent | Releases | Closed issues | Merged PRs | Closed unmerged PRs | Answered discussions |
|---------|-----------------|------------|----------|--------------|------------|---------------------|----------------------|
| [Starlette] | [57 million] | 70 hrs 29 mins | 29 | 76 | 182 | 64 | 93 |
| [Uvicorn] | [49 million] | 48 hrs 3 mins | 20 | 61 | 100 | 65 | 38 |
| [Python Multipart] | [25 million] | 17 hrs 29 mins | 13 | 37 | 87 | 12 | 0 |
| **Total** | **131 million** | **136 hrs 1 min** | **62** | **174** | **369** | **141** | **131** |

Most of the time dedicated in maintaining open source projects is actually not spent coding, as
most of people think. It's mainly on interacting with people: answering questions, reviewing
pull requests, and investigating issues.

## Sponsors

I would like to thank all the sponsors that
[supported me in 2024](https://fastapiexpert.com/sponsors/)! :heart:

## Data Analysis

I got this data from a script I created that queries the GitHub API and [WakaTime] API.

??? success "Click here to see the script..."

    Most of the script was created with the help of [Claude AI](https://claude.ai/new),
    but I had to tweak it a bit to get the data I wanted.

    If you want to use it, make sure you have the following environment variables set:

    - `WAKATIME_API_KEY`: Your WakaTime API key.
    - `GH_TOKEN`: Your GitHub token.

    ```py
    import os
    import httpx
    from datetime import datetime, timedelta
    from wakatime_client import WakatimeClient


    def main():
        client = WakatimeClient(api_key=os.getenv("WAKATIME_API_KEY"))
        for project in client.stats(range="last_year")["data"]["projects"]:
            if project["name"] in ("starlette", "uvicorn", "python-multipart"):
                print(f'{project["name"]}: {project["text"]}')
        print()

        print(f"starlette releases: {count_releases('encode', 'starlette')}")
        print(f"uvicorn releases: {count_releases('encode', 'uvicorn')}")
        print(f"python-multipart releases: {count_releases('Kludex', 'python-multipart')}")
        print()
        print(f"starlette stats: {get_repo_stats('encode', 'starlette')}")
        print(f"uvicorn stats: {get_repo_stats('encode', 'uvicorn')}")
        print(f"python-multipart stats: {get_repo_stats('Kludex', 'python-multipart')}")
        print()
        print(f"starlette activity: {get_repo_activity('encode', 'starlette')}")
        print(f"uvicorn activity: {get_repo_activity('encode', 'uvicorn')}")
        print(f"python-multipart activity: {get_repo_activity('Kludex', 'python-multipart')}")


    def count_releases(owner: str, repo: str):
        url = f"https://api.github.com/repos/{owner}/{repo}/releases"
        headers = {"Accept": "application/vnd.github.v3+json", "Authorization": f"Bearer {os.getenv('GH_TOKEN')}"}

        with httpx.Client() as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()

            one_year_ago = datetime.now() - timedelta(days=365)
            return sum(
                1
                for release in response.json()
                if datetime.strptime(release["published_at"], "%Y-%m-%dT%H:%M:%SZ") > one_year_ago
            )


    def get_repo_stats(owner: str, repo: str):
        headers = {"Accept": "application/vnd.github.v3+json", "Authorization": f"Bearer {os.getenv('GH_TOKEN')}"}

        base_url = f"https://api.github.com/repos/{owner}/{repo}"
        since = (datetime.now() - timedelta(days=365)).isoformat()

        try:
            with httpx.Client() as client:
                # Get issues (excluding PRs)
                issues_count = 0
                issues_url = f"{base_url}/issues"
                issues_params = {"state": "closed", "since": since}

                issues_response = client.get(issues_url, headers=headers, params=issues_params)
                issues_response.raise_for_status()

                while issues_response.status_code == 200:
                    issues_count += sum(1 for issue in issues_response.json() if "pull_request" not in issue)

                    if "Link" in issues_response.headers and 'rel="next"' in issues_response.headers["Link"]:
                        next_url = [
                            link.split(";")[0].strip("<> ")
                            for link in issues_response.headers["Link"].split(",")
                            if 'rel="next"' in link
                        ][0]
                        issues_response = client.get(next_url, headers=headers)
                    else:
                        break

                # Get PRs
                prs_url = f"{base_url}/pulls"
                merged_count = 0
                closed_count = 0

                # First get merged PRs
                pr_params = {"state": "closed", "sort": "updated", "direction": "desc"}
                pr_response = client.get(prs_url, headers=headers, params=pr_params)
                pr_response.raise_for_status()

                while pr_response.status_code == 200:
                    for pr in pr_response.json():
                        # Check if PR was updated in the last year
                        if datetime.strptime(pr["updated_at"], "%Y-%m-%dT%H:%M:%SZ") < datetime.now() - timedelta(days=365):
                            break

                        if pr["merged_at"]:
                            merged_count += 1
                        else:
                            closed_count += 1

                    if "Link" in pr_response.headers and 'rel="next"' in pr_response.headers["Link"]:
                        next_url = [
                            link.split(";")[0].strip("<> ")
                            for link in pr_response.headers["Link"].split(",")
                            if 'rel="next"' in link
                        ][0]
                        pr_response = client.get(next_url, headers=headers)
                    else:
                        break

                return {"closed_issues": issues_count, "merged_prs": merged_count, "closed_unmerged_prs": closed_count}

        except httpx.HTTPError as e:
            print(f"Error fetching repository stats: {e}")
            return None


    def get_repo_activity(owner: str, repo: str):
        headers = {"Accept": "application/vnd.github.v3+json", "Authorization": f"Bearer {os.getenv('GH_TOKEN')}"}

        # GraphQL query for discussions (REST API doesn't support discussions)
        graphql_url = "https://api.github.com/graphql"
        query = """
        query($owner:String!, $repo:String!) {
        repository(owner: $owner, name: $repo) {
            discussions(first: 100, answered: true, orderBy: {field: UPDATED_AT, direction: DESC}) {
            totalCount
            nodes {
                answerChosenAt
            }
            }
        }
    }
    """

        with httpx.Client() as client:
            # Get discussions via GraphQL
            response = client.post(
                graphql_url, json={"query": query, "variables": {"owner": owner, "repo": repo}}, headers=headers
            )
            response.raise_for_status()

            one_year_ago = datetime.now() - timedelta(days=365)
            data = response.json()

            return sum(
                1
                for discussion in data["data"]["repository"]["discussions"]["nodes"]
                if datetime.strptime(discussion["answerChosenAt"], "%Y-%m-%dT%H:%M:%SZ") > one_year_ago
            )


    main()
    ```

[WakaTime]: https://wakatime.com/
[Logfire]: https://github.com/pydantic/logfire
[Starlette]: https://www.starlette.io/
[57 million]: https://pypistats.org/packages/starlette
[Uvicorn]: https://www.uvicorn.org/
[49 million]: https://pypistats.org/packages/uvicorn
[Python Multipart]: https://multipart.fastapiexpert.com
[25 million]: https://pypistats.org/packages/python-multipart
