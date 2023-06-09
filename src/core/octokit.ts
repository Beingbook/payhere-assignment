import { Octokit } from "octokit";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export function searchRepos({
  query,
  perPage = 40,
  page = 1,
}: {
  query: string;
  page?: number;
  perPage?: number;
}) {
  return octokit.rest.search.repos({ q: query, per_page: perPage, page });
}

export async function fetchIssuesForMultiRepos({
  candidates,
  page = 1,
  perPage = 40,
}: {
  candidates: { owner: string; name: string }[];
  page?: number;
  perPage?: number;
}) {
  const candidatePerPage = Math.ceil(perPage / candidates.length);

  return (
    await Promise.all(
      candidates.map(({ owner, name }) =>
        fetchIssues({ owner, repo: name, page, perPage: candidatePerPage })
      )
    )
  )
    .flatMap((x) => x.data)
    .sort((a, b) => {
      if (a.created_at > b.created_at) {
        return -1;
      }
      if (a.created_at < b.created_at) {
        return 1;
      }
      return 0;
    });
}

function fetchIssues({
  owner,
  repo,
  page,
  perPage = 40,
}: {
  owner: string;
  repo: string;
  page: number;
  perPage?: number;
}) {
  return octokit.rest.issues
    .listForRepo({
      owner,
      repo,
      page,
      per_page: perPage,
    })
    .then((result) => {
      return {
        ...result,
        data: result.data.map((x) => ({ ...x, repo, owner })),
      };
    });
}
