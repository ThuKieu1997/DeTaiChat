$(document).ready(function(){
    $("#btnDangKy").on("click",function(){
        $("#form-dang-ki").submit(function(event){
            // ngăn submit thông tin lên server
            event.preventDefault();
            $(this).unbind("submit");

            // kiểm tra tính hợp lệ dữ liệu
            var sdt= $("#sdt").val();
            var email = $("#email").val();
            var re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            var testEmail = re.test(email);
            var patt = /(09|03|07)+([0-9]{8})\b/g;
            var testPhoneNumber = patt.test(sdt);
            if(testPhoneNumber == false){
                alert("So dien thoai khong hop le!")
            }else if(testEmail == false){
                alert("Email khong hop le!")
            }else if(testPhoneNumber == true && testEmail == true){
                // Nếu sdt và email hợp lệ thì cho phép form submit thông tin đăng ký lên server
                $("#form-dang-ki").submit();
            }
            
            
        })
    })
    
});