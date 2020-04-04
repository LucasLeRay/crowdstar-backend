const AWS = require('aws-sdk')

function sendEmail(to, subject, messageText, messageHTML) {
  const SES = new AWS.SES({ apiVersion: '2010-12-01' })
  const params = {
    Destination: {
      ToAddresses: [
        to,
      ],
    },
    Message: {
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: messageText,
        },
        Html: {
          Data: messageHTML,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: 'no-reply@crowdstar.xyz', /* required */
  }

  return SES.sendEmail(params).promise()
}

module.exports = sendEmail
