//All of these can be constants.. check once
var express = require('express');
var JiraApi = require('jira-client');
var btoa = require('btoa');
const axios = require("axios");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Spyro Server Home Page' });
});

// Create event post call
router.post('/event', (req, res, next) => {
  console.log("Inside create event post call");

    const eventParams = req.body;
    const username = eventParams.username;
    const password = eventParams.password;

     const createEventTypeUrl = `${eventParams.splunkAPIURL}/${username}/${eventParams.splunkApp}/saved/eventtypes`;
     const basicAuth = `Basic ${btoa(`${username}:${password}`)}`;

     const formData = `name=${encodeURIComponent(eventParams.jiraIdentifier)}&priority=5&disabled=0&description=${encodeURIComponent(
      eventParams.jiraIdentifier,
     )}&search=${eventParams.searchString}`;
 
     const headers = {
       'Content-type': 'application/x-www-form-urlencoded',
       Authorization: basicAuth,
     };

      axios.post(createEventTypeUrl, formData, { headers }).then(response => res.json(response.data))
      .catch(err => {
        res.status(err.response.status).json({ message: `${err.response.statusText}` });
      });
});

//Change event permissions
router.post('/event/permission', (req, res, next) => {
  console.log("Inside update event post call");

    const eventParams = req.body;
    const username = eventParams.username;
    const password = eventParams.password;

     const updateEventTypeUrl = `${eventParams.splunkAPIURL}/${username}/${eventParams.splunkApp}/saved/eventtypes/${eventParams.jiraIdentifier}/acl`;
     const basicAuth = `Basic ${btoa(`${username}:${password}`)}`;

     const formData = `perms.read=${encodeURIComponent('*')}&perms.write=${encodeURIComponent(
      '*',
    )}&sharing=app&owner=${encodeURIComponent(username)}`;
 
     const headers = {
       'Content-type': 'application/x-www-form-urlencoded',
       Authorization: basicAuth,
     };

      axios.post(updateEventTypeUrl, formData, { headers }).then(response => res.json(response.data))
      .catch(err => {
        res.status(err.response.status).json({ message: `${err.response.statusText}` });
      });
});

//Create new issue
router.post('/jira/issue', async (req, res, next) => {
  console.log('Inside create new issue');
  try {
    const jira = new JiraApi({
      protocol: 'https',
      host: req.body.jiraHost,
      username: req.body.username,
      password: req.body.password,
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
    res.status(500).json({ message: `${errorMessage}` });
  }

});

module.exports = router;
