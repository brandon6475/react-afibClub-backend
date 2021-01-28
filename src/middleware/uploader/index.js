import AWS from 'aws-sdk';
import config from '../../config';
import logger from '../logger';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: config.aws_access_key_id,
  secretAccessKey: config.aws_secret_access_key
});

class S3Uploader {
  uploadFile(file) {
    try {
      const fileContent = fs.readFileSync(file.path);
      let extension = "png";
      if (file.name.lastIndexOf('.') > -1) {
        extension = file.name.split('.')[1];
      }
      const params = {
        Bucket: config.s3_bucket_name,
        Key: `${uuidv4()}.${extension}`,
        Body: fileContent
      };
      
      let s3upload = s3.upload(params).promise();
      return s3upload.then(data => {
        logger.info(`File uploaded successfully. ${data.Location}`);
        return data;
      })
      .catch(err => {
        throw err;
      });
    } catch (err) {
      logger.error("Error uploading to s3 :", err);
      throw err;
    }
  }

  readFile(file) {
    try {
      let splitted = file.split("/");
      let name = splitted[splitted.length - 1];
      let download = s3.getObject({
        Bucket: config.s3_bucket_name,
        Key: name
      }).promise();
      
      return download.then(data => {
        return data.Body;
      })
      .catch(err => {
        throw err;
      });
    } catch (err) {
      logger.error("Error reading file:", err);
      throw err;
    }
  }
}

const s3uploader = new S3Uploader();
export default s3uploader;