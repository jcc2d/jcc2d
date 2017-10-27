import { Sprite } from '../core/Sprite';
import { Container } from '../core/Container';
import { loaderUtil } from './Loader';

/**
 * 解析bodymovin从ae导出的数据
 * @class
 * @memberof JC
 * @param {object} options 动画配置
 * @param {object} options.keyframes bodymovin从ae导出的动画数据
 * @param {number} [options.fr] 动画的帧率，默认会读取导出数据配置的帧率
 * @param {number} [options.repeats] 动画是否无限循环
 * @param {boolean} [options.infinite] 动画是否无限循环
 * @param {boolean} [options.alternate] 动画是否交替播放
 * @param {string} [options.prefix] 导出资源的前缀
 * @param {function} [options.onComplete] 结束回调
 * @param {function} [options.onUpdate] 更新回调
 */
function ParserAnimation(options) {
  this.prefix = options.prefix || '';
  this.doc = new Container();
  this.fr = options.fr || options.keyframes.fr;
  this.keyframes = options.keyframes;
  this.ip = this.keyframes.ip;
  this.op = this.keyframes.op;
  this.repeats = options.repeats || 0;
  this.infinite = options.infinite || false;
  this.alternate = options.alternate || false;
  this.assetBox = null;
  this.timeline = [];
  this.preParser(this.keyframes.assets, this.keyframes.layers);
  this.parser(this.doc, this.keyframes.layers);

  if (options.onComplete) {
    this.timeline[0].on('complete', options.onComplete.bind(this));
  }
  if (options.onUpdate) {
    this.timeline[0].on('update', options.onUpdate.bind(this));
  }
}

/**
 * @private
 * @param {array} assets 资源数组
 * @param {array} layers 图层数组
 */
ParserAnimation.prototype.preParser = function (assets, layers) {
  var sourceMap = {};
  var i = 0;
  var l = layers.length;
  for (i = 0; i < assets.length; i++) {
    var id = assets[i].id;
    var up = assets[i].up;
    var u = assets[i].u;
    var p = assets[i].p;
    if (up) {
      sourceMap[id] = up;
    } else if (u && p) {
      sourceMap[id] = u + p;
    } else if (!assets[i].layers) {
      console.error('can not get asset url');
    }
  }
  for (i = l - 1; i >= 0; i--) {
    var layer = layers[i];
    this.ip = Math.min(this.ip, layer.ip);
    this.op = Math.max(this.op, layer.op);
  }
  this.assetBox = loaderUtil(sourceMap);
};

/**
 * @private
 * @param {JC.Container} doc 动画元素的渲染组
 * @param {array} layers 图层数组
 */
ParserAnimation.prototype.parser = function (doc, layers) {
  var l = layers.length;
  var repeats = this.repeats;
  var infinite = this.infinite;
  var alternate = this.alternate;
  var ip = this.ip;
  var op = this.op;
  for (var i = l - 1; i >= 0; i--) {
    var layer = layers[i];
    if (layer.ty === 2) {
      var id = this.getAssets(layer.refId).id;
      var ani = new Sprite({
        texture: this.assetBox.getById(id)
      });
      this.timeline.push(ani.keyFrames({
        ks: layer,
        fr: this.fr,
        ip: ip,
        op: op,
        repeats: repeats,
        infinite: infinite,
        alternate: alternate
      }));
      ani.name = layer.nm;
      doc.adds(ani);
    }
    if (layer.ty === 0) {
      var ddoc = new Container();
      var llayers = this.getAssets(layer.refId).layers;
      this.timeline.push(ddoc.keyFrames({
        ks: layer,
        fr: this.fr,
        ip: ip,
        op: op,
        repeats: repeats,
        infinite: infinite,
        alternate: alternate
      }));
      ddoc.name = layer.nm;
      doc.adds(ddoc);
      this.parser(ddoc, llayers);
    }
  }
};

/**
 * @private
 * @param {string} id 资源的refid
 * @return {object} 资源配置
 */
ParserAnimation.prototype.getAssets = function (id) {
  var assets = this.keyframes.assets;
  for (var i = 0; i < assets.length; i++) {
    if (id === assets[i].id) return assets[i];
  }
};

/**
 * 设置动画播放速度
 * @param {number} speed
 */
ParserAnimation.prototype.setSpeed = function (speed) {
  this.doc.setSpeed(speed);
};

/**
 * 暂停播放动画
 */
ParserAnimation.prototype.pause = function () {
  this.doc.pause();
};

/**
 * 恢复播放动画
 */
ParserAnimation.prototype.restart = function () {
  this.doc.restart();
};

/**
 * 停止播放动画
 */
ParserAnimation.prototype.stop = function () {
  this.timeline.forEach(function (it) {
    it.stop();
  });
};

/**
 * 取消播放动画
 */
ParserAnimation.prototype.cancle = function () {
  this.timeline.forEach(function (it) {
    it.cancle();
  });
};

export { ParserAnimation };