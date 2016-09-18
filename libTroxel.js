'use strict';
var $ = require('jquery');
var Troxel = {
  blueprints: null,
  webgl: function() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl' || canvas.getContext('experimental-webgl'))));
    } catch (e) {
      return false;
    }
  },
  renderBlueprint: function(blueprintId, domElement, options, cb) {
    blueprintId = blueprintId.toLowerCase();
    if (!Troxel.webgl()) {
      console.warn("WebGL is not supported by your browser");
      if (typeof cb === 'function') {
        return cb(new Error("WebGl is not supported"));
      }
    }
    $.getJSON('https://troxel.js.org/trove-blueprints/index.json', function(meta){
      $.getJSON('https://troxel.js.org/trove-blueprints/' + meta.latest + '.json', function(data){
        Troxel.blueprints = data;
        var model = data[blueprintId];
        var result = {
          error: new Error("blueprintId " + blueprintId + " not found")
        };
        if (model != null) {
          result = Troxel.renderBase64(model, domElement, options, blueprintId);
        } else {
          console.warn("blueprintId " + blueprintId + " not found");
        }
        if (typeof cb === 'function') {
          cb(result.error, result.options);
        }
      });
    });
  },
  renderBase64: function(base64, domElement, options, blueprintId) {
    var Base64IO = require('troxel/Troxel.io.coffee!');
    var Renderer = require('troxel/Renderer.coffee!');
    if (options == null) {
      options = {};
    }
    if (!Troxel.webgl()) {
      console.warn("WebGL is not supported by your browser");
      return {
        error: new Error("WebGL is not supported by your browser")
      };
    }
    domElement = $(domElement).empty().css('position', 'relative');
    var io = null;
    try {
      io = new Base64IO(base64);
    } catch (e) {
      console.warn("passed String is not a valid base64 encoded voxel model");
      return {
        error: new Error("passed String is not a valid base64 encoded voxel model")
      };
    }
    var renderer = new Renderer(io, true, domElement, options.renderMode || 0, options.renderWireframes || 0, options.rendererAntialias || true, options.rendererSSAO || false);
    var THREE = require('three');
    if (options.rendererClearColor != null) {
      renderer.renderer.setClearColor(options.rendererClearColor);
    }
    if (options.ambientLightColor != null) {
      renderer.ambientLight.color = new THREE.Color(options.ambientLightColor);
    }
    if (options.directionalLightColor != null) {
      renderer.directionalLight.color = new THREE.Color(options.directionalLightColor);
    }
    if (options.directionalLightIntensity != null) {
      renderer.directionalLight.intensity = options.directionalLightIntensity;
    }
    if ((options.directionalLightVector != null) && (options.directionalLightVector.x != null) && (options.directionalLightVector.y != null) && (options.directionalLightVector.z != null)) {
      renderer.directionalLight.position.set(options.directionalLightVector.x, options.directionalLightVector.y, options.directionalLightVector.z).normalize();
    }
    if (options.pointLightColor != null) {
      renderer.pointLight.color = new THREE.Color(options.pointLightColor);
    }
    if (options.pointLightIntensity != null) {
      renderer.pointLight.intensity = options.pointLightIntensity;
    }
    if ((options.autoRotate == null) || options.autoRotate) {
      renderer.controls.autoRotate = true;
      renderer.controls.autoRotateSpeed = options.autoRotateSpeed || -4.0;
    }
    if ((options.controls != null) && !options.controls) {
      renderer.controls.mode = false;
    }
    if ((options.noZoom != null) && options.noZoom) {
      renderer.controls.noZoom = true;
    }
    if ((options.noPan != null) && options.noPan) {
      renderer.controls.noPan = true;
    }
    if ((options.noRotate != null) && options.noRotate) {
      renderer.controls.noRotate = true;
    }
    if ((options.showInfoLabel == null) || options.showInfoLabel) {
      var link = blueprintId != null ? '#b=' + blueprintId : '#m=' + base64;
      var info = $("<div><a href='http://chrmoritz.github.io/Troxel/" + link + "' target='_blank' class='troxelLink'>Open this model in Troxel</a></div>");
      domElement.append(info.css({
        position: 'absolute',
        bottom: '0px',
        width: '100%',
        textAlign: 'center'
      }));
    }
    var resultOptions = {};
    var _resultOptions = {
      rendererClearColor: 0x888888,
      ambientLightColor: 0x606060,
      directionalLightColor: 0xffffff,
      directionalLightIntensity: 0.3,
      directionalLightVector: {
        x: -0.5,
        y: -0.5,
        z: 1
      },
      pointLightColor: 0xffffff,
      pointLightIntensity: 0.7,
      base64: base64,
      controls: true,
      autoRotate: true,
      autoRotateSpeed: -4.0,
      noZoom: false,
      noPan: false,
      noRotate: false,
      renderMode: 0,
      renderWireframes: 0
    };
    _resultOptions.blueprint = blueprintId || null;
    Object.defineProperties(resultOptions, {
      "base64": {
        set: function(s) {
          _resultOptions.base64 = s;
          io = new Base64IO(s);
          renderer.reload(io.voxels, io.x, io.y, io.z, true, false);
        },
        get: function() {
          return _resultOptions.base64;
        }
      },
      "blueprint": {
        set: function(s) {
          _resultOptions.blueprint = s.toLowerCase();
          resultOptions.base64 = Troxel.blueprints[s.toLowerCase()];
        },
        get: function() {
          return _resultOptions.blueprint;
        }
      },
      "renderMode": {
        set: function(s) {
          _resultOptions.renderMode = s;
          renderer.renderMode = s;
          renderer.reload(io.voxels, io.x, io.y, io.z, false, false);
        },
        get: function() {
          return _resultOptions.renderMode;
        }
      },
      "renderWireframes": {
        set: function(s) {
          _resultOptions.renderWireframes = s;
          renderer.renderWireframes = s;
          renderer.reload(io.voxels, io.x, io.y, io.z, false, false);
        },
        get: function() {
          return _resultOptions.renderWireframes;
        }
      },
      "rendererClearColor": {
        set: function(s) {
          _resultOptions.rendererClearColor = s;
          renderer.renderer.setClearColor(s);
          renderer.render();
        },
        get: function() {
          return _resultOptions.rendererClearColor;
        }
      },
      "ambientLightColor": {
        set: function(s) {
          _resultOptions.ambientLightColor = s;
          renderer.ambientLight.color = new THREE.Color(s);
          renderer.render();
        },
        get: function() {
          return _resultOptions.ambientLightColor;
        }
      },
      "directionalLightColor": {
        set: function(s) {
          _resultOptions.directionalLightColor = s;
          renderer.directionalLight.color = new THREE.Color(s);
          renderer.render();
        },
        get: function() {
          return _resultOptions.directionalLightColor;
        }
      },
      "directionalLightIntensity": {
        set: function(s) {
          _resultOptions.directionalLightIntensity = s;
          renderer.directionalLight.intensity = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.directionalLightIntensity;
        }
      },
      "directionalLightVector": {
        set: function(s) {
          if ((s.x != null) && (s.y != null) && (s.z != null)) {
            _resultOptions.directionalLightVector = s;
            renderer.directionalLight.position.set(s.x, s.y, s.z).normalize();
            renderer.render();
          }
        },
        get: function() {
          return _resultOptions.directionalLightVector;
        }
      },
      "pointLightColor": {
        set: function(s) {
          _resultOptions.pointLightColor = s;
          renderer.pointLight.color = new THREE.Color(s);
          renderer.render();
        },
        get: function() {
          return _resultOptions.pointLightColor;
        }
      },
      "pointLightIntensity": {
        set: function(s) {
          _resultOptions.pointLightIntensity = s;
          renderer.pointLight.intensity = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.pointLightIntensity;
        }
      },
      "autoRotate": {
        set: function(s) {
          _resultOptions.autoRotate = s;
          renderer.controls.autoRotate = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.autoRotate;
        }
      },
      "autoRotateSpeed": {
        set: function(s) {
          if (renderer.controls.autoRotate) {
            _resultOptions.autoRotateSpeed = s;
            renderer.controls.autoRotateSpeed = s;
            renderer.render();
          }
        },
        get: function() {
          return _resultOptions.autoRotateSpeed;
        }
      },
      "controls": {
        set: function(s) {
          _resultOptions.controls = s;
          renderer.controls.mode = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.controls;
        }
      },
      "noZoom": {
        set: function(s) {
          _resultOptions.noZoom = s;
          renderer.controls.noZoom = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.noZoom;
        }
      },
      "noPan": {
        set: function(s) {
          _resultOptions.noPan = s;
          renderer.controls.noPan = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.noPan;
        }
      },
      "noRotate": {
        set: function(s) {
          _resultOptions.noRotate = s;
          renderer.controls.noRotate = s;
          renderer.render();
        },
        get: function() {
          return _resultOptions.noRotate;
        }
      }
    });
    return {
      error: null,
      options: resultOptions
    };
  }
};

module.exports = Troxel;

$(function() {
  $('div[data-troxel-blueprint]').each(function() {
    Troxel.renderBlueprint($(this).data('troxel-blueprint'), this, $(this).data('troxel-options'));
  });
  return $('div[data-troxel-base64]').each(function() {
    Troxel.renderBase64($(this).data('troxel-base64'), this, $(this).data('troxel-options'));
  });
});
