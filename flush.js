/**
 * Created by Alick on 12-Sep-17.
 */

function makePostBullet(options, timeout, addToQueueMethod){
    options.timeout = timeout;
    options.complete = function(jqXHR, status){
        if (status == "timeout" || jqXHR.readyState == 0){
            addToQueueMethod(makePostBullet(options, timeout, addToQueueMethod));
        }
    };

    return {
        options: options,
        buildOptions(completeFunc){
            var oldOptions = {};
            Object.assign(oldOptions, this.options);

            var additional = {};
            if (completeFunc != undefined){
                additional.complete = completeFunc;
            }
            var modifiedOptions = Object.assign(this.options, additional);

            this.options = oldOptions;
            return modifiedOptions;
        },
        run: function(){
            return $.ajax(this.buildOptions());
        },
        runSeq: function(completeFunc){
            return $.ajax(this.buildOptions(completeFunc));
        }
   };
}

function makeFlushSystem(){
    var queue = [];
    var flushingNow = false;
    function addToQueue(bullet, callback){
        queue.push(bullet);
        callback();
    }
    return {
        timeout: 1000*3,
        queueLength: function() { return queue.length; },

        queueChanged: function(nowEmpty) { console.log('empty: ' + nowEmpty); },
        process: function(flushed, overallCount) { console.log('flush: ' + flushed + '/' + overallCount); },
        cantFlush: function(){ console.log("Can't flush.") },
        beforeFlush: function() {},

        post: function(params){
            if (flushingNow) return;
            var self = this;
            var bullet = makePostBullet(
                params, this.timeout,
                function(x){addToQueue(x, function(){self.queueChanged(false);});}
            );
            bullet.run();
        },

        flush: function(){
            var self = this;
            if (flushingNow) return;
            self.beforeFlush();
            flushingNow = true;

            function reqChainRun(overall, i, endFunc){
                if (queue.length == 0){
                    self.queueChanged(true);
                    endFunc();
                } else {
                    queue[0].runSeq(function (jqXHR, status) {
                        if (status == 'success') {
                            queue.splice(0, 1);
                            reqChainRun(overall, i + 1, endFunc);
                            self.process(i, overall);
                        } else {
                            self.cantFlush();
                            endFunc();
                        }
                    });
                }
            }

            reqChainRun(queue.length, 1, function(){flushingNow = false;});
        }
    };
}