const express = require('express');
const jiraApi = require('jira-client');
const atob = require('atob');
const router = express.Router();

//Create new issue
router.post('/issue', async (req, res) => {
  console.log('Inside create new issue');
  try {
    const jira = new jiraApi({
      protocol: 'https',
      host: req.body.jiraHost,
      username: atob(req.body.username),
      password: atob(req.body.password),
      apiVersion: '2',
      strictSSL: true,
    });

    const issueJSON = { fields: JSON.parse(req.body.fieldValues) };
    const createIssueResponse = await jira.addNewIssue(issueJSON);
    console.log(JSON.stringify(createIssueResponse));
    res.json(createIssueResponse);
  } catch (error) {
    const errorMessage = `Error while creating JIRA issue: ${error}`;
    // eslint-disable-next-line no-console
    console.error(errorMessage);
    res.status(500).json({ message: `${error}` });
  }
});

module.exports = router;
