define(
  ['dojo/_base/declare', '../Isovist/IsolinkUtils', 'jimu/BaseFeatureAction', 'jimu/WidgetManager'],
  function(declare, IsolinkUtils, BaseFeatureAction, WidgetManager) {
    var clazz = declare(BaseFeatureAction, {
      iconFormat: 'png',
      _isolinkUtils: undefined,
      integrationName: 'Technology One - Property CI',

      isFeatureSupported: function(featureSet) {
        var url = featureSet.features[0]._layer.url;

        //GET THE CURRENT ISOLINK UTILS OBJECT
        var isolinkWidget = WidgetManager.getInstance().getWidgetById(this.widgetId);

        return isolinkWidget.isolinkUtils.layerSupported(url, this.integrationName);
      },

      onExecute: function(featureSet) {
        var isolinkWidget = WidgetManager.getInstance().getWidgetById(this.widgetId);

        var url = featureSet.features[0]._layer.url;
        var oids = [];
        featureSet.features.forEach(function(feature) {
          var idField = isolinkWidget.isolinkUtils.hasOwnPropertyCaseInsensitive(
            feature.attributes,
            'objectid'
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
