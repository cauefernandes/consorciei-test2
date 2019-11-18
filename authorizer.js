const jwt = require('jsonwebtoken');

module.exports.auth = (event, context, callback) => {
  if (!event.authorizationToken) {
    return callback('Unauthorized');
  }

  const tokenParts = event.authorizationToken.split(' ');
  const tokenValue = tokenParts[1];

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
    return callback('Unauthorized');
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(tokenValue, secret);
    if (decoded.exp < Date.now() / 1000) {
      return callback('Token expired');
    }

    const arnValues = event.methodArn.split(':');
    const apiGatewayArnValues = arnValues[5].split('/');
    const resource = apiGatewayArnValues[3];
    const method = apiGatewayArnValues[2];

    if (!checkPermission(decoded.groupId, resource, method)) {
      return callback('Unauthorized');
    }
    callback(null, generatePolicy('user', 'Allow', event.methodArn));
  } catch (err) {
    callback('Unauthorized');
  }
};

module.exports.signSync = (username, groupId) => {
  const secret = process.env.JWT_SECRET;
  return jwt.sign({
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    username: username,
    groupId: groupId
  }, secret);
}

// Check permission against resource and method
const checkPermission = (groupId, resource, method) => {
  if (resource == 'user') {
    return groupId == 1;
  }
  if (resource == 'cms') {
    if (method == 'DELETE') {
      return groupId == 2;
    }
    return groupId == 2 || groupId == 3;
  }

  return false;
}

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};
