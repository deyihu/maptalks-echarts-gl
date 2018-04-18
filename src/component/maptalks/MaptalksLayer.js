/**
 * @constructor
 * @alias 
 * @param {string} id Layer ID
 * @param {module:zrender/ZRender} zr
 */

 
function MaptalksLayer (id, zr) {
    this.id = id;
    this.zr = zr;
    var width=zr.painter._width;
    var height=zr.painter._height;
    // zr.painter.style.pointerEvents='none'
    this.dom = document.createElement('div');
    this.dom.className='maptalks'
    this.dom.style.cssText = 'position:absolute;left:0;right:0;top:0;bottom:0;';
    // FIXME If in module environment.
    if (!window.maptalks) {
        throw new Error('maptalks library must be included. URL:https://cdn.jsdelivr.net/npm/maptalks@0.37.0-alpha.0/dist/maptalks.min.js,More Please See http://maptalks.org/maptalks.js/api/0.x/Map.html');
    }

    this._maptalks = new maptalks.Map(this.dom,{
        // container: this.dom
          center:[120,31],
          zoom:1
    });
    this._initEvents();

}



MaptalksLayer.prototype.resize = function () {
    this._maptalks.checkSize()


};

MaptalksLayer.prototype.getMaptalks = function () {
    return this._maptalks;
};

MaptalksLayer.prototype.clear = function () {};


MaptalksLayer.prototype.refresh = function () {
     this._maptalks.checkSize()
};


var EVENTS = ['mousedown', 'mouseup', 'click', 'dblclick', 'mousemove',
    'mousewheel', 'DOMMouseScroll',
    'touchstart', 'touchend', 'touchmove', 'touchcancel'
];

MaptalksLayer.prototype._initEvents = function () {
    var maptalksRoot=this.dom;
    this._handlers = this._handlers || {
        contextmenu: function (e) {
            e.preventDefault();
            return false;
        }
    };
    EVENTS.forEach(function (eName) {
        this._handlers[eName] = function (e) {
            var obj = {};
            for (var name in e) {
                obj[name] = e[name];
            }
            obj.bubbles = false;
            var newE = new e.constructor(e.type, obj);
            if (eName === 'mousewheel' || eName === 'DOMMouseScroll') {
                // maptalks listens events to different elements?
                maptalksRoot.dispatchEvent(newE);
            }
            else {
                maptalksRoot.firstElementChild.dispatchEvent(newE);
            }
        };
        this.zr.dom.addEventListener(eName, this._handlers[eName]);
    }, this);
    // PENDING
    this.zr.dom.addEventListener('contextmenu', this._handlers.contextmenu);
};

MaptalksLayer.prototype.dispose = function () {
    EVENTS.forEach(function (eName) {
        this.zr.dom.removeEventListener(eName, this._handlers[eName]);
    }, this);
};

export default MaptalksLayer;