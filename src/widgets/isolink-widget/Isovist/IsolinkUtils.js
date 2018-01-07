/*
Isolink utils created to enable working with LocalMaps and Isolink with out having to maintain seperate versions of widgets.
*/

define(
  [
    'dojo/_base/declare',
    'dijit/form/Select',
    'dijit/form/TextBox',
    'dijit/form/Form',
    'dojo/dom-construct',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom',
    'dojo/Deferred',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/query',
    'dojo/request/xhr',
    'dojo/NodeList-dom',
    'dojo/on',
    'dojo/date/locale',
    'dojo/store/Memory',
    'dojo/topic',
    'esri/config',
    'esri/request',
    'esri/layers/FeatureLayer',
    'esri/tasks/FeatureSet',
    'esri/tasks/Geoprocessor',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'jimu/dijit/Message',
    'jimu/PanelManager',
    'jimu/utils',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/Popup',
    'dijit/form/CheckBox',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
  ],
  function(
    declare,
    Select,
    TextBox,
    Form,
    domConstruct,
    lang,
    html,
    dom,
    Deferred,
    domStyle,
    domClass,
    query,
    request,
    nodeList,
    on,
    locale,
    Memory,
    topic,
    esriConfig,
    esriRequest,
    FeatureLayer,
    FeatureSet,
    Geoprocessor,
    Query,
    QueryTask,
    Message,
    PanelManager,
    jimuUtils,
    LayerInfos,
    Popup,
    CheckBox
  ) {
    var IsolinkUtils = declare('IsolinkUtils', [], {
      isolinkUrl: '',
      isolinkProxyUrl: '',
      debugMode: false,
      label: 'Select the connection to use',
      selectedOIDs: [],
      layersAndIntegrations: {},
      currentUrl: '',
      isolinkClientUrl: 'isolink://',
      HANSEN: 'Hansen',
      WORKSASSETS: 'Technology One - Works and Assets',
      PROPERTYCI: 'Technology One - Property CI',
      TRIM: 'HP TRIM',
      PATHWAY: 'Pathway',

      layerSupported: function(layerUrl, integrationName) {
        var layer = '';
        if (layerUrl.url) {
          layer = layerUrl.url.substring(
            layerUrl.url.lastIndexOf('services/') + 9,
            layerUrl.url.length
          );
        } else {
          layer = layerUrl.substring(layerUrl.lastIndexOf('services/') + 9, layerUrl.length);
        }

        var supported = false;
        var integrations = this.layersAndIntegrations[layer];
        if (integrations === undefined) {
          return false;
        }

        integrations.forEach(
          lang.hitch(this, function(integration) {
            if (integration.IntegrationName === integrationName) {
              supported = true;
            }
          })
        );

        return supported;
      },

      load: function(layerDetails, url, proxyUrl, debugMode, label) {
        this.isolinkUrl = url;
        this.isolinkProxyUrl = proxyUrl;
        this.debugMode = debugMode;

        if (label) {
          this.label = label;
        }

        if (!this.isolinkUrl.endsWith('/')) {
          this.isolinkUrl += '/';
        }

        esriRequest.setRequestPreCallback(function setRequestPreCallback(args) {
          // don't send pre-flight options request
          args.headers = args.headers || {};
          args.headers['X-Requested-With'] = null;
          return args;
        });

        if (this.isolinkUrl.indexOf('://localhost') > -1) {
          esri.config.defaults.io.corsEnabledServers.push(this.isolinkUrl);
        }
        esriConfig.defaults.io.corsDetection = false;

        //Can either add urls or an object
        if (layerDetails.url) {
          for (var i = 0; i < layerDetails.length; i++) {
            this._getIntegrations(layerDetails[i].url);
          }
        } else {
          for (var i = 0; i < layerDetails.length; i++) {
            this._getIntegrations(layerDetails[i]);
          }
        }
      },

      hasOwnPropertyCaseInsensitive: function(obj, property) {
        var props = [];
        for (var i in obj) if (obj.hasOwnProperty(i)) props.push(i);
        var prop;
        while ((prop = props.pop())) if (prop.toLowerCase() === property.toLowerCase()) return prop;
        return false;
      },

      _getIntegrations: function(layerUrl) {
        var layer = '';
        if (layerUrl.url) {
          layer = layerUrl.url.substring(
            layerUrl.url.lastIndexOf('services/') + 9,
            layerUrl.url.length
          );
        } else {
          layer = layerUrl.substring(layerUrl.lastIndexOf('services/') + 9, layerUrl.length);
        }
        var url = this.isolinkUrl + 'api/integration/GetIntegrations?layerUrl=' + layer;

        esriRequest({
          url: url,
          handleAs: 'json',
        }).then(
          lang.hitch(this, function(response) {
            this.layersAndIntegrations[layer] = [];

            response.forEach(
              lang.hitch(this, function(integration) {
                this.layersAndIntegrations[layer].push({
                  IntegrationName: integration.IntegrationName,
                  TableKey: integration.TableKey,
                });
              })
            );
          }),
          function(error) {
            console.error('Error getting integrations.', error);
          }
        );
      },

      _getIntegrationButtons: function(layerUrl) {
        var integration = this.layersAndIntegrations[layerUrl];
        var btns = [];
        if (integration !== undefined) {
          btns = this._buildIntegrationButtons(integration);
        }
        return btns;
      },

      _buildIntegrationButtons: function(response) {
        var btns = [];
        response.forEach(
          lang.hitch(this, function(integration) {
            var hasTechOne = false;
            var hasTechOneCI = false;
            var hasHansen = false;
            var hasTrim = false;
            var hasPathway = false;

            var integrateButton = undefined;

            var listItem = undefined;

            switch (integration.IntegrationName) {
              case 'Technology One - Works and Assets':
                if (hasTechOne === false) {
                  listItem = domConstruct.create('li', {
                    style: {
                      display: 'inline',
                    },
                    id: 'btnWorksAssets',
                    class: 'reportItem',
                    integrationId: integration.TableKey,
                  });

                  integrateButton = domConstruct.create(
                    'a',
                    {
                      href: '#',
                      class: 'isolink-link',
                    },
                    listItem
                  );
                  domConstruct.create(
                    'i',
                    {
                      class: 'isolink-icon glyphicon-tech-one',
                      title: integration.IntegrationName,
                    },
                    integrateButton
                  );
                }
                break;
              case 'Technology One - Property CI':
                if (hasTechOneCI === false) {
                  listItem = domConstruct.create('li', {
                    style: {
                      display: 'inline',
                    },
                    id: 'btnPropertyCI',
                    class: 'reportItem',
                    integrationId: integration.TableKey,
                  });

                  integrateButton = domConstruct.create(
                    'a',
                    {
                      href: '#',
                      class: 'isolink-link',
                    },
                    listItem
                  );

                  domConstruct.create(
                    'i',
                    {
                      class: 'isolink-icon glyphicon-tech-one',
                      title: integration.IntegrationName,
                    },
                    integrateButton
                  );
                  hasTechOneCI = true;
                }
                break;
              case 'HP TRIM':
                if (hasTrim === false) {
                  listItem = domConstruct.create('li', {
                    style: {
                      display: 'inline',
                    },
                    id: 'btnTRIM',
                    class: 'reportItem',
                    integrationId: integration.TableKey,
                  });

                  integrateButton = domConstruct.create(
                    'a',
                    {
                      href: '#',
                      class: 'isolink-link',
                    },
                    listItem
                  );
                  domConstruct.create(
                    'i',
                    {
                      class: 'isolink-icon glyphicon-trim',
                      title: integration.IntegrationName,
                    },
                    integrateButton
                  );
                  this.hasTrim = true;
                }
                break;
              case 'Hansen':
                if (hasHansen === false) {
                  listItem = domConstruct.create('li', {
                    style: {
                      display: 'inline',
                    },
                    id: 'btnHansen',
                    class: 'reportItem',
                    integrationId: integration.TableKey,
                  });

                  integrateButton = domConstruct.create(
                    'a',
                    {
                      href: '#',
                      class: 'isolink-link',
                    },
                    listItem
                  );
                  domConstruct.create(
                    'i',
                    {
                      class: 'isolink-icon glyphicon-hansen',
                      title: integration.IntegrationName,
                    },
                    integrateButton
                  );
                  this.hasHansen = true;
                }
                break;
              case 'Pathway':
                if (hasPathway === false) {
                  listItem = domConstruct.create('li', {
                    style: {
                      display: 'inline',
                    },
                    id: 'btnPathway',
                    class: 'reportItem',
                    integrationId: integration.TableKey,
                  });

                  integrateButton = domConstruct.create(
                    'a',
                    {
                      href: '#',
                      class: 'isolink-link',
                    },
                    listItem
                  );
                  domConstruct.create(
                    'i',
                    {
                      class: 'isolink-icon glyphicon-pathway',
                      title: integration.IntegrationName,
                    },
                    integrateButton
                  );
                  this.hasPathway = true;
                }
                break;
              default:
            }

            if (listItem !== undefined) {
              btns.push(listItem);
            }
          })
        );
        return btns;
      },

      _showErrorMsg: function(/* optional */ msg) {
        new Message({
          message: msg || this.nls.resultsError,
        });
      },

      executeFeatureAction: function(oids, url, integrationName) {
        layer = url.substring(url.lastIndexOf('services/') + 9, url.length);

        var integration = this.layersAndIntegrations[layer];

        if (integration !== undefined) {
          integration.forEach(
            lang.hitch(this, function(ints) {
              if (ints.IntegrationName === integrationName) {
                this._onIntegrationClicked(ints.TableKey, oids, url);
              }
            })
          );
        }
      },

      _onIntegrationClicked: function(integrationKey, oids, url) {
        //TODO handle integration calls here....
        //Get the id of the button
        //Use the id to get the parameters required
        //Pull the parameters from the required fields
        //Execute the integration
        this.currentUrl = url;
        if (oids.length > 0) {
          this.selectedOIDs = oids;
          this._getIntegrationParameters(integrationKey, url);
        } else {
          new Message({
            message: 'No features found',
          });
        }
      },

      _getIntegrationParameters: function(key, layerUrl) {
        var layer = '';
        if (layerUrl.indexOf('http') > -1) {
          layer = layerUrl.substring(layerUrl.lastIndexOf('services/') + 9, layerUrl.length);
        } else {
          layer = layerUrl;
        }
        var url =
          this.isolinkUrl +
          'api/integration/GetIntegrationParameters?key=' +
          key +
          '&layerUrl=' +
          layer;
        var self = this;

        esriRequest({
          url: url,
          handleAs: 'json',
        }).then(lang.hitch(this, this._performIntegration), function(err) {
          console.error('Error getting integration parameters', err);
        });
      },

      _performIntegration: function(parameters) {
        params = [];

        parameters.forEach(
          lang.hitch(this, function(p) {
            var connection = {
              name: '',
              fields: [],
              system: '',
              connectionName: '',
              configuration: '',
              url: '',
            };
            var hasConnection = false;
            params.forEach(function(pa) {
              if (pa.name == p.ConnectionName) {
                hasConnection = true;
                connection = pa;
                connection.fields.push(p.LayerField);
              }
            });

            if (hasConnection !== true) {
              connection.name = p.ConnectionName;
              connection.system = p.System;
              connection.connectionName = p.ConnectionName;
              connection.configuration = p.Configuration;
              connection.fields.push(p.LayerField);
              connection.url = p.IntegrationUrl;
              params.push(connection);
            }
          })
        );

        if (
          params.length > 1 ||
          (params.length > 0 && params[0].system.toLowerCase().indexOf('pathway') > -1)
        ) {
          //SELECT WHICH ONE TO RUN....
          this._createOptionsPopUp(params);
        } else {
          this._callIsolink(params, 0);
        }
      },

      _createOptionsPopUp: function(params) {
        var system = params && params.length > 0 ? params[0].system.toLowerCase() : '';
        var isSaveQuery =
          params && params.length > 0 ? params[0].name.toLowerCase().indexOf('save') > -1 : false;
        var data = [];
        for (var i = 0; i < params.length; i++) {
          data.push({
            label: params[i].name.split('-').join(' '),
            value: i,
            selected: i === 0,
          });
        }

        var form = new Form();

        var paramOptions = new Select({
          name: 'selectConfig',
          options: data,
          style: {
            width: '250px',
          },
          value: data && data.length > 0 ? data[0].value : null,
        }).placeAt(form.containerNode);

        var txtExtraQuery = new TextBox({
          name: 'extraQuery',
          placeholder: 'Enter the query name',
          style: {
            display: system.indexOf('pathway') > -1 && isSaveQuery === true ? 'block' : 'none',
            margin: '12px 0 0 0',
          },
          value: '',
        }).placeAt(form.containerNode);

        paramOptions.on('change', function(evt) {
          var systemChange = params && params.length > evt ? params[evt].system.toLowerCase() : '';
          var isSaveQueryChange =
            params && params.length > evt
              ? params[evt].name.toLowerCase().indexOf('save') > -1
              : false;

          query('div[widgetid=' + txtExtraQuery.id + ']').style(
            'display',
            systemChange.indexOf('pathway') > -1 && isSaveQueryChange === true ? 'block' : 'none'
          );
        });

        var optionsPopup = new Popup({
          titleLabel: this.label,
          width: 430,
          maxHeight: 600,
          autoHeight: true,
          content: form,
          buttons: [
            {
              label: 'Ok',
              onClick: lang.hitch(this, function() {
                this._callIsolink(params, paramOptions.value, txtExtraQuery.value);
                optionsPopup.close();
                optionsPopup = null;
              }),
            },
            {
              label: 'Cancel',
              onClick: lang.hitch(this, function() {
                optionsPopup.close();
                optionsPopup = null;
              }),
            },
          ],
          onClose: function() {
            optionsPopup = null;
          },
        });
      },

      _openUrl: function(url) {
        // open the IsoLink client application which calls the requested integration
        var link = document.createElement('a');
        link.href = url;
        link.style.display = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },

      _callIsolink: function(params, index, extraQuery) {
        var config = params[index];
        var system = config.system.toLowerCase();

        var q = new Query();
        q.objectIds = this.selectedOIDs;

        var outField = [];

        for (var i = 0; i < config.fields.length; i++) {
          var field = config.fields[i];
          if (outField.indexOf(field) == -1) {
            outField.push(field);
          }
        }
        q.outFields = outField;

        var qt = QueryTask(this.currentUrl);
        qt.execute(
          q,
          lang.hitch(this, function(response) {
            var inputs = [];
            response.features.forEach(
              lang.hitch(this, function(feature) {
                if (system === 'trim') {
                  var field = config.fields[0];
                  inputs.push(feature.attributes[field]);
                } else {
                  var featureInputs = [];

                  for (var i = 0; i < config.fields.length; i++) {
                    var field = config.fields[i];
                    featureInputs.push(feature.attributes[field]);
                  }
                  inputs.push(featureInputs);
                }
              })
            );

            if (system === 'hansen') {
              var url = this.isolinkUrl + 'api/integration/GetHansenConfiguration';
              var self = this;
              esriRequest({
                url: url,
                handleAs: 'json',
              }).then(
                lang.hitch(this, function(hansenConfigs) {
                  var assetString = '';
                  for (var i = 0; i < inputs.length; i++) {
                    if (assetString === '') {
                      assetString = assetString + inputs[i];
                    } else {
                      assetString = assetString + ',' + inputs[i];
                    }
                  }
                  var hansenUrl =
                    hansenConfigs[0].HansenConnections[0].URL + '&srcid=' + assetString;
                  window.open(hansenUrl);
                }),
                function(err) {
                  console.error('Error getting Hansen configuration.', err);
                }
              );
            } else {
              // call IsoLink
              if (system === 'pathways') {
                system = 'pathway';
              }

              var url =
                this.isolinkClientUrl +
                system +
                '?IsoLinkUri=' +
                encodeURIComponent(this.isolinkUrl) +
                '&Configuration=' +
                encodeURIComponent(config.configuration) +
                '&Connection=' +
                encodeURIComponent(config.connectionName);

              if (this.debugMode === true) {
                url = url + '&ExplicitExceptionInResponse=true';
              }

              if (this.isolinkProxyUrl && this.isolinkProxyUrl.length > 0) {
                url = url + '&IsoLinkProxyUri=' + encodeURIComponent(this.isolinkProxyUrl);
              }

              for (var i = 0; i < inputs.length; i++) {
                url = url + '&Ids=' + encodeURIComponent(inputs[i].join());
              }

              if (system.indexOf('pathway') > -1 && extraQuery && extraQuery.length > 0) {
                url = url + '&Query=' + encodeURIComponent(extraQuery);
              }

              this._openUrl(url);
            }
          }),
          function(err) {
            console.error('Error executing query task.', err);
          }
        );
      },
    });

    if (!_instance) {
      var _instance = new IsolinkUtils();
    }
    return _instance;
  }
);

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
    var subjectString = this.toString();
    if (
      typeof position !== 'number' ||
      !isFinite(position) ||
      Math.floor(position) !== position ||
      position > subjectString.length
    ) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}
