import echarts from 'echarts/lib/echarts';
import MaptalksLayer from './MaptalksLayer';
import SceneHelper from '../common/SceneHelper';
import graphicGL from '../../util/graphicGL';

import displayShadowGLSL from '../../util/shader/displayShadow.glsl.js';

graphicGL.Shader.import(displayShadowGLSL);

var TILE_SIZE = 256;

export default echarts.extendComponentView({

    type: 'maptalks',

    __ecgl__: true,

    init: function (ecModel, api) {
        var zr = api.getZr();
        this._zrLayer = new MaptalksLayer('maptalks', zr);
        zr.painter.insertLayer(-1000, this._zrLayer);
        this._lightRoot = new graphicGL.Node();
        this._sceneHelper = new SceneHelper(this._lightRoot);
        this._sceneHelper.initLight(this._lightRoot);

        var maptalks = this._zrLayer.getMaptalks();
        var dispatchInteractAction = this._dispatchInteractAction.bind(this, api, maptalks);

        // // PENDING 
        // ['zoom', 'rotate', 'drag', 'pitch', 'rotate', 'move'].forEach(function (eName) {
        //     mapbox.on(eName, dispatchInteractAction);
        // });

        //EVENTS  FROM MAPTALKS
           ['zoomend','zooming','zoomstart', 'dragrotating', 'pitch','pitchend','movestart',
           'moving','moveend','resize','touchstart','touchmove','touchend'].forEach(function (eName) {
            maptalks.on(eName,dispatchInteractAction);
        });

        this._groundMesh = new graphicGL.Mesh({
            geometry: new graphicGL.PlaneGeometry(),
            material: new graphicGL.Material({
                shader: new graphicGL.Shader({
                    vertex: graphicGL.Shader.source('ecgl.displayShadow.vertex'),
                    fragment: graphicGL.Shader.source('ecgl.displayShadow.fragment')
                }),
                depthMask: false
            }),
            // Render first
            renderOrder: -100,
            culling: false,
            castShadow: false,
            $ignorePicking: true,
            renderNormal: true
        });
    },

    render: function (maptalksModel, ecModel, api) {
        var maptalks = this._zrLayer.getMaptalks();
        // var styleDesc = maptalksModel.get('style');
        var baseLayer=maptalksModel.get('baseLayer');
        // console.log(baseLayer)
        var tileLayer;
        var id='maptalks-echarts-gl-tileLayer'
        if(baseLayer){
            tileLayer=new  window.maptalks.TileLayer(id, baseLayer)
          
        }else{
            var options={
                'urlTemplate': 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                
            }
            tileLayer=new  window.maptalks.TileLayer(id, options)
        }
        maptalks.setBaseLayer(tileLayer);

        // var styleStr = JSON.stringify(styleDesc);
        // if (styleStr !== this._oldStyleStr) {
        //     if (styleDesc) {
        //         // mapbox.setStyle(styleDesc);
        //     }
        // }

        // this._oldStyleStr = styleStr;


        maptalks.setZoom(maptalksModel.get('zoom'),{animation:false});
        maptalks.setPitch(maptalksModel.get('pitch'));
        maptalks.setBearing(maptalksModel.get('bearing'));

         var center=new window.maptalks.Coordinate(maptalksModel.get('center'))
        setTimeout(function(){
             maptalks.setCenter(center);
        }, 100);
        // // maptalks.once('renderend',function(){
        //     maptalks.setCenter(center);
        // // })
         

        maptalksModel.setMaptalks(maptalks);

        var coordSys = maptalksModel.coordinateSystem;

        // Not add to rootNode. Or light direction will be stretched by rootNode scale
        coordSys.viewGL.scene.add(this._lightRoot);
        coordSys.viewGL.add(this._groundMesh);

        this._updateGroundMesh();
        
        // Update lights
        this._sceneHelper.setScene(coordSys.viewGL.scene);
        this._sceneHelper.updateLight(maptalksModel);

        // Update post effects
        coordSys.viewGL.setPostEffect(maptalksModel.getModel('postEffect'), api);
        coordSys.viewGL.setTemporalSuperSampling(maptalksModel.getModel('temporalSuperSampling'));

        this._maptalksModel = maptalksModel;
    },

    afterRender: function (maptalksModel, ecModel, api, layerGL) {
        // layerGL.dom.style.pointerEvents='none';
        var parentContainer=layerGL.dom.parentNode;
        var childNodes=parentContainer.childNodes;
        //dom 鼠标穿透，否则不能缩放maptalks map 对象呢？？？？？
        for(var i=1;i<childNodes.length;i++){
            childNodes[i].style.pointerEvents='none'
        }
        var renderer = layerGL.renderer;
        this._sceneHelper.updateAmbientCubemap(renderer, maptalksModel, api);
        this._sceneHelper.updateSkybox(renderer, maptalksModel, api);

        // FIXME If other series changes coordinate system.
        maptalksModel.coordinateSystem.viewGL.scene.traverse(function (mesh) {
            if (mesh.material) {
                mesh.material.shader.define('fragment', 'NORMAL_UP_AXIS', 2);
                mesh.material.shader.define('fragment', 'NORMAL_FRONT_AXIS', 1);
            }
        });
    },

    updateCamera: function (maptalksModel, ecModel, api, payload) {
        maptalksModel.coordinateSystem.setCameraOption(payload);

        this._updateGroundMesh();

        api.getZr().refresh();
    },

    _dispatchInteractAction: function (api, maptalks, maptalksModel) {
        var maxPitch=60;
        var minPitch=5;
       
        if(maptalks.getPitch()>maxPitch) maptalks.setPitch(maxPitch)
        if(maptalks.getPitch()<=minPitch) maptalks.setPitch(minPitch);
        api.dispatchAction({
            type: 'maptalksChangeCamera',
            pitch: maptalks.getPitch(),
            zoom: maptalks.getZoom(),
            center: maptalks.getCenter().toArray(),
            bearing: maptalks.getBearing(),
            maptalksId: this._maptalksModel && this._maptalksModel.id
        });
    },

    _updateGroundMesh: function () {
        if (this._maptalksModel) {
            var coordSys = this._maptalksModel.coordinateSystem;
            var pt = coordSys.dataToPoint(coordSys.center);
            this._groundMesh.position.set(pt[0], pt[1], -0.001);

            var plane = new graphicGL.Plane(new graphicGL.Vector3(0, 0, 1), 0);
            var ray1 = coordSys.viewGL.camera.castRay(new graphicGL.Vector2(-1, -1));
            var ray2 = coordSys.viewGL.camera.castRay(new graphicGL.Vector2(1, 1));
            var pos0 = ray1.intersectPlane(plane);
            var pos1 = ray2.intersectPlane(plane);
            var scale = pos0.dist(pos1) / coordSys.viewGL.rootNode.scale.x;
            this._groundMesh.scale.set(scale, scale, 1);
        }
    },

    dispose: function (ecModel, api) {
        api.getZr().delLayer(-1000);
    }
});