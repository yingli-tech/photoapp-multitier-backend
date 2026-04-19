//
// API function: get /image_labels
//
// Returns image labels for a certain assetid
//
// Author: Ying Li
// Template adapted from Northwestern University coursework (Prof. Joe Hummel)
//
//

const mysql2 = require('mysql2/promise');
const { get_dbConn } = require('./helper.js');
//
// p_retry requires the use of a dynamic import:
// const pRetry = require('p-retry');
//
const pRetry = (...args) => import('p-retry').then(({default: pRetry}) => pRetry(...args));


/** 
 * get_image_labels 
 *  
 * @description when an image is uploaded to S3, the Rekognition  
 * AI service is automatically called to label objects in the image.  
 * Given the image assetid, this function retrieves those labels.  
 * If successful the labels are returned as a JSON object of the 
 * form {message: ..., data: ...} where message is "success" and 
 * data is a list of dictionary-like objects of the form  
 * {"label": string, "confidence": int}, ordered by label. If 
 * an error occurs, status code of 500 is sent where JSON object's 
 * message is the error message and the list is empty []. An  
 * invalid assetid is considered a client-side error, resulting 
 * in status code 400 with a message "no such assetid" and an empty 
 * list []. 
 * 
 * @param assetid (required URL parameter) of image to retrieve labels for 
 * @returns JSON {message: string, data: [object, object, ...]}  
 */
exports.get_image_labels = async (request, response) => {

  console.log("**Call to Get /image_labels...");

  let assetid = request.params.assetid;

  async function try_get_labels() {

    let dbConn;

    try {
      dbConn = await get_dbConn();

      //
      // validate assetid
      //
      let sql_check = `
        SELECT COUNT(*) AS count
        FROM assets
        WHERE assetid = ?;
      `;

      let [rows_check, _1] = await dbConn.execute(sql_check, [assetid]);

      if (rows_check[0].count === 0) {
        return null;  // invalid assetid
      }

      //
      // retrieve labels from database
      //
      let sql_labels = `
        SELECT label_name, confidence
        FROM image_labels
        WHERE assetid = ?
        ORDER BY label_name ASC;
      `;

      let [rows_labels, _2] = await dbConn.execute(sql_labels, [assetid]);

      //
      // format output to match required JSON
      //
      let formatted = rows_labels.map(row => ({
        label: row.label_name,
        confidence: parseInt(row.confidence)
      }));

      return formatted;
    }
    finally {
      try { await dbConn.end(); } catch (err) {}
    }
  }

  //
  // call with retry (at most 3 times total)
  //
  try {

    let labels = await pRetry(() => try_get_labels(), { retries: 2 });

    if (labels === null) {
      return response.status(400).json({
        message: "no such assetid",
        data: []
      });
    }

    response.json({
      message: "success",
      data: labels
    });

  }
  catch (err) {

    response.status(500).json({
      message: err.message,
      data: []
    });
  }

};