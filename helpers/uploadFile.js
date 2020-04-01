const AWS = require('aws-sdk')

async function uploadFile(name, file) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  })
  let imageExtension = file.split(';')[0].split('/')
  imageExtension = imageExtension[imageExtension.length - 1]
  const uploadParams = {
    Bucket: process.env.S3BucketUpload,
    Key: `${name}.${imageExtension}`,
    Body: '',
    ContentType: `image/${imageExtension}`,
    ACL: 'public-read',
  }
  const buffer = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''),
    'base64')
  uploadParams.Body = buffer

  try {
    const res = await s3.upload(uploadParams).promise()
    return res.Location
  } catch (err) {
    console.error(err)
    return null
  }
}

module.exports = uploadFile
