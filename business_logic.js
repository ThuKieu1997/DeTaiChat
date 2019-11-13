var path = require('path')
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-2",
  
});
AWS.config.accessKeyId="AKIAJGRJV7UJFKD4HDPQ";
AWS.config.secretAccessKey="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";
var multer = require('multer');
var multerS3 = require('multer-s3');
module.exports={
    
    checkValidEmail: function(email){
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        
        return re.test(email);
    },
    checkValidPhoneNumber: function(sdt){
        var re = /^(0[3|7|8|9])+([0-9]{8})\b$/;
        
        return re.test(sdt);
    },
    generateUserId(){
        var time = new Date();
        var year =time.getFullYear();
        var month = time.getMonth()+1;
        var date = time.getDate();
        var hour = time.getHours();
        var minute = time.getMinutes();
        var second = time.getSeconds();

        if(month < 10){
            month ="0"+month;
        }
        if(date <10){
            date = "0"+date
        }
        if(hour <10){
            hour = "0"+hour
        }
        if(minute <10){
            minute = "0"+minute
        }
        if(second <10){
            second = "0"+second
        }
        
        return year+""+month+""+date + ""+hour+""+minute+""+second;

    },
    encodingMessageMD5(message){

    },
    decodingMessageMD5(message){

    },
    uploadImageToS3(){
        var upload = multer({
            storage: multerS3({
                s3: s3,
                bucket: 'tiennguyen',
                key: function (req, file, cb) {
                    file.originalname = "p"+ logic.generateUserId()+ path.extname(file.originalname);
                    cb(null,"p"+ logic.generateUserId()+ path.extname(file.originalname));
                }
            })
        });
        return upload;
    }
    
} 
