define('modules/houseList', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
	var Widget = function(options){
		var _self = this;
		_self.options = options;
		_self.ajaxUtil = new ajaxUtil(_self.options.proxyUrl);
		_self.common = new common();
		_self._init();
	};

	Widget.prototype = {
    _init: function() {
      var _self = this;
      if (_self.options.isLogin == true) {
        _self._getAuthorInfo();
      }
      _self._setDefaultOptions();
      _self._constructMap();
      _self._logout();
    },
    _getAuthorInfo: function() {
      var _self = this;
      var cookies = _self.common.getCookieValue(_self.options.authorInfoKey);
      if (cookies == "" || cookies == null || cookies == undefined) {
        window.location.href = "login.html";
      } else {
        _self.options.authorInfo = $.parseJSON(cookies);
        if(_self.options.authorInfo.role.name != '管理员'){
          $('#usermanager').empty();
          $('#monitor').empty();
          $('#settings').empty();
        }
        $("#loguser").html('当前用户：' + _self.options.authorInfo.role.name + ' ' + _self.options.authorInfo.username);
        $("#loguser").attr('当前用户：' + _self.options.authorInfo.role.name + ' ' + _self.options.authorInfo.username);
        $("#logusername").html('欢迎您，' + _self.options.authorInfo.username + ' <i class="fa-angle-down"></i>');
      }
    },
    _logout: function() {
      var _self = this;
      $("#logout").on("click", function() {
        _self.common.deleteCookie(_self.options.authorInfoKey, "/");
        window.location.href = "login.html";
      });
    },
		_setDefaultOptions: function(){
			var _self = this;
      _self._setMainHeight();
			_self.common.fixExtention();
		},
    _setMainHeight: function() {
      var _self = this;
      $('.page-body-static').css('height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight());

      $(window).on('resize', function(e){
        clearTimeout(_self.options.mapTimer);
        _self.options.mapTimer = setTimeout(function() {
          _self.resize();
        }, 300);
      });
    },
    _constructMap: function() {
      var _self = this,
          houseDatas = {
            '土木结构': [],
            '砖木结构': [],
            '砖混结构': [],
            '框架结构': [],
            '高层钢混结构': []
          },
          housDatas = [];
      _self.ajaxUtil.query(_self.options.OprUrls.house.queryUrl, null, function(respons0) {
        if(respons0.result && respons0.list){
          $.each(respons0.list, function(k0, v0){
            houseDatas[v0.type] && houseDatas[v0.type].push({
              name: v0.type,
              value: [v0.longitude, v0.latitude, parseInt(v0.floor)]
            })
          });
          $('.badge-white').html(respons0.list.length);
          $('.badge-tm').html(houseDatas['土木结构'].length);
          $('.badge-zm').html(houseDatas['砖木结构'].length);
          $('.badge-zh').html(houseDatas['砖混结构'].length);
          $('.badge-kj').html(houseDatas['框架结构'].length);
          $('.badge-gc').html(houseDatas['高层钢混结构'].length);
          _self._constructPointVisualMap(houseDatas, 'map');
        }
        else {
          $('#map').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
      });
    },
    _constructPointVisualMap: function(housDatas, domID) {
      var _self = this;
      _self.myChart = echarts.init(document.getElementById(domID));  
      var option = {
        bmap: {
          roam: true,
          mapStyle: {
            'styleJson': [{
              'featureType': 'water',
              'elementType': 'all',
              'stylers': {
                'color': '#031628'
              }
            }, {
              'featureType': 'land',
              'elementType': 'geometry',
              'stylers': {
                'color': '#000102'
              }
            }, {
              'featureType': 'highway',
              'elementType': 'all',
              'stylers': {
                'visibility': 'off'
              }
            }, {
              'featureType': 'arterial',
              'elementType': 'geometry.fill',
              'stylers': {
                'color': '#000000'
              }
            }, {
              'featureType': 'arterial',
              'elementType': 'geometry.stroke',
              'stylers': {
                'color': '#0b3d51'
              }
            }, {
              'featureType': 'local',
              'elementType': 'geometry',
              'stylers': {
                'color': '#000000'
              }
            }, {
              'featureType': 'railway',
              'elementType': 'geometry.fill',
              'stylers': {
                'color': '#000000'
              }
            }, {
              'featureType': 'railway',
              'elementType': 'geometry.stroke',
              'stylers': {
                'color': '#08304b'
              }
            }, {
              'featureType': 'subway',
              'elementType': 'geometry',
              'stylers': {
                'lightness': -70
              }
            }, {
              'featureType': 'building',
              'elementType': 'geometry.fill',
              'stylers': {
                'color': '#000000'
              }
            }, {
              'featureType': 'all',
              'elementType': 'labels.text.fill',
              'stylers': {
                'color': '#857f7f'
              }
            }, {
              'featureType': 'all',
              'elementType': 'labels.text.stroke',
              'stylers': {
                'color': '#000000'
              }
            }, {
              'featureType': 'building',
              'elementType': 'geometry',
              'stylers': {
                'color': '#022338'
              }
            }, {
              'featureType': 'green',
              'elementType': 'geometry',
              'stylers': {
                'color': '#062032'
              }
            }, {
              'featureType': 'boundary',
              'elementType': 'all',
              'stylers': {
                'color': '#465b6c'
              }
            }, {
              'featureType': 'manmade',
              'elementType': 'all',
              'stylers': {
                'color': '#022338'
              }
            }, {
              'featureType': 'label',
              'elementType': 'all',
              'stylers': {
                'visibility': 'off'
              }
            }]
          }
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          data: ['土木结构', '砖木结构', '砖混结构', '框架结构', '高层钢混结构'],
          show: false
        },
        series: [{
          name: '土木结构',
          type: 'scatter',
          data: housDatas['土木结构'],
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[2];
          },
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            },
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            normal: {
              color: '#a6c84c'
            }
          }
        },{
          name: '砖木结构',
          type: 'scatter',
          data: housDatas['砖木结构'],
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[2];
          },
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            },
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            normal: {
              color: '#ffa022'
            }
          }
        },{
          name: '砖混结构',
          type: 'scatter',
          data: housDatas['砖混结构'],
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[2];
          },
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            },
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            normal: {
              color: '#46bee9'
            }
          }
        },{
          name: '框架结构',
          type: 'scatter',
          data: housDatas['框架结构'],
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[2];
          },
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            },
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            normal: {
              color: '#19DBDE'
            }
          }
        },{
          name: '高层钢混结构',
          type: 'scatter',
          data: housDatas['高层钢混结构'],
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[2];
          },
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            },
            emphasis: {
              show: true
            }
          },
          itemStyle: {
            normal: {
              color: '#ddb926'
            }
          }
        }]
      };
      _self.myChart.setOption(option);
      var map = _self.myChart.getModel().getComponent('bmap').getBMap();
      map.centerAndZoom(_self.options.city, _self.options.city.zoomlevel);
      map.addControl(new BMap.NavigationControl());
      map.addControl(new BMap.ScaleControl());
      map.addControl(new BMap.OverviewMapControl());
      map.enableScrollWheelZoom();
      _self._attchEvents();
    },
    _constructListItem: function() {

    },
    resize: function() {
      $('.page-body-static').css('height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight());
    },
    _constructCountUpInt: function(id, from, to) {
      var _self = this,
        $el = $("#" + id),
        options = {
          useEasing: true,
          useGrouping: true,
          prefix: ''
        };
      $el.parents('.xe-counter').attr('data-to', to);
      $el.html(to);
      var cntr = new countUp($el[0], from, to, 0, 4, options);
      cntr.start();
    },
    _attchEvents: function() {
      var _self = this;
      $('.sub-menu-item.data-type').on('click', function(e){
        if($(this).hasClass('active')) return;
        var datatype = parseInt($(this).attr('data'));
        if (datatype === -1) {
          $('.sub-menu-item.data-type').removeClass('active');
          $(this).addClass('active');
          for (var i = _self.myChart.getOption().series.length - 1; i >= 0; i--) {
            _self.myChart.dispatchAction({
              type: 'legendSelect',
              name: _self.myChart.getOption().series[i].name
            });
          }
        }
        else {
          $('.sub-menu-item.data-type').removeClass('active');
          $(this).addClass('active');
          for (var i = _self.myChart.getOption().series.length - 1; i >= 0; i--) {
            _self.myChart.dispatchAction({
              type: 'legendUnSelect',
              name: _self.myChart.getOption().series[i].name
            });
          }
          _self.myChart.dispatchAction({
              type: 'legendSelect',
              name: _self.myChart.getOption().series[datatype].name
          });
        }
      });
    }
	};

	return Widget;
});