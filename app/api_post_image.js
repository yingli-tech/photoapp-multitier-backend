//
// API function: post /images
//
// Adds a new image to the database.
//
// Author: Ying Li
// Template adapted from Northwestern University coursework (Prof. Joe Hummel)
//
//

const mysql2 = require('mysql2/promise');
const { get_dbConn, get_bucket, get_bucket_name, get_rekognition } = require('./helper.js');
//
// p_retry requires the use of a dynamic import:
// const pRetry = require('p-retry');
//
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { DetectLabelsCommand } = require("@aws-sdk/client-rekognition");

const uuid = require("uuid");

const pRetry = (...args) => import('p-retry').then(({default: pRetry}) => pRetry(...args));


/**
 * post_image:
 *
 * @description uploads an image with a unique name to S3, allowing the
 * same local file to be uploaded multiple times if desired. A record
 * of this image is inserted into the database, and upon success a JSON
 * object of the form {message: ..., assetid: ...} is sent where message is
 * "success" and assetid is the unique id for this image in the database.
 * The image is also analyzed by the Rekognition AI service to label
 * objects within the image; the results of this analysis are also saved
 * in the database (and can be retrieved later via GET /image_labels).
 * If an error occurs, a status code of 500 is sent where the JSON object's
 * message is the error message and assetid is -1. An invalid userid is
 * considered a client-side error, resulting in a status code 400 with
 * a message "no such userid" and an assetid of -1.
 *
 * @param userid (required URL parameter) for whom we are uploading this image
 * @param request body {local_filename: string, data: base64-encoded string}
 * @returns JSON {message: string, assetid: int}
 */
exports.post_image = async (request, response) => {

  console.log("**Call to POST /images...");

  console.log("POST body:", request.body);
  console.log("userid:", request.params.userid);

  let userid = request.params.userid;

  let local_filename = request.body.local_filename;

  let image_base64 = request.body.data;

  if (!local_filename || !image_base64){
    return response.status(400).json({
      "message": "missing local_filename or data",
      "assetid": -1,
    });
  }

  async function try_validate_user()
  {
    let dbConn;

    try {
      //
      // open connection to database:
      //
      dbConn = await get_dbConn();

      let sql = `SELECT username FROM users WHERE userid = ?;`;

      let [rows, _] = await dbConn.execute(sql, [userid]);

      if (rows.length === 0){
        return null; // no such userid
      }

      return rows[0].username;
    }
    finally{
      try { await dbConn.end();} catch(err){}
    }
  }

  let username;
  try {
    username = await pRetry(() => try_validate_user(),{ retries: 2 });

    if(username === null) {
      return response.status(400).json({
        message: "no such userid",
        assetid: -1,
      });
    }
  }
  catch(err) {
    return response.status(500).json({
      message: err.message,
      assetid: -1,
    });
  }

  let unique_str = uuid.v4();
  let bucketkey = `${username}/${unique_str}_${local_filename}`;


let image_bytes = Buffer.from(image_base64, 'base64');


try {
  let s3 = get_bucket();

  let parameters = {
    Bucket: get_bucket_name(),
    Key: bucketkey,
    Body: image_bytes,
  };

  let command = new PutObjectCommand(parameters);
  
  await s3.send(command);
}
catch(err) {
  return response.status(500).json({
    message: err.message,
    assetid: -1
  })
}

async function try_inset_asset() {
  let dbConn;
  
  try {
    dbConn = await get_dbConn();
    await dbConn.beginTransaction();
    
    let sql = `
        INSERT INTO assets (userid, localname, bucketkey) 
        VALUES (?, ?, ?);
        `;

    let [result] = await dbConn.execute(sql, [userid, local_filename, bucketkey]);
    
    let assetid = result.insertId;

    await dbConn.commit();
    
    return assetid;
  }
  catch(err) {
    try { await dbConn.rollback(); } catch(e) {}
    throw err;
  }
  finally {
    try { await dbConn.end(); } catch(err) {}
  }
}

let assetid;

try {
  assetid = await pRetry(() => try_inset_asset(), { retries: 2 });   
}
catch(err) {
  return response.status(500).json({
    message: err.message,
    assetid: -1
  });
}

let labels = [];

  try {
    let rekognition = get_rekognition();

    let parameters = {
      Image: {
        S3Object: {
          Bucket: get_bucket_name(),
          Name: bucketkey,
        },
      },
      MaxLabels: 100,
      MinConfidence: 80.0,
    };

    let command = new DetectLabelsCommand(parameters);
    let result = await rekognition.send(command);

    labels = result.Labels || [];
  }
  catch (err) {
    console.log("Rekognition error:", err.message);
    // do not fail whole request
  }


  async function try_insert_labels() {
    if (labels.length === 0) return;

    let dbConn;

    try {
      dbConn = await get_dbConn();
      await dbConn.beginTransaction();

      let sql = `
        INSERT INTO image_labels (assetid, label_name, confidence)
        VALUES (?, ?, ?);
      `;

      for (let label of labels) {
        await dbConn.execute(sql, [
          assetid,
          label.Name,
          parseInt(label.Confidence)
        ]);
      }

      await dbConn.commit();
    }
    catch (err) {
      try { await dbConn.rollback(); } catch(e) {}
      throw err;
    }
    finally {
      try { await dbConn.end(); } catch(e) {}
    }
  }

  try {
    await pRetry(() => try_insert_labels(), { retries: 2 });
  }
  catch (err) {
    return response.status(500).json({
      message: err.message,
      assetid: -1
    });
  }

  console.log("sending response:", assetid);

  //
  // Success
  //
  response.json({
    message: "success",
    assetid: assetid
  });

};