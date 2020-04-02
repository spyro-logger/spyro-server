const express = require("express");
const axios = require("axios");

const router = express.Router();

/* POST call to create new issue. */
router.post("/issue", async (req, res) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: req.headers.authorization
  };
  const createJIRAUrl = `https://${req.body.jiraHost}/rest/api/2/issue`;
  const createIssuePayload = JSON.stringify({ fields: req.body.fieldValues });

  axios
    .post(createJIRAUrl, createIssuePayload, { headers })
    .then(response => res.json(response.data))
    .catch(err => {
      res
        .status(err.response.status)
        .json({ message: `${err.response.statusText}` });
    });
});

module.exports = router;
