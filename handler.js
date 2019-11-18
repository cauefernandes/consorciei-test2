'use strict';

const crypto = require('crypto');
const mysql = require( 'mysql' );
const { RDSData } = require("@aws-sdk/client-rds-data-node/RDSData");
const rdsData = new RDSData({});
const rdsParams = {
  resourceArn: process.env.DB_RESOURCE_ARN,
  secretArn: process.env.DB_SECRET_ARN,
  database: "cms",
  sql: "",
};

const data = require('data-api-client')({
  resourceArn: process.env.DB_RESOURCE_ARN,
  secretArn: process.env.DB_SECRET_ARN,
  database: "cms",
})



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


module.exports.createPosts = function (event, context, callback) {

  const requestBody = JSON.parse(event.body);
  const title = requestBody.title;
  const subtitle = requestBody.subtitle;
  const content = requestBody.content;
  const imgurl = requestBody.imgUrl;

  if (!title || !subtitle || !content) {
    const responseBody = {
      status: false,
      message: "Missing parameters"
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


  rdsParams.sql = `INSERT INTO posts (title, subtitle, content, imgUrl) VALUES \
    ('${title}', '${subtitle}', '${content}', '${imgurl}')`;

  rdsData.executeStatement(rdsParams, (err, data) => {
    var responseCode;
    var responseBody = {};
    if (err) {
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


module.exports.updatePosts = function (event, context, callback) {

  const requestBody = JSON.parse(event.body);
  const postid = requestBody.postid;
  const title = requestBody.title;
  const subtitle = requestBody.subtitle;
  const content = requestBody.content;
  const imgurl = requestBody.imgUrl;

  if (!postid) {
    const responseBody = {
      status: false,
      message: "Missing Post ID"
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

var setparams = {};

if(title){
  setparams.title = title;
}
if(subtitle){
  setparams.subtitle = subtitle;
}
if(content){
  setparams.content = content;
}
if(imgurl){
  setparams.imgurl = imgurl;
}

var whereclause = {
      post_id: postid
  };

  rdsParams.sql = mysql.format( 'UPDATE posts SET ? WHERE ?', [setparams, whereclause]);

  rdsData.executeStatement(rdsParams, (err, data) => {
    var responseCode;
    var responseBody = {};
    if (err) {
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


module.exports.deletePosts = function (event, context, callback) {

  const requestBody = JSON.parse(event.body);
  const postid = requestBody.postid;

  if (!postid) {
    const responseBody = {
      status: false,
      message: "Missing Post ID"
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

var setparams = {};
setparams.active = 0;

var whereclause = {
      post_id: postid
  };

  rdsParams.sql = mysql.format( 'UPDATE posts SET ? WHERE ?', [setparams, whereclause]);

  rdsData.executeStatement(rdsParams, (err, data) => {
    var responseCode;
    var responseBody = {};
    if (err) {
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


module.exports.getPosts = async function (event, context, callback) {

try{
  let result = await data.query(`SELECT * FROM posts where active = 1;`)
    var responseBody = {};
    var responseCode = 200;
      responseBody.status = true;

      responseBody.body = result.records;
    }
    catch(err){
      responseCode = 500;
      responseBody.status = false;
      responseBody.message = err;
    }


    var response = {
      statusCode: responseCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseBody)
    };

    callback(null, response);
}
