/**
 * Created by ag-1 on 12-Sep-17.
 */


if (window == undefined)
    window = {};

window.FlushJS = (function(){
    var queue = [];
    var flushingNow = false;

    function makeRequestBullet(options, timeout, addToQueueMethod){
        options.timeout = timeout;
        options.complete = function(jqXHR, status){
            if (status == "timeout" || jqXHR.readyState == 0){
                addToQueueMethod(makeRequestBullet(options, timeout, addToQueueMethod));
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

    function addToQueue(bullet, callback){
        queue.push(bullet);
        callback();
    }

    function makeEvent(lengthBeforeFlush){
        return {
            queueLength: queue.length,
            flushing: flushingNow,
            lengthBeforeFlush: lengthBeforeFlush
        }
    }

    return {
        timeout: 1000*3,
        queueLength: function() { return queue.length; },

        onChange: function(event) {},
        cantFlush: function(){ console.log("Can't flush.") },
        beforeFlush: function() {},

        send: function(params){
            if (flushingNow) return;
            var self = this;
            var bullet = makeRequestBullet(
                params, this.timeout,
                function(x){addToQueue(x, function(){self.onChange(makeEvent());});}
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
                    self.onChange(makeEvent(overall));
                    endFunc();
                } else {
                    queue[0].runSeq(function (jqXHR, status) {
                        if (status == 'success') {
                            queue.splice(0, 1);
                            reqChainRun(overall, i + 1, endFunc);
                            self.onChange(makeEvent(overall));
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
}());

module.exports = window.FlushJS;