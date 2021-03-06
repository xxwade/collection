/**
 * Created by xuxin on 15-6-26.
 */

define([], function () {

  var Storage = _.inherit({
    //默认属性
    propertys: function () {

      //代理对象，默认为localstorage
      this.sProxy = window.localStorage;

      //60 * 60 * 24 * 30 * 1000 ms ==30天
      this.defaultLifeTime = 2592000000;

      //本地缓存用以存放所有localstorage键值与过期日期的映射
      this.keyCache = 'SYSTEM_KEY_TIMEOUT_MAP';

      //当缓存容量已满，每次删除的缓存数
      this.removeNum = 5;

    },

    assert: function () {
      if (this.sProxy === null) {
        throw 'not override sProxy property';
      }
    },

    initialize: function (opts) {
      this.propertys();
      this.assert();
    },

    /*
     新增localstorage
     数据格式包括唯一键值，json字符串，过期日期，存入日期
     sign 为格式化后的请求参数，用于同一请求不同参数时候返回新数据，比如列表为北京的城市，后切换为上海，会判断tag不同而更新缓存数据，tag相当于签名
     每一键值只会缓存一条信息
     */
    set: function (key, value, timeout, sign) {
      var _d = new Date();
      //存入日期
      var indate = _d.getTime();

      //最终保存的数据
      var entity = null;

      if (!timeout) {
        _d.setTime(_d.getTime() + this.defaultLifeTime);
        timeout = _d.getTime();
      }

      //
      this.setKeyCache(key, timeout);
      entity = this.buildStorageObj(value, indate, timeout, sign);

      try {
        this.sProxy.setItem(key, JSON.stringify(entity));
        return true;
      } catch (e) {
        //localstorage写满时,全清掉
        if (e.name == 'QuotaExceededError') {
          //            this.sProxy.clear();
          //localstorage写满时，选择离过期时间最近的数据删除，这样也会有些影响，但是感觉比全清除好些，如果缓存过多，此过程比较耗时，100ms以内
          if (!this.removeLastCache()) throw '本次数据存储量过大';
          this.set(key, value, timeout, sign);
        }
        console && console.log(e);
      }
      return false;
    },

    //删除过期缓存
    removeOverdueCache: function () {
      var tmpObj = null, i, len;

      var now = new Date().getTime();
      //取出键值对
      var cacheStr = this.sProxy.getItem(this.keyCache);
      var cacheMap = [];
      var newMap = [];
      if (!cacheStr) {
        return;
      }

      cacheMap = JSON.parse(cacheStr);

      for (i = 0, len = cacheMap.length; i < len; i++) {
        tmpObj = cacheMap[i];
        if (tmpObj.timeout < now) {
          this.sProxy.removeItem(tmpObj.key);
        } else {
          newMap.push(tmpObj);
        }
      }
      this.sProxy.setItem(this.keyCache, JSON.stringify(newMap));

    },

    removeLastCache: function () {
      var i, len;
      var num = this.removeNum || 5;

      //取出键值对
      var cacheStr = this.sProxy.getItem(this.keyCache);
      var cacheMap = [];
      var delMap = [];

      //说明本次存储过大
      if (!cacheStr) return false;

      cacheMap.sort(function (a, b) {
        return a.timeout - b.timeout;
      });

      //删除了哪些数据
      delMap = cacheMap.splice(0, num);
      for (i = 0, len = delMap.length; i < len; i++) {
        this.sProxy.removeItem(delMap[i].key);
      }

      this.sProxy.setItem(this.keyCache, JSON.stringify(cacheMap));
      return true;
    },

    setKeyCache: function (key, timeout) {
      if (!key || !timeout || timeout < new Date().getTime()) return;
      var i, len, tmpObj;

      //获取当前已经缓存的键值字符串
      var oldstr = this.sProxy.getItem(this.keyCache);
      var oldMap = [];
      //当前key是否已经存在
      var flag = false;
      var obj = {};
      obj.key = key;
      obj.timeout = timeout;

      if (oldstr) {
        oldMap = JSON.parse(oldstr);
        if (!_.isArray(oldMap)) oldMap = [];
      }

      for (i = 0, len = oldMap.length; i < len; i++) {
        tmpObj = oldMap[i];
        if (tmpObj.key == key) {
          oldMap[i] = obj;
          flag = true;
          break;
        }
      }
      if (!flag) oldMap.push(obj);
      //最后将新数组放到缓存中
      this.sProxy.setItem(this.keyCache, JSON.stringify(oldMap));

    },

    buildStorageObj: function (value, indate, timeout, sign) {
      var obj = {
        value: value,
        timeout: timeout,
        sign: sign,
        indate: indate
      };
      return obj;
    },

    get: function (key, sign) {
      var result, now = new Date().getTime();
      try {
        result = this.sProxy.getItem(key);
        if (!result) return null;
        result = JSON.parse(result);

        //数据过期
        if (result.timeout < now) return null;

        //需要验证签名
        if (sign) {
          if (sign === result.sign)
            return result.value;
          return null;
        } else {
          return result.value;
        }

      } catch (e) {
        console && console.log(e);
      }
      return null;
    },

    //获取签名
    getSign: function (key) {
      var result, sign = null;
      try {
        result = this.sProxy.getItem(key);
        if (result) {
          result = JSON.parse(result);
          sign = result && result.sign
        }
      } catch (e) {
        console && console.log(e);
      }
      return sign;
    },

    remove: function (key) {
      return this.sProxy.removeItem(key);
    },

    clear: function () {
      this.sProxy.clear();
    }
  });

  Storage.getInstance = function () {
    if (this.instance) {
      return this.instance;
    } else {
      return this.instance = new this();
    }
  };

  return Storage;

});




define(['AbstractStorage'], function (AbstractStorage) {

  var Store = _.inherit({
    //默认属性
    propertys: function () {

      //每个对象一定要具有存储键，并且不能重复
      this.key = null;

      //默认一条数据的生命周期，S为秒，M为分，D为天
      this.lifeTime = '30M';

      //默认返回数据
      //      this.defaultData = null;

      //代理对象，localstorage对象
      this.sProxy = new AbstractStorage();

    },

    setOption: function (options) {
      _.extend(this, options);
    },

    assert: function () {
      if (this.key === null) {
        throw 'not override key property';
      }
      if (this.sProxy === null) {
        throw 'not override sProxy property';
      }
    },

    initialize: function (opts) {
      this.propertys();
      this.setOption(opts);
      this.assert();
    },

    _getLifeTime: function () {
      var timeout = 0;
      var str = this.lifeTime;
      var unit = str.charAt(str.length - 1);
      var num = str.substring(0, str.length - 1);
      var Map = {
        D: 86400,
        H: 3600,
        M: 60,
        S: 1
      };
      if (typeof unit == 'string') {
        unit = unit.toUpperCase();
      }
      timeout = num;
      if (unit) timeout = Map[unit];

      //单位为毫秒
      return num * timeout * 1000 ;
    },

    //缓存数据
    set: function (value, sign) {
      //获取过期时间
      var timeout = new Date();
      timeout.setTime(timeout.getTime() + this._getLifeTime());
      this.sProxy.set(this.key, value, timeout.getTime(), sign);
    },

    //设置单个属性
    setAttr: function (name, value, sign) {
      var key, obj;
      if (_.isObject(name)) {
        for (key in name) {
          if (name.hasOwnProperty(key)) this.setAttr(k, name[k], value);
        }
        return;
      }

      if (!sign) sign = this.getSign();

      //获取当前对象
      obj = this.get(sign) || {};
      if (!obj) return;
      obj[name] = value;
      this.set(obj, sign);

    },

    getSign: function () {
      return this.sProxy.getSign(this.key);
    },

    remove: function () {
      this.sProxy.remove(this.key);
    },

    removeAttr: function (attrName) {
      var obj = this.get() || {};
      if (obj[attrName]) {
        delete obj[attrName];
      }
      this.set(obj);
    },

    get: function (sign) {
      var result = [], isEmpty = true, a;
      var obj = this.sProxy.get(this.key, sign);
      var type = typeof obj;
      var o = { 'string': true, 'number': true, 'boolean': true };
      if (o[type]) return obj;

      if (_.isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          result[i] = obj[i];
        }
      } else if (_.isObject(obj)) {
        result = obj;
      }

      for (a in result) {
        isEmpty = false;
        break;
      }
      return !isEmpty ? result : null;
    },

    getAttr: function (attrName, tag) {
      var obj = this.get(tag);
      var attrVal = null;
      if (obj) {
        attrVal = obj[attrName];
      }
      return attrVal;
    }

  });

  Store.getInstance = function () {
    if (this.instance) {
      return this.instance;
    } else {
      return this.instance = new this();
    }
  };

  return Store;
});
