#
# Pre-reqs:
#   1. requires python3
#   2. requires setup of AWSCLI (see project 01, part 01)
#   3. requires aws EB CLI
#         pip3 install awsebcli --upgrade --user
#

#
# Application variables:
#
$APP_NAME="photoapp-web-service"
$ENV_NAME="photoapp-web-service-env"
$REGION=...
$PLATFORM="Node.js"
$HARDWARE="t3.micro"
$ZIPFILE="app.zip"

#
# Network-related variables:
#
$VPCID="vpc-...."
$VPCSUBGROUPS="...."

#
# start of script:
#
echo ""
echo "1. initializing EB"

eb init $APP_NAME `
        --platform $PLATFORM `
        --region $REGION 

#
# drop down into ./app sub-dir and zip the contents:
#
echo ""
echo "2. packaging app"
rm -force *.zip *> $null
pushd ./app *> $null
rm -force *.zip *> $null
compress-archive -path * -destinationpath $ZIPFILE
mv $ZIPFILE .. *> $null
popd *> $null

#
# now create a new web service and deploy the .zip:
#
# NOTE: we create with AWS sample app, then update with
# our app. Strange, but it's the simplest way to work 
# with .zip files of our code.
#
echo ""
echo "3. Creating environment on EB..."

eb create $ENV_NAME `
          --instance_type $HARDWARE `
          --platform $PLATFORM `
          --vpc.id $VPCID `
          --vpc.ec2subnets $VPCSUBGROUPS `
          --single `
          --sample `
          --service-role aws-elasticbeanstalk-service-role `
          --instance_profile aws-elasticbeanstalk-ec2-role 

echo ""
echo "4. Deploying app to EB..."

eb deploy $ENV_NAME `
         --archive $ZIPFILE `
         --region $REGION

echo ""
echo "Done! You can use 'eb status' to check status of web service."
echo ""

echo ""
echo "5. Configuring for basic health monitoring..."
aws elasticbeanstalk update-environment `
--environment-name $ENV_NAME `
--option-settings Namespace=aws:elasticbeanstalk:healthreporting:system,OptionName=SystemType,Value=basic
