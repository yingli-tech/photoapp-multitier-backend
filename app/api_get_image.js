//
// API function: get /image
//
// Download an image in the database.
//
// Author: Ying Li
// Template adapted from Northwestern University coursework (Prof. Joe Hummel)
//
//

const mysql2 = require('mysql2/promise');

const { get_dbConn, get_bucket, get_bucket_name } = require('./helper.js');
const { GetObjectCommand } = require("@aws-sdk/client-s3");
//
// p_retry requires the use of a dynamic import:
// const pRetry = require('p-retry');
//
const pRetry = (...args) => import('p-retry').then(({default: pRetry}) => pRetry(...args));


/**
 * get_image:
 *
 * @description downloads an image denoted by the given asset id. If
 * successful a JSON object of the form {message: string, userid: int,
 * local_filename: string, data: base64-encoded string} is sent where
 * message is "success" and the remaining values are set based on the
 * image downloaded; data is image contents as base64-encoded string.
 * If an error occurs, a status code of 500 is sent where JSON object's
 * message is the error message and userid is -1; the other values are
 * undefined. An invalid assetid is considered a client-side error,
 * resulting in a status code 400 with a message "no such assetid"
 * and a userid of -1; the other values are undefined.
 *
 * @param assetid (required URL parameter) of image to download
 * @returns JSON {message: string, userid: int, local_filename: string,
data: base64-encoded string}
 */
exports.get_image = async (request, response) => {

  console.log("**Call to get /image...");

  let assetid = request.params.assetid;

  //
  // validate assetid
  //
  async function try_get_metadata() {

    let dbConn;

    try {
      dbConn = await get_dbConn();

      let sql = `
        SELECT userid, localname, bucketkey
        FROM assets
        WHERE assetid = ?;
      `;

      let [rows, _] = await dbConn.execute(sql, [assetid]);

      if (rows.length === 0) {
        return null;  // invalid assetid
      }

      return rows[0];
    }
    finally {
      try { await dbConn.end(); } catch (err) {}
    }
  }

  let metadata;

  try {
    metadata = await pRetry(() => try_get_metadata(), { retries: 2 });

    if (metadata === null) {
      return response.status(400).json({
        message: "no such assetid",
        userid: -1
      });
    }
  }
  catch (err) {
    return response.status(500).json({
      message: err.message,
      userid: -1
    });
  }

  let userid = metadata.userid;
  let local_filename = metadata.localname;
  let bucketkey = metadata.bucketkey;

  //
  // download
  //
  try {

    let bucket = get_bucket();

    let parameters = {
      Bucket: get_bucket_name(),
      Key: bucketkey,
    };

    let command = new GetObjectCommand(parameters);

    let results_s3 = await bucket.send(command);

    //
    // convert stream → base64 string (async)
    //
    let image_str = await results_s3.Body.transformToString("base64");

    response.json({
      message: "success",
      userid: userid,
      local_filename: local_filename,
      data: image_str
    });

  }
  catch (err) {
    response.status(500).json({
      message: err.message,
      userid: -1
    });
  }

};