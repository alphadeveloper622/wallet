const _ = require('underscore');
const core = require('@actions/core');
const github = require('@actions/github');
const GithubUtils = require('../../libs/GithubUtils');

const octokit = github.getOctokit(core.getInput('GITHUB_TOKEN', {required: true}));
const githubUtils = new GithubUtils(octokit);

octokit.issues.listForRepo({
    owner: 'Expensify',
    repo: 'Expensify.cash',
    state: 'open',
})
    .then(response => console.log('Expensify.cash open issues:', response))
    .catch(err => console.log(err));

githubUtils.getStagingDeployCash()
    .then(({labels}) => core.setOutput('IS_LOCKED', _.contains(labels, '🔐 LockCashDeploys 🔐')))
    .catch((err) => {
        console.warn('No open StagingDeployCash found, continuing...', err);
        core.setOutput('IS_LOCKED', false);
    });
