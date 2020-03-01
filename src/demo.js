$(()=>{
    $('.request-sender').click(function(){
        var elem = this;
        if (!elem.classList.contains('loading') && !elem.classList.contains('success')){
            FlushJS.send({
                url: "http://httpbin.org/get",
                method: 'GET',
                success: function(){
                    elem.classList.remove('loading');
                    elem.classList.add('success');
                },
                error: function(){
                    elem.classList.remove('loading');
                    elem.classList.add('error');
                },
                beforeSend: function(){
                    elem.classList.add('loading');
                    elem.classList.remove('error');
                }
            });
        }
    });

    var $flushBtn = $(".flush-button");
    FlushJS.onChange = function(e){
        $flushBtn.toggleClass('hidden', e.queueLength == 0);
        $flushBtn.text(e.queueLength);
        if (e.queueLength == 0){
            $flushBtn.removeClass('loading');
        }
    }

    $flushBtn.click(function(e){
        FlushJS.flush()
    })

    FlushJS.beforeFlush = function(){ $flushBtn.addClass('loading'); }
})