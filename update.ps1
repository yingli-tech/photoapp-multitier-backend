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
$ZIPFILE="app.zip"
$VERSION="app.zip"

$UNIQUE_ID=[guid]::NewGuid().ToString()
$VERSION="$UNIQUE_ID-$ZIPFILE"

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
mv $ZIPFILE ../$VERSION *> $null
popd *> $null

#
# now deploy the .zip:
#
# NOTE: the name of the .zip file is changed to be
# a unique name based on the date. The name has
# to change for EB to actually deploy (otherwise it
# thinks this is the same code as before).
#
echo ""
echo "3. Deploying app to EB..."

eb deploy $ENV_NAME `
         --archive $VERSION `
         --region $REGION

echo ""
echo "Done! You can use 'eb status' to check status of web service."
echo ""
