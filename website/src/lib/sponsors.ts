export type Sponsor = {
  login: string;
  avatarUrl: string;
};

const QUERY = `
query {
  user(login: "Kludex") {
    ... on Sponsorable {
      sponsors(first: 100) {
        nodes {
          ... on User { login avatarUrl }
          ... on Organization { login avatarUrl }
        }
      }
    }
  }
}
`;

export async function fetchSponsors(): Promise<Sponsor[]> {
  const token = import.meta.env.GH_TOKEN ?? process.env.GH_TOKEN;
  if (!token) {
    console.warn("GH_TOKEN not set, skipping sponsors grid");
    return [];
  }
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data.user.sponsors.nodes.filter((node: Sponsor) => node.login);
  } catch {
    console.warn("sponsors query failed, skipping sponsors grid");
    return [];
  }
}
