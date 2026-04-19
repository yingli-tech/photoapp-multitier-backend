//
// Defines important app-wide config parameters
//
// Web service configuration parameters, separate from the
// photoapp-config file which contains AWS-specific config
// information (e.g. pwds and access keys which we don't
// want in the code).
//
// Author: Ying Li
// Template adapted from Northwestern University coursework (Prof. Joe Hummel)
//

const config = {
  photoapp_config_filename: "photoapp-config.ini",
  photoapp_s3_profile: ...,
  web_service_port: ...,
  response_page_size: ...
};

module.exports = config;
