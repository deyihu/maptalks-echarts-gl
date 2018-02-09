import echarts from 'echarts/lib/echarts';

import componentPostEffectMixin from '../common/componentPostEffectMixin';
import componentLightMixin from '../common/componentLightMixin';

// var MAPBOX_CAMERA_OPTION = ['zoom', 'center', 'pitch', 'bearing'];
var MAPTALKS_CAMERA_OPTION = ['zoom', 'center', 'pitch', 'bearing'];

var MaptalksModel = echarts.extendComponentModel({

    type: 'maptalks',

    layoutMode: 'box',

    coordinateSystem: null,

    defaultOption: {
        zlevel: -10,

        // style: 'mapbox://styles/mapbox/light-v9',

        center: [120, 31],

        zoom: 1,

        pitch: 0,
        
        bearing: 0,

        light: {
            main: {
                alpha: 20,
                beta: 30
            }
        },

        altitudeScale: 1,
        // Default depend on altitudeScale
        boxHeight: 'auto'
    },

    getMaptalksCameraOption: function () {
        var self = this;
        return MAPTALKS_CAMERA_OPTION.reduce(function (obj, key) {
            obj[key] = self.get(key);
            return obj;
        }, {});
    },

    setMaptalksCameraOption: function (option) {
        // console.log(option)
        if (option != null) {
            MAPTALKS_CAMERA_OPTION.forEach(function (key) {
                if (option[key] != null) {
                    this.option[key] = option[key];
                }
            }, this);
        }
    },

    /**
     * Get maptalks instance
     */
    getMaptalks: function () {
        return this._maptalks;
    },

    setMaptalks: function (_maptalks) {
        this._maptalks = _maptalks;
    }
});

echarts.util.merge(MaptalksModel.prototype, componentPostEffectMixin);
echarts.util.merge(MaptalksModel.prototype, componentLightMixin);

export default MaptalksModel;