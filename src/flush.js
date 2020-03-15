/**
 * Created by ag-1 on 12-Sep-17.
 */


if (window == undefined)
    window = {};

window.FlushJS = (function(){
    var queue = [];
    var flushingNow = false;

    function checkProblemIsConnection(jqXHR, status){
        return (status == "timeout" || jqXHR.readyState == 0);
    }

    function makeRequestBullet(options, timeout, addToQueueMethod){
        options.timeout = timeout;

        if (!options.hasOwnProperty('actualComplete')){
            options.actualComplete = (typeof options.complete === 'function' ? options.complete : function(a, b){});
        }
        options.complete = function(jqXHR, status){
            if (checkProblemIsConnection(jqXHR, status)){
                addToQueueMethod(makeRequestBullet(options, timeout, addToQueueMethod));
            } else {
                options.actualComplete(jqXHR, status);
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
        if (!makeEvent.hasOwnProperty('previousFlushingStatus')){
            makeEvent.previousFlushingStatus = false;
        }

        var previousFlushing = makeEvent.previousFlushingStatus;
        makeEvent.previousFlushingStatus = flushingNow;

        return {
            queueLength: queue.length,
            flushing: flushingNow,
            previousFlushing: previousFlushing,
            lengthBeforeFlush: lengthBeforeFlush
        }
    }

    return {
        timeout: 1000*3,
        checkProblemIsConnection: checkProblemIsConnection,
        queueLength: function() { return queue.length; },

        onChange: function(event) {},

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
            flushingNow = true;

            function reqChainRun(overall, i, endFunc){
                if (queue.length == 0){
                    self.onChange(makeEvent(overall));
                    endFunc();
                } else {
                    queue[0].runSeq(function (jqXHR, status) {
                        if (checkProblemIsConnection(jqXHR, status)){
                            endFunc();
                            self.onChange(makeEvent())
                        } else {
                            queue.splice(0, 1)[0].options.actualComplete(jqXHR, status);
                            reqChainRun(overall, i + 1, endFunc);
                            self.onChange(makeEvent(overall));
                        }
                    });
                }
            }

            reqChainRun(queue.length, 1, function(){flushingNow = false;});
        }
    };
}());

module.exports = window.FlushJS;