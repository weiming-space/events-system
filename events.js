/*
 * name: events-system
 * desc 可观测的事件系统
 * author: weiming
 * email: gdzhixing@163.com
 */

 //模块一、 集中存储数据的地方
 (function(){
     var cache = {},
         guidCounter = 1;
         expando = 'data' + new Date().getDate();

     //获取数据， 不存在则初始化一个空数据对象
     this.getData = function(ele){
         var guid = ele[expando];

         if(!guid){
             guid = ele[expando] = guidCounter++;
             cache[guid] = {};
         }

         return cache[guid];
     };

     //删除数据
     this.removeData = function(ele){
         var guid = ele[expando];

         if(!guid){ return;};

         delete cache[guid];
         try{
             delete ele[expando];
         }catch(e){
             ele.removeAttribute(expando);
         }
     }
 })();

//模块二、规范化事件对象
(function(){

    this.fixEvent = function(event){

        //非标准事件对象, 更多指向IE9以下IE的版本
        if(!event || !event.stopPropagation){
            var old = event || window.event;
            event = {};

            //复制原生事件对象
            for(var attr in old){
                event[attr] = old[attr];
            }

            //兼容目标对象
            if(!event.target){
                event.target = event.srcElement || document;
            }

            //实现relatedTarget;
            event.relatedTarget = event.fromElement === event.tareget ? event.toElement : event.fromElement;

            //兼容事件冒泡
            event.stopPropagation = function(){
                event.cancelBubble = true;
                event.isPropagationStopped = true;
            };
            event.isPropagationStopped = false;

            //兼容阻止默认行为
            event.preventDefault = function(){
                event.returnValue = false;
                event.isDefaultPrevented = true;
            }
            event.isDefaultPrevented = false;

            //实现pageX, pageY;
            if(!event.pageX || !event.pageY){
                var doc = document.documentElement, body = document.body;

                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0);
            };
        }

        return event;
    };
})();

//模块三、事件绑定
(function(){
    var nextGuid = 1;

    //绑定事件
    this.addEvent = function(ele, type, fn){
        var data = getData(ele);

        //创建事件处理对象
        if(!data.handlers){
            data.handlers = {};
        }

        //创建特定事件类型存储队列
        if(!data.handlers[type]){
            data.handlers[type] = [];
        }

        if(!fn.guid){ fn.guid = nextGuid++; }

        data.handlers[type].push(fn);

        if(!data.dispatcher){
            data.disabled = false;
            data.dispatcher = function(event){
                if(data.disabled){ return; };
                event = fixEvent(event);

                var handlers = data.handlers[event.type];

                if(handlers){

                    for(var i=0, len=handlers.length; i<len; i++){
                        handlers[i].call(ele, event);
                    }
                }
            }
        }

        if(data.handlers[type].length === 1){
            if(document.addEventListener){
                ele.addEventListener(type, data.dispatcher, false);
            }else if(document.attachEvent){
                ele.attachEvent("on" + type, data.dispatcher);
            }
        }
    };

    //支持一个参数，两个参数，三个参数
    this.removeEvent = function(ele, type, fn){
        var data = getData(ele);

        //检测是否有handlers事件处理对象
        if(!data.handlers){
            return;
        }

        //没有传type
        if(!type){
            for(var t in data.handlers){
                data.handlers[t] = [];
                tidyUp(ele, t);
            }
            return;
        }

        //传入的type不存在, 传错了
        var handlers = data.handlers[type];

        if(!handlers){ return;}

        //事件处理fn没传
        if(!fn){
            data.handlers[type] = [];
            tidyUp(ele, type);
            return;
        }

        //fn是否绑定过
        if(fn.guid){

            for(var i=0; i<handlers.length; i++){
                if(handlers[i].guid === fn.guid){
                    handlers.splice(i--, 1);
                }
            }

        }

        tidyUp(ele, type);
    }
})();


//模块四、数据清理工作
(function(){
    this.tidyUp = function(ele, type){
        var data = getData(ele);

        //删除type属性及事件
        if(data.handlers[type].length === 0){
            delete data.handlers[type];

            if(document.removeEventListener){
                ele.removeEventListener(type, data.dispatcher, false);
            }else if(document.attachEvent){
                ele.attachEvent('on' + type, data.dispatcher);
            }
        }

        //删除hanlders及dispatcher；
        if(isEmpty(data.handlers)){
            delete data.handlers;
            delete data.dispatcher;
        }

        //删除数据
        if(isEmpty(data)){
            removeData(ele);
        }
    }

    function isEmpty(obj){
        for(var attr in obj){
            return false;
        }
        return true;
    }
})();

//模块五、自定义事件触发
(function(){
    this.triggerEvent = function(ele, event){
        var data = getData(ele),
            parent = ele.parentNode;

        if(typeof event === 'string'){
            event = {type: event, target: ele};
        }

        event = fixEvent(event);

        if(data.dispatcher){
            data.dispatcher.call(ele, event);
        }

        if(parent && !event.isStopPropagaioned){
            triggerEvent(parent, event);
        }else if(!parent && !event.isDefaultPrevented){
            var targetData = getData(event.target);

            if(event.target[event.type]){
                targetData.disabled = true;
                event.target[evnet.type]();
                targetData.disabled = false;
            }
        }
    }
})();
