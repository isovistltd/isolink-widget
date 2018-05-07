define(
  ['dojo/_base/declare', '../Isovist/IsolinkUtils', 'jimu/BaseFeatureAction', 'jimu/WidgetManager'],
  function(declare, IsolinkUtils, BaseFeatureAction, WidgetManager) {
    var clazz = declare(BaseFeatureAction, {
      iconFormat: 'png',
      _isolinkUtils: undefined,
      integrationName: 'HP TRIM',

      isFeatureSupported: function(featureSet) {
        var feature = featureSet.features[0];
        var url = feature._layer.url;

        if (feature._layer && feature._layer.source && feature._layer.source && feature._layer.source.mapLayerId > -1) {
          url = url.replace('//dynamicLayer', '/' + feature._layer.source.mapLayerId);
        }

        //GET THE CURRENT ISOLINK UTILS OBJECT
        var isolinkWidget = WidgetManager.getInstance().getWidgetById(this.widgetId);

        return isolinkWidget.isolinkUtils.layerSupported(url, this.integrationName);
      },

      onExecute: function(featureSet) {
        var isolinkWidget = WidgetManager.getInstance().getWidgetById(this.widgetId);

        var feature = featureSet.features[0];
        var url = feature._layer.url;
        var oidField = feature._layer && feature._layer.objectIdField ? feature._layer.objectIdField : 'objectid';

        if (feature._layer && feature._layer.source && feature._layer.source && feature._layer.source.mapLayerId > -1) {
          url = url.replace('//dynamicLayer', '/' + feature._layer.source.mapLayerId);
        }
        var oids = [];
        featureSet.features.forEach(function(feature) {
          var idField = isolinkWidget.isolinkUtils.hasOwnPropertyCaseInsensitive(
            feature.attributes,
            oidField
          );
          if (idField) {
            oids.push(feature.attributes[idField]);
          }
        });

        isolinkWidget.isolinkUtils.executeFeatureAction(oids, url, this.integrationName);
      },
    });
    return clazz;
  }
);
