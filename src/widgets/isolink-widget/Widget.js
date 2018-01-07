define(
  [
    'dojo/_base/declare',
    'dojo/Deferred',
    'dojo/_base/html',
    'dojo/_base/lang',
    'esri/request',
    'jimu/BaseWidget',
  ],
  function(declare, Deferred, html, lang, esriRequest, BaseWidget) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'isolink-widget',
      name: 'Isolink',
      isolinkUtils: undefined,
      // this property is set by the framework when widget is loaded.
      // name: 'workforce-widget',
      // add additional properties here

      //methods to communication with app container:
      postCreate: function() {
        this.inherited(arguments);
      },

      _getLayerInfoById: function(layerInfos, id) {
        return layerInfos.filter(function(obj) {
          return obj.id === id;
        });
      },

      startup: function() {
        var url = this.config.isolinkUrl ? this.config.isolinkUrl : this.appConfig.isolinkUrl;

        var itemData = this.map.itemInfo.itemData;
        this.layersAndTables = [];
        if (itemData.operationalLayers) {
          this.layersAndTables = this.layersAndTables.concat(itemData.operationalLayers);
        }
        if (itemData.tables) {
          this.layersAndTables = this.layersAndTables.concat(itemData.tables);
        }
        this.layerUrls = [];

        for (var i = 0; i < this.layersAndTables.length; i++) {
          var layerOrTable = this.layersAndTables[i];

          var layer = layerOrTable.layerObject;

          if (layerOrTable.layerType && layerOrTable.layerType === 'ArcGISMapServiceLayer') {
            for (var li = 0; li < layer.layerInfos.length; li++) {
              var lyr = layer.layerInfos[li];
              var lyrInfo = this._getLayerInfoById(layer.layerInfos, lyr.id)[0];
              if (lyrInfo) {
                this.layerUrls.push({
                  name: lyrInfo.name,
                  url: layerOrTable.url + '/' + lyr.id,
                });
              } else
                console.warn(
                  'unable to get sub-layer info for layer ' + layerOrTable.title + '#id:' + lyr.id
                );
            }
          } else if (layer && layer.infoTemplate) {
            this.layerUrls.push({
              name: layerOrTable.title,
              url: layerOrTable.url,
            });
          } else if (layerOrTable.popupInfo) {
            this.layerUrls.push({
              name: layerOrTable.title,
              url: layerOrTable.url,
            });
          }
        }

        if (url !== undefined && url !== '') {
          this.isolink = true;

          var folderUrl = window.location.origin + this.folderUrl + 'Isovist/IsolinkUtils.js';
          var cssUrl = window.location.origin + this.folderUrl + 'Isovist/css/style.css';
          //todo load in isolink utils
          var isolinkDeferred = new Deferred();

          html.create(
            'link',
            {
              id: 'IsolinkCSS',
              rel: 'stylesheet',
              type: 'text/css',
              href: cssUrl,
            },
            document.getElementsByTagName('head')[0]
          );

          require([folderUrl], function(requirement) { // or use a variable :)
            isolinkDeferred.resolve(requirement);
          });

          isolinkDeferred.then(
            lang.hitch(this, function(IsolinkUtils) {
              this.isolinkUtils = IsolinkUtils;
              this.isolinkUtils.load(
                this.layerUrls,
                url,
                this.config.proxyUrl,
                this.config.debugMode,
                this.config.label
              );
            }),
            function(err) {
              // failure
              console.error('Error: Failed to add isolink.', err);
            }
          );
        }
      },
    });
  }
);
