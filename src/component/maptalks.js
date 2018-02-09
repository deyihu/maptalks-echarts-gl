import echarts from 'echarts/lib/echarts';

import '../coord/maptalksCreator';

import './maptalks/MaptalksModel';
import './maptalks/MaptalksView';


echarts.registerAction({
    type: 'maptalksChangeCamera',
    event: 'maptalkscamerachanged',
    update: 'maptalks:updateCamera'
}, function (payload, ecModel) {
    ecModel.eachComponent({
        mainType: 'maptalks', query: payload
    }, function (componentModel) {
        componentModel.setMaptalksCameraOption(payload);
    });
});