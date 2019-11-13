

//-------- build server-----------
var express = require("express");
var app = express();
var session = require('express-session');
const bodyParser = require("body-parser");
var path = require('path')
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-2",
  
});
AWS.config.accessKeyId="AKIAJGRJV7UJFKD4HDPQ";
AWS.config.secretAccessKey="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";
var multer = require('multer');
var multerS3 = require('multer-s3');
var s3 = new AWS.S3();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({ resave: true, saveUninitialized: true, secret: 'uwotm8' }));

app.set("view engine", "ejs");
app.set("views", "./views");
server = app.listen(3000);
console.log("server dang chay...");
var upload = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: 'tuankieu',
        key: function (req, file, cb) {
            file.originalname = "p"+ logic.generateUserId()+ path.extname(file.originalname);
            console.log(file);
            cb(null,"p"+ logic.generateUserId()+ path.extname(file.originalname)); //use Date.now() for unique file keys
        }
    })
});

//------- my variables------------

var data_access = require("./data_access");
var logic = require("./business_logic");

//------- chat socket------------

var io = require("socket.io")(server);
io.on('connection', function(socket){

    
    socket.on('join_room',function(room){
        socket.room = room;
        socket.join(room);
        
        
    })

    socket.on('new_message',function(data){
      

        var friend_id = data['friend_id'];
        var from_id = data['from_id'];
        var conv_id = data['conv_id'];
        var mess = data['message'];
        console.log("conv_id: " + conv_id);
        
        if(conv_id == undefined){
             data_access.createConversation(from_id,friend_id,mess)
             io.sockets.to(friend_id).emit('receive_message', {message:mess,sender: from_id});
        
        }else{
            data_access.updateListMessage(conv_id,{"content":mess,"from":from_id,"sentat":new Date().toISOString(),"seenat":null})
            io.sockets.to(friend_id).emit('receive_message', {message:mess,sender: from_id});
        }
      
        console.log("user " + socket.room + " joined room: "+Object.keys(socket.rooms) + " mes to " + friend_id);
        console.log("----------------------------")
        

    })

    
  });
//------- routing-----
// post thong tin dang nhap

app.post("/trangchu", function(req, res)
{ 
    var tk = req.body.taikhoan;
    var  mk = req.body.matkhau;
    var AWS = require("aws-sdk");
    AWS.config.update({
    region: "us-east-2",
    endpoint: "https://dynamodb.us-east-2.amazonaws.com",
    
    });

    AWS.config.accessKeyId="AKIAJGRJV7UJFKD4HDPQ";
    AWS.config.secretAccessKey="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";

    var docClient = new AWS.DynamoDB.DocumentClient();
   // neu tai khoan la email
    if(logic.checkValidEmail(tk) == true){
    
        req.session.taikhoan = tk;
        
        var params = {
            TableName: "users",
            ProjectionExpression: "email,actived, user_id,ten,ngaysinh,sdt,diachi,taikhoan,matkhau,banbe,ketban",
            FilterExpression: "email = :eml ",
            
            ExpressionAttributeValues: {
                ":eml": tk,
            }
        };
        
     
        docClient.scan(params, onScan);
        
        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {

                //console.log(data);

                // kiem tra user có tồn tại hay không
                if(typeof(data.Items[0]) != undefined && data.Items.length > 0 ){
                    //console.log("Item[0]: ", data.Items[0]);
                    // kiểm tra user đã được active hay chưa
                    // active = 'undifined' (đã active)
                    if((data.Items[0]['matkhau'] == mk) || (data.Items[0]['actived']=="done")){
                        req.session.userSession = data.Items[0];
                        console.log("user : " + req.session.userSession["user_id"] + " da dang nhap");
                        // tạo biến session = user_id
                        var userId = req.session.userSession['user_id']
                        // lấy thông tin user khi đăng nhập
                        var friend = data_access.getUserById(userId).then(user=>{
                            var lstFriend = user['Item']['banbe'];
                            if(typeof lstFriend != 'undefined'){
                                lstFriend.push(userId);
                               
                                var post = data_access.getNewFeed(lstFriend).then(data=>{
                                    if(data["Items"].length > 0){

                                        res.render("trangchu",{lstPost:data["Items"]});
                                    }
                                    else{
                                        var s1= data_access.getNewFeed([userId]).then(data=>{
                                            res.render("trangchu",{lstPost:data['Items']});
                                        });
                                    }
                                }).catch(err => {
                                    console.log("getNewFeed[lstFriend]: ", err);
                                });
                            }
                            else{
                                var s1= data_access.getNewFeed([userId]).then(data=>{
                                    res.render("trangchu",{lstPost:data['Items']});
                                }).catch(err => {
                                    console.log("getNewFeed[userId]: ", err);
                                });
                            }
                            
                        })
                 
                    }else{
                        res.render("login_fail");
                    }
                }
                else{
                    res.render("login_fail");
                }
                
                
                
            }
        }
    }
    else if(logic.checkValidPhoneNumber(tk)){
        req.session.taikhoan = tk;
        
        var params = {
            TableName: "users",
            ProjectionExpression: "email,actived, user_id,ten,ngaysinh,sdt,diachi,taikhoan,matkhau,banbe,ketban",
            FilterExpression: "sdt = :sdt ",
            
            ExpressionAttributeValues: {
                ":sdt": tk,
            }
        };
        
     
        docClient.scan(params, onScan);
        
        function onScan(err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
               
                
                if(typeof(data.Items[0]) != undefined && data.Items.length > 0 ){
                    if((data.Items[0]['matkhau'] == mk) && ((typeof data.Items[0]['actived'] == "undefined") || (data.Items[0]['actived']=="done"))){
                        req.session.userSession = data.Items[0];
                        console.log("user : " + req.session.userSession["user_id"] + " da dang nhap");
                        var userId = req.session.userSession['user_id']
                        var friend = data_access.getUserById(userId).then(user=>{
                            var lstFriend = user['Item']['banbe'];
                            if(typeof lstFriend != 'undefined'){
                                lstFriend.push(userId);
                               
                                var post = data_access.getNewFeed(lstFriend).then(data=>{
                                    if(data["Items"].length > 0){

                                        res.render("trangchu",{lstPost:data["Items"]});
                                    }
                                    else{
                                        var s1= data_access.getNewFeed([userId]).then(data=>{
                                            res.render("trangchu",{lstPost:data['Items']});
                                        });
                                    }
                                })
                            }
                            else{
                                var s1= data_access.getNewFeed([userId]).then(data=>{
                                    res.render("trangchu",{lstPost:data['Items']});
                                });
                            }
                            
                        })
                 
                    }else{
                        res.render("login_fail");
                    }
                }
                else{
                    res.render("login_fail");
                }
                
                
                
            }
        }

    } 
    else{
        res.render("login_fail");
    }


});
// get view trangchu
app.get("/trangchu", function(req, res){
    if(req.session.userSession == null){
        
        res.render("dangnhap");
    }
    else{
        var userId = req.session.userSession['user_id']
        var friend = data_access.getUserById(userId).then(data=>{
            var lstFriend = data['Item']['banbe'];
            if(typeof lstFriend != 'undefined'){
                lstFriend.push(userId);
                console.log(lstFriend)
                var post = data_access.getNewFeed(lstFriend).then(data=>{
                    
                    //console.log(data["Items"])
                     if(data["Items"].length > 0){
                         res.render("trangchu",{lstPost:data["Items"]});
                     }
                     else{
                        var s1= data_access.getNewFeed([userId]).then(data=>{
                            res.render("trangchu",{lstPost:data['Items']});
                        });
                     }
                })
            }else{
                var s1= data_access.getNewFeed([userId]).then(data=>{
                    res.render("trangchu",{lstPost:data['Items']});
                });
                
            }
            
        })
    }
});
// lay trang dang ky dangky.ejs
app.get("/dangky",function(req,res){
    res.render("dangky")
})
// nhận thông tin submit đăng ký
app.post("/dangky",function(req,res){
    // lay thông tin submit từ form đăng ký lên server
    var ten = req.body.hoten;
    var sdt = req.body.sdt;
    var email = req.body.email;
    var matkhau = req.body.matkhau;
    // sinh tự động mã user
    var user_id = logic.generateUserId();

    var extendUser = data_access.getUserByEmail(email).then(data=>{
       // nếu chưa tồn tại user có email gửi về thì : 
        if(data['Items'].length  == 0){
            // tạo ra 1 user mới
            data_access.createNewRegister(user_id,ten,sdt, email,matkhau);
                // gui email xac thuc
                var nodemailer = require('nodemailer');
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'nguyencongtien161@gmail.com',
                        pass: '123456'
                    }
                });
                var mailOptions = {
                    from: 'nguyencongtien161@gmail.com',
                    to: email,
                    subject: 'Email xác thực đăng ký.',
                    text: 'Bạn đã đăng kí tài khoản.',
                    html: '<p>Cảm ơn bạn đã đăng ký tài khoản. Click <a href="http://172.20.10.4:3000/kichhoattaikhoan?reg='+user_id +'" > tại đây </a> để kích hoạt tài khoản</p>'
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });

                res.render("dangky_thanhcong")
                
        }
        else{
            res.render("dangky_khongthanhcong")
        }
       
    })
    
});
app.get("/", function(req, res)
{
    res.render("dangnhap");
});
app.get("/kichhoattaikhoan",function(req,res){
    // lấy user được active
    var user = req.query.reg;
    // active user
    data_access.activeRegister(user)
  
    res.render("dangnhap")
})
app.get("/trochuyen", function(req, res)
{
  
    
    if(req.session.userSession != null){
        
        var userId = req.session.userSession['user_id'];
        data_access.getUserById(userId).then(data=>{
            var lstFriend =data['Item']['banbe'];
            if(typeof lstFriend != 'undefined'){
                data_access.getListFriend(lstFriend).then(data=>{
                   
                    var tmp = data['Items']
                    res.render("trochuyen",{listFriend:tmp,user_id:userId });
                })
            }else{
                res.render("trochuyen",{listFriend:[],user_id:userId });
            }
        })
       
       
        // data_access.getListFriendsByIdUser(userId).then(data=>{
           
        //     var lstFriend = [];
        //     if(typeof data['Item'] == "undefined"){
        //         res.render("trochuyen",{listFriend:lstFriend,user_id:userId });
                
        //     }
        //     else{
        //         data["Item"]['banbe'].forEach(element => {
        //             lstFriend.push(element)
        //         });
                
        //         res.render("trochuyen",{listFriend:lstFriend,user_id:userId });
        //     }

            
        // });

       
        
    }
    else{
        res.render("dangnhap");
    }
   
});
app.get("/canhan", function(req, res)
{
    if(req.session.userSession == null){
        res.render("dangnhap");
    }
    else{
        var userId = req.session.userSession['user_id'];
       
        var s1= data_access.getPostByUserId(userId);
        var s2 = data_access.getUserById(userId);
        Promise.all([s1,s2]).then(data=>{
           
            
            var timeLine = data[0]["Items"];
            var personal = data[1]["Item"];
            
            res.render("canhan",{timeLine:timeLine,personal:personal});
        })
        
        
    }
    
});
app.get("/dangxuat", function(req, res)
{
    req.session.userSession = null;
    res.render("dangnhap");
});
app.post("/trochuyen/t", function(req,res){

    var friend = req.body.idfriend;
    var user = req.session.userSession['user_id']
    data_access.getConversation(friend,user).then(data=>{
        if(data['Items'].length ==0){
            res.send(JSON.stringify(""));
            res.end();
        }else{
            var result ="<input type='hidden' id='hdn_conv_id'  data-id=";
            result += data['Items'][0]['conv_id'];
            result +=">"
            var lst_mes = data['Items'][0]['list_mes'];
            for (let index = 0; index < lst_mes.length; index++) {
                const element = lst_mes[index];
                if(element['from'] == friend){
                    result += "<div class='row' style='text-align: left;padding: 5px 0px 5px 0px'>";
                    result += element['content'];
                    result += "</div>";

                    
            
                }else{
                    result += "<div class='row' style='text-align: right;padding: 5px 0px 5px 0px'>";
                    result += element['content'];
                    result += "</div>";
                    
                }
            }
            res.send(data['Items'][0])
            //res.send(JSON.stringify(result));
            res.end();
        }
    })
    // data_access.getConversationFromListFriend(user,friend).then(data=>{
        
    //     if(data['Items'].length ==0){
    //         res.send(JSON.stringify(""));
    //         res.end();
    //     }else{
    //         var result ="<input type='hidden'  data-id=";
    //         result += data['Items'][0]['user1'];
    //         result += data['Items'][0]['user2'];
    //         result +="/>"
    //         var lst_mes = data['Items'][0]['list_mes'];
    //         for (let index = 0; index < lst_mes.length; index++) {
    //             const element = lst_mes[index];
    //             if(element['from'] == friend){
    //                 result += "<div class='row' style='text-align: left;padding: 5px 0px 5px 0px'>";
    //                 result += element['content'];
    //                 result += "</div>";
            
    //             }else{
    //                 result += "<div class='row' style='text-align: right;padding: 5px 0px 5px 0px'>";
    //                 result += element['content'];
    //                 result += "</div>";
                    
    //             }
    //         }
            
    //         res.send(JSON.stringify(result));
    //         res.end();
    //     }
        
        
        
        
    //});


    

})
app.post("/newpost",upload.single("fileHinh"),function(req,res,next){
    
    var title = req.body.emojionearea1;
 
    
    var post_id = logic.generateUserId();
    var owner =  req.session.userSession['user_id'];
    var tmp = data_access.getUserById(owner).then(user=>{
        var ownerName = user['Item']['ten'];
        var ownerAvatar = user['Item']['avatar'];
        var postat = new Date();
    
        var image = "https://s3.us-east-2.amazonaws.com/tuankieu/" + req.file.originalname;
        var put =  data_access.addNewPost(post_id, title, image,owner,postat.toString(),ownerName,ownerAvatar).then(data=>{
            res.redirect('/canhan');
        });
    })
   
    
    
    
})
app.get("/u/:id",function(req,res){
    if(req.session.userSession == null){
        res.render("dangnhap");
    }
    else{
        var user_id = req.params.id;
        if(user_id == req.session.userSession['user_id']){ 
            res.redirect("/canhan");
        }
        else{
            var s1= data_access.getPostByUserId(user_id);
            var s2 = data_access.getUserById(user_id);
            //var ketban = data_access.getUserById(user_id)
            Promise.all([s1,s2]).then(data=>{
               
                var isFriend = 1;
                var result = 1;
                var timeLine = data[0]["Items"];
                var personal = data[1]["Item"];
                var ketban = data[1]["Item"]['ketban'];
                var banbe  =data[1]["Item"]['banbe'];
    
                if(typeof ketban == 'undefined'){
                    
                }else{
                    ketban.forEach(element => {
                        if(element ==req.session.userSession['user_id']){
                            result = 2;
                        
                        }
                    });
                }
                if(typeof banbe == 'undefined'){
    
                }else{
                    banbe.forEach(element => {
                        if(element == req.session.userSession['user_id']){
                            result = 3;
                           
                        }
                    });
                }
                res.render("persionalpage",{timeLine:timeLine,personal:personal,isFriend:result});
            })

        }

        
      
    }    
    
})
app.post("/ketban",function(req,res){
    var requester = req.session.userSession['user_id'];
    var user_id = req.body.user_id;
    data_access.requestToAddFriend(requester,user_id)
    
    res.end();
})
app.get("/timban", function(req,res){
    if(req.session.userSession == null){
        res.render("dangnhap");
    }else{

        var userId = req.session.userSession['user_id']
  
        var user = data_access.getUserById(userId).then(user=>{
    
            var ketban = [];
            banbe = [];
            ketban = user['Item']['ketban']
            banbe =user['Item']['banbe'];
            
            if(typeof ketban != 'undefined' && ketban.length > 0){
                var s1 = data_access.getListAddFriend(ketban)
                if(typeof banbe != 'undefined' && banbe.length > 0){
                    
                    var s2 = data_access.getListFriend(banbe)
                    Promise.all([s1,s2]).then(data=>{
                        res.render("timban",{listAddFriend:data[0]['Items'],listFriend:data[1]['Items']});
                    })
                }else{
                    s1.then(data=>{
                        res.render("timban",{listAddFriend:data['Items'],listFriend:[]});
                    })
                }
            }
            else{
    
                if(typeof banbe != 'undefined' && banbe.length > 0){
                    
                    var s2 = data_access.getListFriend(banbe).then(data=>{
                       
                        res.render("timban",{listAddFriend:[],listFriend:data['Items']});
                    })
                }else{
                        
                        res.render("timban",{listAddFriend:[],listFriend:[]});
                
                }
            }
           
                
        })

    }
   

    
        
})
app.post("/timkiemuser", function(req,res){
    var sdt = req.body.sdt;

    data_access.getUserByPhoneNumber(sdt).then(data=>{

        if(data['Items'].length == 0){
            res.send("Không tìm thấy kết quả")
           
        }else{
            
            res.send("<a href='/u/"+data['Items'][0]['user_id']+"'><div class='row'><img style='width:50px;height:50px;float:left;margin-right:10px' src='"+data['Items'][0]['avatar']+" '/><h3 style='float:left;margin-top: 10px'>"+data['Items'][0]['ten']+"</h3></div></a>")
      
        }
       
        res.end();
    })
    
})
app.post("/chapnhanketban", function(req,res){
    var requester = req.body.requester;
    var user_id = req.session.userSession['user_id'];
    var ketban = req.session.userSession['ketban'];
    var index  = ketban.indexOf(requester);
    var s1 =  data_access.addNewFriend(user_id,requester);
    var s2 = data_access.addNewFriend(requester,user_id);
    var s4 = data_access.denyAddFriend(user_id,index);
    Promise.all([s1,s2,s4]).then(data=>{
        var user = data_access.getUserById(user_id).then(data=>{
            req.session.userSession = data['Item']
          
        });
    
    })
    
 
    
})
app.post("/tuchoiketban", function(req,res){
    var requester = req.body.requester;
    var user_id = req.session.userSession['user_id'];
    var ketban = req.session.userSession['ketban'];
    var index  = ketban.indexOf(requester)
    data_access.denyAddFriend(user_id,index).then(data=>{
        data_access.getUserById(user_id).then(data=>{
            req.session.userSession = data['Item']
           
        });
    })
    
    
})
app.post("/capnhatthongtin", function(req,res){
    var userId = req.session.userSession['user_id'];
    var attr = req.body.attr;
    var value = req.body.value;
    
    data_access.updateInformation(userId,attr,value).then(data=>{
        var lstPost = data_access.getPostByUserId(userId).then(data=>{
            
           
           
            if(data['Items'].length > 0){
                console.log("630 attr: " + attr + " value:  " + value);
                var newAttr;
                if(attr == "ten")
                    newAttr ="owner_name"
                if(attr == "avatar")
                    newAttr ="owner_avatar"
                    
                var lst = []
                data['Items'].forEach(element => {
                    lst.push(element['post_id'])
                });
                data_access.updatePost(lst,newAttr,value)
            }
            
        })
        
        res.end();
    })
    
    //res.status(200).end();
})
var uploadAvatar = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: 'tiennguyen5118',
        key: function (req, file, cb) {
            console.log("user_id :  " +  req.session.userSession['user_id'])
            console.log("------------------");
            file.originalname = "avt"+  req.session.userSession['user_id']+ path.extname(file.originalname);
            console.log(file);
            cb(null,"avt"+  req.session.userSession['user_id']+ path.extname(file.originalname)); //use Date.now() for unique file keys
        }
    })
});
app.post("/capnhatanhdaidien",uploadAvatar.single("file-input"),function(req,res,next){
    
    var userId =  req.session.userSession['user_id'];
    var avatar = "https://s3.us-east-2.amazonaws.com/tuankieu/" + req.file.originalname;
    data_access.updateAvatar(userId,avatar).then(data=>{

        var lstPost = data_access.getPostByUserId(userId).then(data=>{
            
           
           
            if(data['Items'].length > 0){
    
                var lst = []
                data['Items'].forEach(element => {
                    lst.push(element['post_id'])
                });
                data_access.updatePost(lst,'owner_avatar',avatar)
            }
            
        })
        res.redirect("/canhan");
    })
    
})