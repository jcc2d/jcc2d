import {Utils} from '../util/Utils';

/* eslint max-len: "off" */

// TODO: 继承事件对象

/**
 * MovieClip类型动画对象
 *
 * @class
 * @memberof JC
 * @param {object} [element] 动画对象 内部传入
 * @param {object} [options] 动画配置信息 内部传入
 */
function MovieClip(element, options) {
  this.element = element;
  this.living = false;

  this.onCompelete = null;
  // this.onUpdate = null;

  this.infinite = false;
  this.alternate = false;
  this.repeats = 0;

  this.animations = options.animations || {};

  this.index = 0;
  this.preIndex = -1;
  this.direction = 1;
  this.frames = [];
  this.preFrame = null;

  this.fillMode = 0;
  this.fps = 16;

  this.paused = false;

  this.pt = 0;
  this.nt = 0;
}

/**
 * 更新动画
 * @private
 * @param {number} snippet 时间片段
 */
MovieClip.prototype.update = function(snippet) {
  if (this.paused || !this.living) return;
  this.nt += snippet;
  if (this.nt - this.pt < this.interval) return;
  this.pt = this.nt;
  const i = this.index + this.direction;
  if (i < this.frames.length && i >= 0) {
    this.index = i;
    // Do you need this handler???
    // this.onUpdate&&this.onUpdate(this.index);
  } else {
    if (this.repeats > 0 || this.infinite) {
      if (this.repeats > 0) --this.repeats;
      if (this.alternate) {
        this.direction *= -1;
        this.index += this.direction;
      } else {
        this.direction = 1;
        this.index = 0;
      }
      // Do you need this handler???
      // this.onUpdate && this.onUpdate(this.index);
    } else {
      this.living = false;
      this.index = this.fillMode;
      if (this.onCompelete) this.onCompelete();
      if (this.next) this.next();
    }
  }
};

/**
 * 获取帧位置
 * @private
 * @return {JC.Rectangle}
 */
MovieClip.prototype.getFrame = function() {
  if (
    this.index === this.preIndex
    &&
    this.preFrame !== null
  ) return this.preFrame;
  const frame = this.element.frame.clone();
  const cf = this.frames[this.index];
  if (cf > 0) {
    const row = this.element.naturalWidth / this.element.frame.width >> 0;
    const lintRow = this.element.frame.x / this.element.frame.width >> 0;

    const mCol = (lintRow + cf) / row >> 0;
    const mRow = (lintRow + cf) % row;
    frame.x = mRow * this.element.frame.width;
    frame.y += mCol * this.element.frame.height;
  }
  this.preIndex = this.index;
  this.preFrame = frame;
  return frame;
};

/**
 * 播放逐帧
 * @param {object} options 播放配置
 */
MovieClip.prototype.playMovie = function(options) {
  this.next = null;
  const movie = this.format(options.movie);
  if (!Utils.isArray(movie)) return;
  this.frames = movie;
  this.index = 0;
  this.direction = 1;
  this.fillMode = options.fillMode || 0;
  this.fps = options.fps || this.fps;
  this.infinite = options.infinite || false;
  this.alternate = options.alternate || false;
  this.repeats = options.repeats || 0;
  this.living = true;
  this.onCompelete = options.onCompelete || null;
};

/**
 * 格式化逐帧信息
 * @private
 * @param {string|array|object} movie 逐帧信息
 * @return {array}
 */
MovieClip.prototype.format = function(movie) {
  if (Utils.isString(movie)) {
    const config = this.animations[movie];
    if (config) {
      return this.format(config);
    } else {
      console.warn('you havn\'t config ' + movie + ' in animations ');
      return false;
    }
  } else if (Utils.isArray(movie)) {
    return movie;
  } else if (Utils.isObject(movie)) {
    const arr = [];
    for (let i = movie.start; i <= movie.end; i++) {
      arr.push(i);
    }
    if (movie.next && this.animations[movie.next]) {
      const This = this;
      let conf = {};
      if(Utils.isString(movie.next) && this.animations[movie.next]) {
        conf.movie = movie.next;
        conf.infinite = true;
      } else if(Utils.isObject(movie.next)) {
        conf = movie.next;
      }
      if (Utils.isString(conf.movie)) {
        this.next = function() {
          This.playMovie(conf);
        };
      }
    }
    return arr;
  }
};

/**
 * 暂停逐帧
 */
MovieClip.prototype.pause = function() {
  this.paused = true;
};

/**
 * 恢复播放逐帧
 */
MovieClip.prototype.restart = function() {
  this.paused = false;
};

/**
 * 取消逐帧
 */
MovieClip.prototype.cancle = function() {
  this.living = false;
};

/**
 * 帧间隔
 * @private
 */
Object.defineProperty(MovieClip.prototype, 'interval', {
  get: function() {
    return this.fps > 0 ? 1000 / this.fps >> 0 : 16;
  },
});

export {MovieClip};
