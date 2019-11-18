'use strict';

const crypto = require('crypto');
const { RDSData } = require("@aws-sdk/client-rds-data-node/RDSData");
const rdsData = new RDSData({});
const rdsParams = {
  resourceArn: process.env.DB_RESOURCE_ARN,
  secretArn: process.env.DB_SECRET_ARN,
  database: "cms",
  sql: "",
};


module.exports.login = function (event, context, callback) {
  rdsParams.sql = "select * from groups";

  rdsData.executeStatement(rdsParams, (err, data) => {
    console.log(err);
    callback(err, data.records);
  });
}

module.exports.createUser = function (event, context, callback) {
  const requestBody = JSON.parse(event.body);
  const username = requestBody.username;
  const password = requestBody.password;
  const groupId = requestBody.accessGroupId;

  if (!username || !password || !groupId) {
    const responseBody = {
      status: false,
      message: "Invalid parameters"
    }
    const response = {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseBody)
    };
    callback(null, response);
    return;
  }

  const passwordSalt = process.env.PASSWORD_SALT;
  const passwordHash = crypto.pbkdf2Sync(password, passwordSalt, 1000, 64, 'sha512').toString('hex');
  rdsParams.sql = `INSERT INTO users (username, password, accessGroupId) VALUES \
    ('${username}', '${passwordHash}', ${groupId})`;

  rdsData.executeStatement(rdsParams, (err, data) => {
    var responseCode;
    var responseBody = {};
    if (err) {
      console.log(error);
      responseCode = 500;
      responseBody.status = false;
      responseBody.message = err;
    } else {
      responseCode = 200;
      responseBody.status = true;
    }
    var response = {
      statusCode: responseCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseBody)
    };

    callback(null, response);
  });
}
