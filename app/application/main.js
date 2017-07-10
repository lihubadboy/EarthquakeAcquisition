define('application/main', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self._constructVilDatas();
      _self._constructOnlineUsers();
      _self._constructDataTotal();
      _self._constructHouseFloorStatic();
      _self._constructHouseTimeStatic();
      _self._constructHouseTypeStatic();
      _self._constructBuildTypeStatic();
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
			_self.common.fixExtention();
		},
    _constructVilDatas: function() {
      var _self = this,
          viewPro = 0.0,
          passed = 0,
          unViewed = 0,
          unpassed = 0;
      _self.ajaxUtil.query(_self.options.OprUrls.building.rovalStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          $.each(respons.data, function(index, val){
            if(val.name == '1')
              passed = parseInt(val.count);
            else if(val.name == '-1')
              unpassed = parseInt(val.count);
          });
          if(passed && (passed + unpassed)) viewPro = (passed * 100 / (passed + unpassed)).toFixed(2);
          _self._constructCountUpScale('viewPro', 0, viewPro, 2);
        }
      });
    },
    _constructOnlineUsers: function() {
      var _self = this;
      _self.ajaxUtil.query(_self.options.OprUrls.online.queryUrl, 'status=1', function(respons) {
        if (respons.result && respons.list) {
          _self._constructCountUpInt('userOnline', 0, respons.list.length);
        }
      });
    },
    _constructDataTotal: function() {
      var _self = this,
          houseNum = 0,
          buildNum = 0;
      _self.ajaxUtil.query(_self.options.OprUrls.building.numStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          buildNum = respons.data[0];
          _self.ajaxUtil.query(_self.options.OprUrls.house.numStaticUrl, null, function(respons1) {
            if (respons1.result && respons1.data) {
              houseNum = respons1.data[0];
            }
            _self._constructCountUpInt('dataTotal', 0, houseNum + buildNum);
          });
        }
      });
    },
    _constructCountUpScale: function(id, from, to, decimals) {
      var _self = this,
        $el = $("#" + id),
        options = {
          useEasing: true,
          useGrouping: true,
          decimal: '.',
          prefix: '',
          suffix: '%'
        };
        $el.parents('.xe-counter').attr('data-to', to);
        $el.html(to + '%');
        var cntr = new countUp($el[0], from, to, decimals, 4, options);
        cntr.start();
    },
    _constructHouseFloorStatic: function() {
      var _self = this,
        dataSource = [];
      _self.ajaxUtil.query(_self.options.OprUrls.house.floorStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          $.each(respons.data, function(index, val) {
            dataSource.push({
              'type': parseInt(val.name),
              'count': parseInt(val.count)
            });
          });
          $("#house-floor-chart").dxChart({
            equalBarWidth: false,
            dataSource: dataSource,
            commonSeriesSettings: {
              argumentField: "type",
              point: { visible: true, size: 5, hoverStyle: {size: 7, border: 0, color: 'inherit'} },
              line: {width: 1, hoverStyle: {width: 1}}
            },
            series: [{
              valueField: "count",
              name: "楼层",
              color: "#68B828"
            }],
            legend: {
              position: 'inside',
              paddingLeftRight: 5
            },
            commonAxisSettings: {
              label: {
                visible: false
              },
              grid: {
                visible: true,
                color: '#f9f9f9'
              }
            },
            valueAxis: {
              label: {
                visible: false
              }
            },
            tooltip: {
              enabled: true,
              customizeText: function() {
                return '<strong>' + this.argumentText + '楼:</strong>' + this.valueText + '条';
              }
            }
          });
        }
      });
    },
    _constructHouseTypeStatic: function() {
      var _self = this,
        dataSource = [];
      _self.ajaxUtil.query(_self.options.OprUrls.house.typeStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          $.each(respons.data, function(index, val) {
            dataSource.push({
              'type': val.name,
              'val': parseInt(val.count)
            });
          });
          $("#house-type-chart div").dxPieChart({
            dataSource: dataSource,
            tooltip: {
              enabled: true,
              customizeText: function() { 
                return '<strong>' + this.argumentText + ':</strong>' + this.valueText + '条';
              }
            },
            size: {
              height: 90
            },
            legend: {
              visible: false
            },  
            series: [{
              type: "doughnut",
              argumentField: "type"
            }],
            palette: ['#5e9b4c', '#6ca959', '#b9f5a6'],
          });
        }
      });
    },
    _constructHouseTimeStatic: function() {
      var _self = this,
        dataSource = [];
      _self.ajaxUtil.query(_self.options.OprUrls.house.timeStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          $.each(respons.data, function(index, val) {
            dataSource.push({
              'time': val.name,
              'count': parseInt(val.count)
            });
          });
          $("#house-time-chart").dxChart({
            dataSource: dataSource,
            series: {
              argumentField: "time",
              valueField: "count",
              name: "数量",
              type: "bar",
              color: '#7c38bc'
            },
            commonAxisSettings: {
              label: {
                visible: false
              },
              grid: {
                visible: false
              }
            },
            legend: {
              visible: false
            },
            argumentAxis: {
                  valueMarginsEnabled: true
              },
            equalBarWidth: {
              width: 24
            },
            tooltip: {
              enabled: true,
              customizeText: function() {
                return '<strong>' + this.argumentText + ':</strong>' + this.valueText + '条';
              }
            }
          });
        }
      });
    },
    _constructBuildTypeStatic: function() {
      var _self = this,
        dataSource = [{
          'type': '钢筋混凝土结构',
          'count': 0
        },{
          'type': '砖混结构',
          'count': 0
        },{
          'type': '混凝土小砌块结构',
          'count': 0
        },{
          'type': '砖木结构',
          'count': 0
        },{
          'type': '土木结构',
          'count': 0
        },{
          'type': '钢结构',
          'count': 0
        },{
          'type': '木结构',
          'count': 0
        },{
          'type': '石结构',
          'count': 0
        },{
          'type': '其他',
          'count': 0
        }];
      _self.ajaxUtil.query(_self.options.OprUrls.building.typeStaticUrl, null, function(respons) {
        if (respons.result && respons.data) {
          $.each(respons.data, function(index, val) {
            $.each(dataSource, function(key, value){
              if(value.type == val.name)
                value.count = parseInt(val.count)
            });
          });
          $("#bar-2").dxChart({
            equalBarWidth: false,
            dataSource: dataSource,
            commonSeriesSettings: {
              argumentField: "type",
              type: "bar"
            },
            series: [{
              valueField: "count",
              name: "建筑物信息采集",
              color: "#68B828"
            }],
            legend: {
              verticalAlignment: "bottom",
              horizontalAlignment: "center"
            },
            tooltip: {
              enabled: true,
              customizeText: function() {
                return '<strong>' + this.argumentText + ':</strong>' + this.valueText + '条';
              }
            }
          });
        }
      });
    },
    _constructMap: function() {
      var _self = this
          housDatas = [],
          buildingDatas = [];
      _self.ajaxUtil.query(_self.options.OprUrls.house.queryUrl, null, function(respons0) {
        if(respons0.result && respons0.list){
          _self.ajaxUtil.search(_self.options.OprUrls.building.queryUrl, {q: "1=1", userid: _self.options.authorInfo.userid}, function(respons1) {
            if(respons1.result && respons1.list){
              $.each(respons1.list, function(k1, v1) {
                buildingDatas.push({
                  name: v1.structType ? v1.structType : '未知',
                  value: [v1.longitude, v1.latitude, parseInt(v1.floorOver + v1.floorUnder)]
                });
              });
              _self._constructPointVisualMap(housDatas, buildingDatas, 'map');
            }
            else {
              $('#map').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
            }
          });
          $.each(respons0.list, function(k0, v0){
            housDatas.push({
              name: v0.type ? v0.type : '未知',
              value: [v0.longitude, v0.latitude, parseInt(v0.floor)]
            });
          });
        }
        else {
          $('#map').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
      });
    },
    _constructPointVisualMap: function(housDatas, buildingDatas, domID) {
      var _self = this;
      var myChart = echarts.init(document.getElementById(domID));  
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
          orient: 'vertical',
          y: 'bottom',
          x: 'right',
          data: ['房屋抗震评估', '建筑物信息采集'],
          textStyle: {
            color: '#fff'
          }
        },
        series: [{
          name: '房屋抗震评估',
          type: 'scatter',
          data: housDatas,
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
        }, {
          name: '建筑物信息采集',
          type: 'scatter',
          data: buildingDatas,
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return val[3] / 10;
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
        }]
      };
      myChart.setOption(option);
      var map = myChart.getModel().getComponent('bmap').getBMap();
      map.centerAndZoom(_self.options.city, _self.options.city.zoomlevel);
      map.addControl(new BMap.NavigationControl());
      map.addControl(new BMap.ScaleControl());
      map.enableScrollWheelZoom();
    },
    _constructCountUpInt: function(id, from, to) {
      var _self = this,
        $el = $("#" + id),
        options = {
          useEasing: true,
          useGrouping: true,
          separator: ',',
          prefix: ''
        };
      $el.parents('.xe-counter').attr('data-to', to);
      $el.html(to);
      var cntr = new countUp($el[0], from, to, 0, 4, options);
      cntr.start();
    },
    _constructTable: function() {
      var _self = this;
      var html = '';
      html += '<table class="table table-bordered table-striped table-hover" id="houseTable">';
      html += '<thead>';
      html += '<tr>';
      html += '<th class="no-sorting"><input type="checkbox" class="cbr"></th>';
      html += '<th class="no-sorting">设备IMEI码</th>';
      html += '<th class="no-sorting">经度</th>';
      html += '<th class="no-sorting">纬度</th>';
      html += '<th class="no-sorting">Tg</th>';
      html += '<th class="no-sorting">PGA</th>';
      html += '<th class="no-sorting">设备名称</th>';
      html += '<th>操作</th>';
      html += '</tr>';
      html += '</thead>';
      html += '<tbody class="middle-align">';
      $.each(_self.buildings, function(key, val) {
        html += '<tr>';
        html += '<td><input type="checkbox" class="cbr"></td>';
        html += '<td>' + val.imei + '</td>';
        html += '<td>' + val.longitude + '</td>';
        html += '<td>' + val.latitude + '</td>';
        html += '<td>' + val.tg + '</td>';
        html += '<td>' + val.pga + '</td>';
        html += '<td>' + val.model + '</td>';
        html += '<td><a href="#" class="btn btn-danger btn-sm btn-icon icon-left">删除</a><a id="' + val.id + '" href="#" class="btn btn-info btn-sm btn-icon icon-left export">导出</a></td>';
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';

      $('#zoningTable').html(html);

      $('.export').on('click', function(e){
        // $('.page-loading-overlay').show();
        $.each(_self.buildings, function(key, val) {
          if(val.id == $(this).attr('id')){
            if(val.administRegion != null){
              $('#field-6').val(val.administRegion.province + val.administRegion.city + val.administRegion.county);
              $('#field-7').val(val.pga);
              $('#field-8').val(val.tg);
            } else {
              $('#field-5').val(val.engine.projectName);
              $('#field-6').val(val.engine.constructOrg);
              $('#field-7').val(val.pga);
              $('#field-8').val(val.tg);
            }
          }
        });
        jQuery('#modal-6').modal('show', {backdrop: 'static'});
      });

      $('.btn-export').on('click', function(){
        var content = {
          title: $('#field-1').val(),
          subtitle: $('#field-2').val(),
          year: $('#field-3').val(),
          serial: $('#field-4').val(),
          projectname: $('#field-5').val(),
          company: $('#field-6').val(),
          acceleration: $('#field-7').val(),
          period: $('#field-8').val(),
          bureau: $('#field-1').val(),
          content: ($('#field-6').val() + $('#field-5').val()),
          day: (new Date()).Format('yyyy年MM月dd日'),
          k1: 2.9,
          k2: 1.9,
          k3: 0.333333,
          tga: 0.05,
          tg: parseFloat($('#field-8').val()),
          pga: parseFloat($('#field-7').val())
        };
        jQuery('#modal-6').modal('hide');
        $('.page-loading-overlay').show();
        _self.ajaxUtil.export(_self.options.OprUrls.word.creatUrl, content, function(respons) {
          if (respons.result) {
            $('.page-loading-overlay').hide();
            window.open(_self.options.thumbnailBaseUrl + respons.data);
          }
        });
      });

      $("#houseTable").dataTable({
        dom: "t" + "<'row'<'col-xs-6'i><'col-xs-6'p>>",
        aoColumns: [{
            bSortable: false
          },
          null,
          null,
          null,
          null,
          null,
          null, {
            bSortable: false
          }
        ],
      });

      // Replace checkboxes when they appear
      var $state = $("#houseTable thead input[type='checkbox']");

      $("#houseTable").on('draw.dt', function() {
        cbr_replace();

        $state.trigger('change');
      });

      // Script to select all checkboxes
      $state.on('change', function(ev) {
        var $chcks = $("#houseTable tbody input[type='checkbox']");

        if ($state.is(':checked')) {
          $chcks.prop('checked', true).trigger('change');
        } else {
          $chcks.prop('checked', false).trigger('change');
        }
      });

      _self._constructBdMap();
    }
	};

	return Widget;
});