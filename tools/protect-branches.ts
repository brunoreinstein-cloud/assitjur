import { Octokit } from "@octokit/rest";

const token = process.env.GITHUB_TOKEN;
const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;

if (!token || !owner || !repo) {
  console.error("Missing required environment variables.");
  console.error("Please set GITHUB_TOKEN, REPO_OWNER and REPO_NAME.");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });
const branches = ["main", "develop"];
const requiredChecks = ["build"];

async function protect(branch: string) {
  await octokit.repos.updateBranchProtection({
    owner,
    repo,
    branch,
    required_status_checks: {
      strict: true,
      checks: requiredChecks.map((context) => ({ context })),
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 2,
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
  });
  console.log(`Branch protection configured for ${branch}`);
}

async function main() {
  for (const branch of branches) {
    await protect(branch);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
