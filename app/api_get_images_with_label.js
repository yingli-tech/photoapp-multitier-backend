//
// API function: get /images_with_label
//
// Returns images for a specific label
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
 * get_images_with_label 
 *  
 * @description when an image is uploaded to S3, the Rekognition  
 * AI service is automatically called to label objects in the image.  
 * These labels are then stored in the database for retrieval / search. 
 * Given a label (partial such as 'boat' or complete 'sailboat'), this  
 * function performs a case-insensitive search for all images with 
 * this label. If successful the labels are returned as a JSON object  
 * of the form {message: ..., data: ...} where message is "success" and 
 * data is a list of dictionary-like objects of the form {"assetid": int, 
 * "label": string, "confidence": int}, ordered by assetid and then label. 
 * If an error occurs, status code of 500 is sent where JSON object's 
 * message is the error message and the list is empty. 
 * 
 * @param label (required URL parameter) to search for, can be a partial word (e.g. 
boat) 
 * @returns JSON {message: string, data: [object, object, ...]}  
 */ 
exports.get_images_with_label = async (request, response) => {

  console.log("**Call to Get /images_with_label...");

  let label = request.params.label;

  //
  // inner function for MySQL call (with retry)
  //
  async function try_search_labels() {

    let dbConn;

    try {
      dbConn = await get_dbConn();

      //
      // case-insensitive partial search
      //
      let search_pattern = `%${label}%`;

      let sql = `
        SELECT assetid, label_name, confidence
        FROM image_labels
        WHERE LOWER(label_name) LIKE LOWER(?)
        ORDER BY assetid ASC, label_name ASC;
      `;

      let [rows, _] = await dbConn.execute(sql, [search_pattern]);

      //
      // format rows
      //
      let formatted = rows.map(row => ({
        assetid: row.assetid,
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
  // call with retry (max 3 attempts)
  //
  try {

    let results = await pRetry(() => try_search_labels(), { retries: 2 });

    response.json({
      message: "success",
      data: results
    });

  }
  catch (err) {

    response.status(500).json({
      message: err.message,
      data: []
    });
  }

};