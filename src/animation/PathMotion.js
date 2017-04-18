import {Animate} from './Animate';
import {Utils} from '../util/Utils';
import {Tween} from '../util/Tween';
import {Curve} from '../math/Curve';
import {Point} from '../math/Point';

/**
 * PathMotion类型动画对象
 *
 * @class
 * @memberof JC
 * @param {object} [options] 动画所具备的特性
 */
function PathMotion(options) {
  Animate.call(this, options);
  if (!options.path || !(options.path instanceof Curve)) {
    console.warn(
      '%c JC.PathMotion warn %c: path is not instanceof Curve',
      'color: #f98165; background: #80a89e',
      'color: #80a89e; background: #cad9d5;'
    );
  }

  this.path = options.path;
  this.attachTangent = options.attachTangent || false;
  this._cacheRotate = this.element.rotation;
  let radian = this._cacheRotate * Utils.DTR;
  this._cacheVector = new Point(10 * Math.cos(radian), 10 * Math.sin(radian));
}

PathMotion.prototype = Object.create(Animate.prototype);

PathMotion.prototype.nextPose = function() {
  let _rotate = 0;
  const t = Tween[this.ease](this.progress, 0, 1, this.duration);
  const pos = this.path.getPoint(t);
  const pose = pos.clone();

  if (this.attachTangent) {
    _rotate = this.decomposeRotate(t);
    pose.rotation = _rotate === false ? this.preDegree : _rotate;
    pose.rotation += this._cacheRotate;
    if (_rotate !== false) this.preDegree = _rotate;
  }
  this.element.setProps(pose);
  return pose;
};

PathMotion.prototype.decomposeRotate = function(t) {
  let vector = this.path.getTangent(t);

  let nor = this._cacheVector.x * vector.y - vector.x * this._cacheVector.y;
  let pi = nor > 0 ? 1 : -1;
  let cos = (vector.x * this._cacheVector.x + vector.y * this._cacheVector.y)
            /
            ( Math.sqrt(vector.x * vector.x + vector.y * vector.y)
              *
              Math.sqrt(
                this._cacheVector.x * this._cacheVector.x
                +
                this._cacheVector.y * this._cacheVector.y
              )
            );
  if (isNaN(cos)) return false;
  return pi * Math.acos(cos) * Utils.RTD;
};

export {PathMotion};
