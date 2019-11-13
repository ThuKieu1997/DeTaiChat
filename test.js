var awss3 =require("aws-sdk");
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-2",
  endpoint: "https://dynamodb.us-east-2.amazonaws.com",
 
});
awss3.config.update({
    region: "us-east-2",
})
AWS.config.accessKeyId="AKIAIBR4OIADV2DWDH6A";
AWS.config.secretAccessKey="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";
const docClient = new AWS.DynamoDB.DocumentClient();
var lstFriend = ["01012018000000","01012018000007"];
    
var titleObject = {};
var index = 0;
lstFriend.forEach(function(value) {
    index++;
    var titleKey = ":user_id"+index;
    titleObject[titleKey.toString()] = value;
});
var userId ="201811231201442";
var params = {
    TableName: "post",
    ProjectionExpression: "#post_id,image,likes,#owner,comments,title,postat",
    FilterExpression: "#owner = :owner",
    ExpressionAttributeNames: {
        "#owner":"owner",
        "#post_id": "post_id"
    },
    ExpressionAttributeValues: {
        ":owner":userId
        
   }
};


docClient.scan(params, onScan);
function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        // print all the movies
        console.log("Scan succeeded.");
        data.Items.forEach(function(movie) {
           console.log(movie);
        });

        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}
