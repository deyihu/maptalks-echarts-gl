import Maptalks from './maptalks/Maptalks';
import echarts from 'echarts/lib/echarts';
import retrieve from '../util/retrieve';
import graphicGL from '../util/graphicGL';
import ViewGL from '../core/ViewGL';

function resizeMapTalks(maptalksModel, api) {
    var width = api.getWidth();
    var height = api.getHeight();
    var dpr = api.getDevicePixelRatio();
    this.viewGL.setViewport(0, 0, width, height, dpr);

    this.width = width;
    this.height = height;

    this.altitudeScale = maptalksModel.get('altitudeScale');

    this.boxHeight = maptalksModel.get('boxHeight');
    // this.updateTransform();
}


function updateMapTalks(ecModel, api) {

    if (this.model.get('boxHeight') === 'auto') {
        return;
    }
    
    var altitudeDataExtent = [Infinity, -Infinity]

    ecModel.eachSeries(function (seriesModel) {
        if (seriesModel.coordinateSystem !== this) {
            return;
        }
        
        // Get altitude data extent.
        var data = seriesModel.getData();
        var altDim = seriesModel.coordDimToDataDim('alt')[0];
        if (altDim) {
            // TODO altitiude is in coords of lines.
            var dataExtent = data.getDataExtent(altDim, true);
            altitudeDataExtent[0] = Math.min(
                altitudeDataExtent[0], dataExtent[0]
            );
            altitudeDataExtent[1] = Math.max(
                altitudeDataExtent[1], dataExtent[1]
            );
        }
    }, this);
    if (altitudeDataExtent && isFinite(altitudeDataExtent[1] - altitudeDataExtent[0])) {
        this.altitudeExtent = altitudeDataExtent;
    }
}

var maptalksCreator = {


    dimensions: Maptalks.prototype.dimensions,

    create: function (ecModel, api) {
        var maptalksList = [];

        ecModel.eachComponent('maptalks', function (maptalksModel) {
            var viewGL = maptalksModel.__viewGL;
            if (!viewGL) {
                viewGL = maptalksModel.__viewGL = new ViewGL();
                viewGL.setRootNode(new graphicGL.Node());
            }

            var maptalksCoordSys = new Maptalks();
            maptalksCoordSys.viewGL = maptalksModel.__viewGL;
            // Inject resize
            maptalksCoordSys.resize = resizeMapTalks;
            maptalksCoordSys.resize(maptalksModel, api);

            maptalksList.push(maptalksCoordSys);

            maptalksModel.coordinateSystem = maptalksCoordSys;
            maptalksCoordSys.model = maptalksModel;

            maptalksCoordSys.setCameraOption(
                maptalksModel.getMaptalksCameraOption()
            );

            maptalksCoordSys.update = updateMapTalks;
        });

        ecModel.eachSeries(function (seriesModel) {
            if (seriesModel.get('coordinateSystem') === 'maptalks') {
                var maptalksModel = seriesModel.getReferringComponents('maptalks')[0];
                if (!maptalksModel) {
                    maptalksModel = ecModel.getComponent('maptalks');
                }

                if (!maptalksModel) {
                    throw new Error('maptalks "' + retrieve.firstNotNull(
                        seriesModel.get('maptalksIndex'),
                        seriesModel.get('maptalksId'),
                        0
                    ) + '" not found');
                }

                seriesModel.coordinateSystem = maptalksModel.coordinateSystem;
            }
        });

        return maptalksList;
    }
};


echarts.registerCoordinateSystem('maptalks', maptalksCreator);

export default maptalksCreator;