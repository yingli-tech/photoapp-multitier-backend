//
// API function: Delete /images
//
// Returns images for a specific label
//
// Author: Ying Li
// Template adapted from Northwestern University coursework (Prof. Joe Hummel)
//
//

const mysql2 = require('mysql2/promise');
const { get_dbConn, get_bucket, get_bucket_name } = require('./helper.js');
const { DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
//
// p_retry requires the use of a dynamic import:
// const pRetry = require('p-retry');
//
const pRetry = (...args) => import('p-retry').then(({default: pRetry}) => pRetry(...args));


/** 
 * delete_images: 
 *  
 * @description deletes all images and associated labels from the  
 * database and S3. If successful, returns a JSON object of the  
 * form {message: string} where the message is "success". If an 
 * error occurs, message will carry the error message. The images  
 * are not deleted from S3 unless the database is successfully  
 * cleared; if an error occurs either (a) there are no changes or 
 * (b) the database is cleared but there may be one or more images 
 * remaining in S3 (which has no negative effect since they have  
 * unique names). 
 * 
 * @param none 
 * @returns JSON {message: string} 
 */ 
exports.delete_images = async (request, response) => {

  console.log("**Call to DELETE /images...");

  async function try_clear_database() {

    let dbConn;

    try {
      dbConn = await get_dbConn();
      await dbConn.beginTransaction();

      //
      // disable FK checks, clear tables, reset auto increment
      //
      let sql = `
        SET foreign_key_checks = 0;
        TRUNCATE TABLE image_labels;
        TRUNCATE TABLE assets;
        SET foreign_key_checks = 1;
        ALTER TABLE assets AUTO_INCREMENT = 1001;
      `;

      await dbConn.query(sql);

      await dbConn.commit();

      return true;
    }
    catch (err) {
      try { await dbConn.rollback(); } catch (e) {}
      throw err;
    }
    finally {
      try { await dbConn.end(); } catch (e) {}
    }
  }

  //
  // clear DB
  //
  try {
    await pRetry(() => try_clear_database(), { retries: 2 });
  }
  catch (err) {
    return response.status(500).json({
      message: err.message
    });
  }

  //
  // delete objects
  //
  try {

    let bucket = get_bucket();

    //
    // first list objects
    //
    const listParams = {
      Bucket: get_bucket_name()
    };

    const listCommand = {
      Bucket: get_bucket_name()
    };


    let listResults = await bucket.send(new ListObjectsV2Command(listParams));

    if (listResults.Contents && listResults.Contents.length > 0) {

      let objects_to_delete = listResults.Contents.map(obj => ({
        Key: obj.Key
      }));

      let parameters = {
        Bucket: get_bucket_name(),
        Delete: { Objects: objects_to_delete },
      };

      let command = new DeleteObjectsCommand(parameters);

      await bucket.send(command);
    }

  }
  catch (err) {

    //
    // IMPORTANT: DB already cleared
    // S3 failure does not rollback DB
    //
    return response.status(500).json({
      message: err.message
    });
  }

  response.json({
    message: "success"
  });

};
