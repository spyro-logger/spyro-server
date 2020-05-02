const express = require("express");
const axios = require("axios");
const moment = require("moment");

const router = express.Router();

const getFormattedDateTime = dateTime => {
  return moment(dateTime).format("MM/DD/YY h:mm:ss A");
};

const populateSearchRange = (earliestTime, latestTime) => {
  return `${getFormattedDateTime(earliestTime)} to ${getFormattedDateTime(
    latestTime
  )}`;
};

const populateRequiredJobDetails = (
  jobBySIDResponse,
  jobFirstEventResponse,
  jobSummaryResponse
) => {
  const jobDetails = {};
  const jobFields = jobSummaryResponse.data.fields;

  // eslint-disable-next-line no-underscore-dangle
  jobDetails.stackTrace = jobFirstEventResponse.data.results[0]._raw;
  jobDetails.occurences = jobBySIDResponse.data.entry[0].content.eventCount;
  jobDetails.searchString =
    jobBySIDResponse.data.entry[0].content.custom.search;
  jobDetails.searchRange = populateSearchRange(
    jobBySIDResponse.data.entry[0].content.earliestTime,
    jobBySIDResponse.data.entry[0].content.latestTime
  );

  jobDetails.fields = [...Object.entries(jobFields)]
    .map(([key, value]) => {
      return {
        key,
        value: value.modes
          .map(mode => `${mode.value} (${mode.count})`)
          .join(", ")
      };
    })
    .reduce((accumulator, entry) => {
      return {
        ...accumulator,
        [entry.key]: entry.value
      };
    }, []);

  return jobDetails;
};

/* GET Splunk Job details. */
router.get("/jobDetails", (req, res) => {
  const { splunkAPIURL } = req.query;
  const { splunkApp } = req.query;
  const { searchId } = req.query;

  const retrieveJobBySIDUrl = `${splunkAPIURL}/nobody/${splunkApp}/search/jobs/${searchId}?output_mode=json`;
  const retrieveJobSummaryUrl = `${splunkAPIURL}/nobody/${splunkApp}/search/jobs/${searchId}/summary?output_mode=json`;
  const retrieveJobFirstEventUrl = `${splunkAPIURL}/nobody/${splunkApp}/search/jobs/${searchId}/events?count=1&f=_raw&output_mode=json`;

  const headersJson = { headers: { authorization: req.headers.authorization } };

  return new Promise(() => {
    axios
      .all([
        axios.get(retrieveJobBySIDUrl, headersJson),
        axios.get(retrieveJobFirstEventUrl, headersJson),
        axios.get(retrieveJobSummaryUrl, headersJson)
      ])
      .then(
        axios.spread((jobBySIDResponse, jobFirstEventResponse, jobSummary) => {
          const populatedJobDetails = populateRequiredJobDetails(
            jobBySIDResponse,
            jobFirstEventResponse,
            jobSummary
          );
          res.json(populatedJobDetails);
        })
      )
      .catch(error => {
        const errorMessage = `Error while retrieving splunk job details: ${error}`;
        // eslint-disable-next-line no-console
        console.error(errorMessage);
        // eslint-enable-next-line no-console
        res
          .status(error.response.status)
          .json({ message: `${error.response.statusText}` });
      });
  });
});

/* Create event post call. */
router.post("/event", (req, res) => {
  const eventParams = req.body;
  const createEventTypeUrl = `${eventParams.splunkAPIURL}/nobody/${eventParams.splunkApp}/saved/eventtypes`;

  const formData = `name=${encodeURIComponent(
    eventParams.jiraIdentifier
  )}&priority=5&disabled=0&description=${encodeURIComponent(
    eventParams.jiraIdentifier
  )}&search=${encodeURIComponent(eventParams.searchString)}`;

  const headers = {
    "Content-type": "application/x-www-form-urlencoded",
    Authorization: req.headers.authorization
  };

  axios
    .post(createEventTypeUrl, formData, { headers })
    .then(response => res.json(response.data))
    .catch(err => {
      res
        .status(err.response.status)
        .json({ message: `${err.response.statusText}` });
    });
});

//
/* Post call to change event permissions. */
router.post("/event/permission", (req, res) => {
  const eventParams = req.body;

  const updateEventTypeUrl = `${eventParams.splunkAPIURL}/nobody/${eventParams.splunkApp}/saved/eventtypes/${eventParams.jiraIdentifier}/acl`;

  const formData = `perms.read=${encodeURIComponent(
    "*"
  )}&perms.write=${encodeURIComponent(
    "*"
  )}&sharing=app&owner=${encodeURIComponent(eventParams.owner)}`;

  const headers = {
    "Content-type": "application/x-www-form-urlencoded",
    Authorization: req.headers.authorization
  };

  axios
    .post(updateEventTypeUrl, formData, { headers })
    .then(response => res.json(response.data))
    .catch(err => {
      res
        .status(err.response.status)
        .json({ message: `${err.response.statusText}` });
    });
});

module.exports = router;
