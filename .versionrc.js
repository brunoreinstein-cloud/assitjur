module.exports = {
  preset: "conventionalcommits",
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "docs", section: "Documentation" },
    { type: "style", section: "Styles" },
    { type: "refactor", section: "Refactoring" },
    { type: "test", section: "Tests" },
    { type: "chore", section: "Chores" },
    { type: "security", section: "Security" },
    { type: "perf", section: "Performance" },
  ],
};
