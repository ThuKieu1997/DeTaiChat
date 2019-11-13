
var awss3 =require("aws-sdk");
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-2",
  endpoint: "https://dynamodb.us-east-2.amazonaws.com",
 
});
awss3.config.update({
    region: "us-east-2",
})
AWS.config.accessKeyId="AKIAJGRJV7UJFKD4HDPQ";
AWS.config.secretAccessKey="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";
const docClient = new AWS.DynamoDB.DocumentClient();
var multer = require('multer');
var multerS3 = require('multer-s3');
module.exports={
    
     getUserById: function(id) {
        var params = {
            TableName: "users",
            Key:{
                "user_id": id,
               
            }
        };
        
        return docClient.get(params).promise();
    },
    getUserByEmail: function(email) {
                
        
        var params = {
            TableName: "users",
            ProjectionExpression: "email,actived, user_id,ten,ngaysinh,sdt,diachi,taikhoan,matkhau,banbe,ketban",
            FilterExpression: "email = :eml ",
            
            ExpressionAttributeValues: {
                ":eml": email,
            
            }
        };

        return docClient.scan(params).promise();
    },
    getUserByPhoneNumber: function(sdt) {
        var params = {
            TableName: "users",
            ProjectionExpression: "#sdt, user_id, ten, email, diachi, ngaysinh, avatar",
            FilterExpression: "#sdt = :sdt",
            ExpressionAttributeNames: {
                "#sdt": "sdt",
            },
            ExpressionAttributeValues: {
                ":sdt": sdt
                
            }
        };

        return docClient.scan(params).promise();
    },
    getListIdFriendByEmailUser: function(email) {
                
        var params = {
            TableName: "users",
            ProjectionExpression: "banbe",
            FilterExpression: "#email = :email",
            ExpressionAttributeNames: {
                "#email": "email",
            },
            ExpressionAttributeValues: {
                 ":email": email 
            }
            
        };
        return docClient.scan(params).promise();
    },
    getListFriendsByIdUser: function(id){
        
        var params = {
            TableName: "list_friend",
            Key:{
                "user_id": id
            }
        };
        return docClient.get(params).promise();
        
    },
    getConversationFromListFriend(user1,user2){
        
        var params = {
            TableName: "conversations",
            ProjectionExpression: "#user1, #user2, list_mes",
            FilterExpression: "#user1 in (:user1,:user2) and #user2 in (:user1,:user2)" ,
            ExpressionAttributeNames: {
                "#user1": "user1",
                "#user2": "user2",
            },
            ExpressionAttributeValues: {
                 ":user1": user1,
                 ":user2": user2
            }
        };
        
        
        return docClient.scan(params).promise();

    },
    createConversation(from,to,mes){
        var conv_id = from + to;
        var sentat = new Date();
        var params = {
            TableName:"conversation",
            Item:{
                "conv_id": conv_id,
              
                "list_mes": [
                    {
                      "content": mes,
                      "from": from,
                      "seenat": sentat,
                      "sentat": null
                    }]
            }
        };

        return docClient.put(params).pro;
    },
    getConversation(user1, user2){
        var conv_id1 = user1 + user2;
        var conv_id2 = user2 + user1;
        var params = {
            TableName: "conversation",
            ProjectionExpression: "#conv_id, list_mes",
            FilterExpression: "#conv_id in (:conv_id1,:conv_id2)" ,
            ExpressionAttributeNames: {
                "#conv_id": "conv_id",
              
            },
            ExpressionAttributeValues: {
                 ":conv_id1": conv_id1,
                 ":conv_id2": conv_id2
            }
        };
        return docClient.scan(params).promise();
    },
    updateListMessage(conv_id,message){
        return docClient.update({
            TableName: 'conversation',
            Key: { conv_id: conv_id },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #list_mes = list_append(if_not_exists(#list_mes, :empty_list), :message)',
            ExpressionAttributeNames: {
              '#list_mes': 'list_mes'
            },
            ExpressionAttributeValues: {
              ':message': [message],
              ':empty_list': []
            }
          },function(err,data){
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            }
        });
    },
    getPostById(postId){
        
        var params = {
            TableName: "post",
            Key:{
                "post_id": postId,
                
            }
        };
        return docClient.get(params).promise();
    },
    getPostByUserId(userId){
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

        return docClient.scan(params).promise();
    },
    createNewRegister(user_id, ten, sdt,email, matkhau){

        var params = {
            TableName:"users",
            Item:{
                "user_id": user_id,
                "avatar": "https://tuankieu.s3.us-east-2.amazonaws.com/1024px-User_icon_2.svg.png",
                "email": email,
                "matkhau": matkhau,
                "sdt": sdt,
                "ten": ten,
                "actived": "none"
              }
        };
        
        docClient.put(params,function(err,data){
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        });
    },
    activeRegister(user_id){
        var params = {
            TableName : "users",
            Key : {
                "user_id": user_id           
            },
            UpdateExpression : "REMOVE actived",
            ReturnValues : "UPDATED_NEW"
        };
        
        console.log("Updating the item...");
        docClient.update(params, function(err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data));
            }
        });
    },
    putDataToS3(file,data){
        var params = {
            Bucket: 'tuankieu',
            Key: file.name,
            Body: data
          };
      
          s3.putObject(params, function (perr, pres) {
            if (perr) {
              console.log("Error uploading data: ", perr);
            } else {
              console.log("Successfully uploaded data to tiennguyen: " + pres);
            }
          });
    },
    uploadImageToS3(){
        var upload = multer({
            storage: multerS3({
                s3: s3,
                bucket: 'tuankieu',
                key: function (req, file, cb) {
                    console.log(file);
                    cb(null,"p"+ logic.generateUserId()+ path.extname(file.originalname)); //use Date.now() for unique file keys
                }
            })
        });
    },
    addNewPost(post_id,title,image,owner,postat,ownerName,ownerAvatar){
        var params = {
            TableName:"post",
            Item:{
                "post_id": post_id,
                "title": title,
                "image": image,
                "owner": owner,
                "postat":postat,
                "owner_name": ownerName,
                "owner_avatar": ownerAvatar,
              }
            
        };
        
        return docClient.put(params).promise();
    },
    requestToAddFriend(requester, receiver){
        return docClient.update({
            TableName: 'users',
            Key: { user_id: receiver },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #ketban = list_append(if_not_exists(#ketban, :empty_list), :requester)',
            ExpressionAttributeNames: {
              '#ketban': 'ketban'
            },
            ExpressionAttributeValues: {
              ':requester': [requester],
              ':empty_list': []
            }
          },function(err,data){
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            }
        });
    },
    getListFriend(listFriend){
        var lst = listFriend;
    
            var titleObject = {};
            var index = 0;
            lst.forEach(function(value) {
                index++;
                var titleKey = ":user_id"+index;
                titleObject[titleKey.toString()] = value;
            });
            var params = {
                TableName: "users",
                ProjectionExpression: "#user_id, avatar, ten",
                FilterExpression: "#user_id in ("+Object.keys(titleObject).toString()+ ")" ,
                ExpressionAttributeNames: {
                    "#user_id": "user_id",
                
                },
                ExpressionAttributeValues: titleObject
            };
            
            return docClient.scan(params).promise();
        
        
    },
    getListAddFriend(listAddFriend){
        var lst = listAddFriend;
    
            var titleObject = {};
            var index = 0;
            lst.forEach(function(value) {
                index++;
                var titleKey = ":user_id"+index;
                titleObject[titleKey.toString()] = value;
            });
            var params = {
                TableName: "users",
                ProjectionExpression: "#user_id, avatar, ten",
                FilterExpression: "#user_id in ("+Object.keys(titleObject).toString()+ ")" ,
                ExpressionAttributeNames: {
                    "#user_id": "user_id",
                
                },
                ExpressionAttributeValues: titleObject
            };
            
            return docClient.scan(params).promise();
        
        
    },
    deleteAddFriend(user,requester){
        return docClient.update({
            TableName: 'users',
            Key: { user_id: user },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'Remove ketban[' + requester + "]",
          }).promise();
    },
    addNewFriend(user,requester){
        return docClient.update({
            TableName: 'users',
                    Key: { user_id: user },
                    ReturnValues: 'ALL_NEW',
                    UpdateExpression: 'set banbe = list_append(if_not_exists(banbe, :empty_list), :message)',
                    ExpressionAttributeValues: {
                      ':message': [requester],
                      ':empty_list': []
                    }
          }).promise();
    },
    acceptAddFriend(user,requester){


        return docClient.update({
            TableName: 'users',
            Key: { user_id: user },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'Remove ketban[' + requester + "]",
          }).promise();
    },
    denyAddFriend(user,requester){
        return docClient.update({
            TableName: 'users',
            Key: { user_id: user },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'Remove ketban[' + requester + "]",
          }).promise();
    },
    getNewFeed(listFriend){
                
        var titleObject = {};
        var index = 0;
        listFriend.forEach(function(value) {
            index++;
            var titleKey = ":user_id"+index;
            titleObject[titleKey.toString()] = value;
        });
        var params = {
            TableName: "post",
            ProjectionExpression: "post_id,#owner, image, title, postat,owner_name,owner_avatar",
            FilterExpression: "#owner in ("+Object.keys(titleObject).toString()+ ")" ,
            ExpressionAttributeNames: {
                "#owner": "owner",
            
            },
            ExpressionAttributeValues: titleObject
        };
                    
        return docClient.scan(params).promise();
        
    },
    updateInformation(userId, attr, value){
        var params = {
            TableName:"users",
            Key:{
                "user_id": userId,
            },
            UpdateExpression: "set "+attr+" = :r",
            ExpressionAttributeValues:{
                ":r": value,
               
            },
            ReturnValues:"UPDATED_NEW"
        };
        return docClient.update(params).promise();
    },
    updateAvatar(userId, value){
        var params = {
            TableName:"users",
            Key:{
                "user_id": userId,
            },
            UpdateExpression: "set avatar = :r",
            ExpressionAttributeValues:{
                ":r": value,
               
            },
            ReturnValues:"UPDATED_NEW"
        };
        return docClient.update(params).promise();
    },
    
    updatePost(lstPost, attr, value){
       
        lstPost.forEach(element => {
            var params = {
                TableName:'post',
                Key:{
                    "post_id": element,
                
                },
                UpdateExpression: "set "+attr+" = :v",
                ExpressionAttributeValues:{
                    ":v":value,
                    
                },
                ReturnValues:"UPDATED_NEW"
            };
            
            console.log("Updating the item...");
            docClient.update(params, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
        });
    }
}