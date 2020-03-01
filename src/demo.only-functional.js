$(()=>{
    $('.request-sender').click(function(){
        FlushJS.send({
            url: "http://httpbin.org/get",
            method: 'GET'
        });
    });

    var $flushBtn = $(".flush-button");
    FlushJS.onChange = function(e){
        $flushBtn.text(e.queueLength);
    }

    $flushBtn.click(function(e){
        FlushJS.flush()
    })
})