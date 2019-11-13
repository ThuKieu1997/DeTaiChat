$(document).ready(function(){
    var user_id = $("#user_id").val();
    
    const socket = io.connect('172.20.10.4:3000')
    socket.on('connect', function() {
        
        socket.id = user_id;
        socket.emit('join_room',user_id);
        socket.on('receive_message',function(data){
           console.log("sender" + data['sender'])
            var res = "<div class='row' style='text-align:left; padding:5px 0px 5px 0px'>";
            res+=data['message'];
            res+="</div>";
            var receiver_Id= $(".selected-friend-item").attr("data-id")
            if(receiver_Id == data['sender']){
                $("#conversation-wrapper").append("<div class='row replace' style='text-align:left; padding:5px 0px 5px 0px'></div>");
                        $(".replace").text(data['message']);
                        $(".replace").removeClass("replace")
                        //$("#conversation-wrapper").append(res);
            }
                
        })
       
     });

   
    socket.on('typing',function (data) {
        feedback.html("<div>"+data.username + " is typing..."+"</div>")
    })
    $(".friend-item").on("click",function(){
        var id = $(this).attr("data-id");
        var message = $("#emojionearea5");
      
        message.emojioneArea({
            pickerPosition: "top",
            filtersPosition: "bottom",
            tones: false,
            autocomplete: false,
            inline: true,
            hidePickerOnBlur: false,
            events: {
                keyup: function (editor, event) {
                    if(event.keyCode == 13){
                        var conv_id = $("#hdn_conv_id").attr('data-id');
                        $("#conversation-wrapper").append("<div class='row replace' style='text-align:right; padding:5px 0px 5px 0px'></div>");
                        $(".replace").text(this.getText());
                        $(".replace").removeClass("replace")
                        socket.emit('new_message',{message:this.getText(),from_id:user_id,friend_id:id,conv_id:conv_id});
                        this.setText('');
                    }
                },
            }
        });

        if($(this).hasClass("selected-friend-item")){

        }else{

            $.ajax({
                type:"POST",
                url:"/trochuyen/t",
                dataType: 'json',
                data:{"idfriend":id},
                beforeSend:function(){
                    $("#conversation-wrapper").html("<div class='row'><div class='loader' style='position: relative;left: 48%;'></div></div>");
                },
                success:function(res){
                    var result ="<input type='hidden' id='hdn_conv_id'  data-id=";
                    result += res['conv_id'];
                    result +=">"
                    $("#conversation-wrapper").html(result);
                    if(res['list_mes'] != undefined){
                        for (let index = 0; index < res['list_mes'].length; index++) {
                            const element = res['list_mes'][index];
                            if(element['from'] == id){
                                $("#conversation-wrapper").append("<div class='row replace' style='text-align:left; padding:5px 0px 5px 0px'></div>");
                                $(".replace").text(element['content']);
                                $(".replace").removeClass("replace")                             
                        
                            }else{
                                $("#conversation-wrapper").append("<div class='row replace' style='text-align:right; padding:5px 0px 5px 0px'></div>");
                                $(".replace").text(element['content']);
                                $(".replace").removeClass("replace")  
                            }
                        }
                    }
                    else{
                        $("#conversation-wrapper").html("");
                    }
                    
                    
                },
                error:function(xhr, status, error){
                   alert(status);
                }
                
            })
        }
        $(".friend-item").removeClass("selected-friend-item");
        $(this).addClass("selected-friend-item");
        
        
    })


})