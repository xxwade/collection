/*
* js获取xxx.com?a=1&b=1中的参数值
* */
function getQuerystring(name){
    var    reg=new RegExp("(^|&)"+name+"=([^&]*)(&|$)"),r=window.location.search.substr(1).match(reg);
    if(r!=null)
        return decodeURI(r[2]);
    return null;
}

/*
* debounce（防抖动）方法
* 实时交互，设定delay时间最多交互一次
*
* */
function debounce(fn, delay){
    var timer = null; // 声明计时器
    return function(){
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function(){
            fn.apply(context, args);
        }, delay);
    };
}

/*
* 仿 switch 方法
* switch...case不使用大括号，不利于代码形式的统一。
* 此外，这种结构类似于goto语句，容易造成程序流程的混乱，使得代码结构混乱不堪，不符合面向对象编程的原则。
* */
function doAction(action) {
  var actions = {
    'hack': function () {
      return 'hack';
    },

    'slash': function () {
      return 'slash';
    },

    'run': function () {
      return 'run';
    }
  };
 
  if (typeof actions[action] !== 'function') {
    throw new Error('Invalid action.');
  }

  return actions[action]();
}

/*
* 仿 typeof 方法
* type({}); // "object"
* type([]); // "array"
* type(5); // "number"
* type(null); // "null"
* type(); // "undefined"
* type(/abcd/); // "regex"
* type(new Date()); // "date"
* */
function  newTypeOf(o){
    var s = Object.prototype.toString.call(o);
        return s.match(/\[object (.*?)\]/)[1].toLowerCase();
};


/*
* for-in循环会同时枚举非继承属性和从原型对象继承的属性，如果有，则立即返回false，否则默认返回true。
* 将name分开定义很容易迷惑人
*/
function isEmptyObject(obj) {
    var name;
    for (name in obj) {
        return false;
    }
    return true;
}


/*
 * 解决 浏览器的兼容问题
 */
var pfx = ["webkit", "moz", "MS", "o", ""];

function PrefixedEvent(element, type, callback) {
  for (var p = 0; p < pfx.length; p++) {
    if (!pfx[p]) type = type.toLowerCase();
    element.addEventListener(pfx[p]+type, callback, false);
  }
}
PrefixedEvent(anim, "AnimationStart", AnimationListener);
PrefixedEvent(anim, "AnimationIteration", AnimationListener);
PrefixedEvent(anim, "AnimationEnd", AnimationListener);



if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback){
    for (var i = 0; i < this.length; i++){
      callback.apply(this, [this[i], i, this]);
    }
  };
}

