import {Sprite} from '../core/Sprite';
import {Container} from '../core/Container';
import {loaderUtil} from './Loader';
// import {Utils} from './Utils';

/**
 * 解析bodymovin从ae导出的数据
 * @param {object} options bodymovin从ae导出的数据
 */
function ParserAnimation(options) {
  this.prefix = options.prefix || '';
  this.doc = new Container();
  this.fr = options.fr || options.keyframes.fr;
  this.keyframes = options.keyframes;
  this.ip = this.keyframes.ip;
  this.op = this.keyframes.op;
  this.infinite = options.infinite || false;
  this.alternate = options.alternate || false;
  this.assetBox = null;
  this.preParser();
  this.parser(this.doc, this.keyframes.layers);
}
ParserAnimation.prototype.preParser = function() {
  const assets = this.keyframes.assets;
  const sourceMap = {};
  for (let i = 0; i < assets.length; i++) {
    const id = assets[i].id;
    const u = assets[i].u;
    const p = assets[i].p;
    if (u && p) {
      sourceMap[id] = u + p;
    }
  }
  this.assetBox = loaderUtil(sourceMap);
};
ParserAnimation.prototype.parser = function(doc, layers) {
  const l = layers.length;
  const infinite = this.infinite;
  const alternate = this.alternate;
  const ip = this.ip;
  const op = this.op;
  for (let i = l - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.ty === 2) {
      const id = this.getAssets(layer.refId).id;
      const ani = new Sprite({
        texture: this.assetBox.getById(id),
      });
      ani.keyFrames({
        ks: layer,
        fr: this.fr,
        ip,
        op,
        infinite,
        alternate,
      });
      ani.name = layer.nm;
      doc.adds(ani);
    }
    if (layer.ty === 0) {
      const ddoc = new Container();
      const llayers = this.getAssets(layer.refId).layers;
      ddoc.keyFrames({
        ks: layer,
        fr: this.fr,
        ip,
        op,
        infinite,
        alternate,
      });
      ddoc.name = layer.nm;
      doc.adds(ddoc);
      this.parser(ddoc, llayers);
    }
  }
};
ParserAnimation.prototype.getAssets = function(id) {
  const assets = this.keyframes.assets;
  for (let i = 0; i < assets.length; i++) {
    if (id === assets[i].id) return assets[i];
  }
};

export {ParserAnimation};