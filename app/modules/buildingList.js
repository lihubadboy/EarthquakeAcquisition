define('modules/buildingList', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self._requestDatas();
      _self._dialog();
      _self._delete();
      _self._add();
      _self._modify();
      _self._audit();
      _self._initDatePickUp('#completionTime');
      _self._initDatePickUp('#reinforceTime');
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
          $('.muilty-audit').empty();
          $('.single-audit').empty();
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
    _requestDatas: function() {
      var _self = this;
      _self.ajaxUtil.search(_self.options.OprUrls.building.queryUrl, {
        q: '1=1',
        userid: _self.options.authorInfo.userid
      }, function(respons) {
        if (respons.result && respons.list) {
          _self.datas = respons.list;
          _self.viewModuls = _self.datas;
          _self._constructTable();
        }
        else {
          $('.table-contain').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
      });
    },
    _constructTable: function() {
      var _self = this;
      var html = '';
      _self.buildingDatas = {
        '0': [],
        '1': [],
        '-1': []
      };
      html += '<div id="tableHeader" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-striped table-hover table-clear">';
      html += '<thead>';
      html += '<tr>';
      html += '<th style="width:5%;text-align: center;"><input id="chkAll" type="checkbox"></th>';
      html += '<th style="width:15%;">建筑物名称</th>';
      html += '<th style="width:10%;">用途</th>';
      html += '<th style="width:15%;">结构类型</th>';
      html += '<th style="width:10%;">采集员</th>';
      html += '<th style="width:15%;">采集时间</th>';
      html += '<th style="width:10%;text-align: center;">审核状态</th>';
      html += '<th style="width:20%;">详细地址</th>';
      html += '</tr>';
      html += '</thead>';
      html += '</table>';
      html += '</div>';
      html += '<div id="tableBody" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-hover table-clear">';
      html += '<tbody>';
      $.each(_self.viewModuls, function(key, val) {
        _self.buildingDatas[val.approveStatus.toString()].push({
              index: key,
              name: val.name,
              value: [val.longitude, val.latitude]
        });
        html += '<tr index="' + key + '" class="tr' + val.approveStatus + '">';
        html += '<td style="width:5%;text-align: center;"><input type="checkbox"></td>';
        html += '<td style="width:15%;"><strong>' + val.name + '</strong></td>';
        html += '<td style="width:10%;">' + val.buildUsage + '</td>';
        html += '<td style="width:15%;">' + val.structType + '</td>';
        html += '<td style="width:10%;">' + (val.user == null ? '' : val.user.alias) + '</td>';
        html += '<td style="width:15%;" class="blue">' + (new Date(val.createTime)).Format('yyyy年MM月dd日 hh:mm') + '</td>';
        html += '<td style="width:10%;text-align: center;">' + (val.approveStatus == 0 ? '<span class="label label-dsh">待审核</span>' : (val.approveStatus == -1 ? '<span class="label label-wtg">未通过</span>' : '<span class="label label-ytg">已通过</span>')) + '</td>';
        html += '<td style="width:20%;">' + val.address + '</td>';
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>';

      _self._updateTypeNum();
      _self._constructMap();
      $('.table-contain').html(html);
      $('#tableBody').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true)- $('#tableHeader').outerHeight(true) - 38);
      _self._initTableScrollBar('#tableBody', 'outside');
      $('#chkAll').attr('checked', false);

      //handel events
      $('.table > tbody > tr').on('click', function(e){
        if(e.target.tagName == 'INPUT') return -1;
        if($(this).hasClass('select')) {
          _self._disSelectData($(this).attr('index')) && _self._hideDetialPanel();
          return -1;
        }
        _self._selectData($(this).attr('index'));
        _self._showDetialPanel();
      });

      //connect check for all
      $('#chkAll').on('click', function(event) {
        $.each($('#tableBody input:visible'), function(index, node) {
          node.checked = event.currentTarget.checked;
        });
      });

      $('#tableBody input').on('click', function(e) {
          $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      });
    },
    _constructMap: function() {
      var _self = this;
        if (_self.buildingDatas) {
          _self._constructPointVisualMap(_self.buildingDatas, 'map');
        } else {
          $('#map').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
    },
    _constructPointVisualMap: function(housDatas, domID) {
      var _self = this;
      _self.myChart = echarts.init(document.getElementById(domID));  
      var option = {
        bmap: {
          roam: true,
          enableMapClick: false,
          mapType: _self.options.style
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          data: ['已通过', '未通过', '待审核'],
          show: false
        },
        series: [{
          name: '已通过',
          type: 'scatter',
          data: housDatas['1'],
          coordinateSystem: 'bmap',
          symbol: 'image://images/blue_poi.png',
          symbolSize: function(val) {
            return 24;
          },
          // symbolOffset: [0, '-50%'],
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
              color: '#2878EA'
            }
          }
        }, {
          name: '未通过',
          type: 'scatter',
          data: housDatas['-1'],
          coordinateSystem: 'bmap',
          symbol: 'image://images/red_poi.png',
          symbolSize: function(val) {
            return 24;
          },
          // symbolOffset: [0, '-50%'],
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
              color: '#E82539'
            }
          }
        }, {
          name: '待审核',
          type: 'scatter',
          data: housDatas['0'],
          coordinateSystem: 'bmap',
          symbol: 'image://images/yellow_poi.png',
          symbolSize: function(val) {
            return 24;
          },
          // symbolOffset: [0, '-50%'],
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
              color: '#FF9A3A'
            }
          }
        }, {
          name: '未知',
          data: [],
          type: 'effectScatter',
          coordinateSystem: 'bmap',
          symbolSize: function(val) {
            return 12;
          },
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke'
          },
          hoverAnimation: false,
          label: {
            normal: {
              formatter: '{b}',
              position: 'right',
              show: false
            }
          },
          itemStyle: {
            normal: {
              color: '#333',
              shadowBlur: 10,
              shadowColor: '#333'
            }
          },
          zlevel: 1
        }]
      };
      var size = new BMap.Size(64, 20);
      _self.myChart.setOption(option);
      _self.map = _self.myChart.getModel().getComponent('bmap').getBMap();
      _self.map.centerAndZoom(_self.options.city, _self.options.city.zoomlevel);
      _self.map.addControl(new BMap.NavigationControl());
      _self.map.addControl(new BMap.ScaleControl());
      _self.map.addControl(new BMap.OverviewMapControl());
      _self.map.addControl(new BMap.MapTypeControl({type: BMAP_MAPTYPE_CONTROL_MAP}));
      _self.map.enableScrollWheelZoom();
      _self.map.addControl(new BMap.CityListControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        offset: size,
      }));
      _self._attchEvents();
    },
    _constructDetialMap: function(data) {
      var _self = this;
      if(!_self.detialMap){
        _self.detialMap = new BMap.Map("detialMap");
        _self.detialMap.setMapStyle({
          style: _self.options.city.style
        });
        _self.detialMap.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_LEFT, type: BMAP_NAVIGATION_CONTROL_ZOOM}));
      }
      _self.selectMarker && _self.detialMap.removeOverlay(_self.selectMarker);
      var point = new BMap.Point(data.longitude, data.latitude);
      _self.selectMarker = new BMap.Marker(point);
      _self.detialMap.addOverlay(_self.selectMarker);
      _self.selectMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
      _self.detialMap.centerAndZoom(point, 18);
    },
    _updateTypeNum: function() {
      var _self = this;
      $('#allnum').html(_self.buildingDatas['0'].length + _self.buildingDatas['1'].length + _self.buildingDatas['-1'].length);
      $('#num0').html(_self.buildingDatas['0'].length);
      $('#num1').html(_self.buildingDatas['1'].length);
      $('#num-1').html(_self.buildingDatas['-1'].length);
    },
    _selectData: function(index) {
      var _self = this;
      _self.selectIndex = index;
      _self.selectData = _self.viewModuls[index];
      //select table
      $("#tableBody .select").removeClass('select');
      $("#tableBody [index = '" + index + "']").addClass('select');
      //select chart
      var options = _self.myChart.getOption();
      options.series[3] = {
        name: (_self && _self.selectData ? _self.selectData.name : '未知'),
        data: (_self && _self.selectData ? [{
          index: index,
          name: _self.selectData.name,
          value: [_self.selectData.longitude, _self.selectData.latitude, parseInt(_self.selectData.floorOver)]
        }] : []),
        type: 'effectScatter',
        coordinateSystem: 'bmap',
        symbolSize: function(val) {
          return 25;
        },
        // symbolOffset: [0, '-50%'],
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        hoverAnimation: true,
        label: {
          normal: {
            formatter: '{b}',
            position: 'right',
            show: true
          }
        },
        itemStyle: {
          normal: {
            color: (_self && _self.selectData ? (_self.selectData.approveStatus == 0 ? '#FF9A3A' : (_self.selectData.approveStatus == 1 ? '#2878EA' : '#E82539')) : '#333'),
            shadowBlur: 10,
            shadowColor: (_self && _self.selectData ? (_self.selectData.approveStatus == 0 ? '#FF9A3A' : (_self.selectData.approveStatus == 1 ? '#2878EA' : '#E82539')) : '#333')
          }
        },
        zlevel: 1
      };
      _self.myChart.setOption(options);
      _self.map.panTo(new BMap.Point(_self.selectData.longitude, _self.selectData.latitude));
      // _self.myChart.resize();
    },
    _disSelectData: function() {
      var _self = this;
      _self.selectIndex = -1;
      _self.selectData = null;
      //unselect table
      $("#tableBody .select").removeClass('select');

      //unselect chart
      var options = _self.myChart.getOption();
      options.series[3].data = [];
      _self.myChart.setOption(options);
      return 1;
    },
    _showDetialPanel: function() {
      var _self = this;
      if(_self.selectData){
        $('#buildName1').html(_self.selectData.name == '' ? '未知' : _self.selectData.name);
        $('#buildID1').html(_self.selectData.buildID);
        $('#userName1').html(_self.selectData.user == null ? '' : _self.selectData.user.alias);
        $('#coords1').html('[' + _self.selectData.longitude + ',' + _self.selectData.latitude + ']');
        $('#approveStatus1').html((_self.selectData.approveStatus == 0 ? '<span class="label label-dsh">待审核</span>' : (_self.selectData.approveStatus == -1 ? '<span class="label label-wtg">未通过</span>' : '<span class="label label-ytg">已通过</span>')));
        $('#createTime1').html((new Date(_self.selectData.createTime)).Format('yyyy年MM月dd日'));
        $('#buildOwner1').html(_self.selectData.buildOwner);
        $('#telephone1').html(_self.selectData.telephone);
        $('#buildUsage1').html(_self.selectData.buildUsage);
        $('#structType1').html(_self.selectData.structType + (_self.selectData.structSubType == null || _self.selectData.structSubType == 'null' || _self.selectData.structSubType == '--' ? '' : ('-' + _self.selectData.structSubType)));
        $('#statusQuo1').html(_self.selectData.statusQuo);
        $('#areaOver1').html(_self.selectData.areaOver + '平方米');
        $('#areaUnder1').html(_self.selectData.areaUnder + '平方米');
        $('#floorOver1').html(_self.selectData.floorOver + '层');
        $('#floorUnder1').html(_self.selectData.floorUnder + '层');
        $('#size1').html(_self.selectData.length + 'm * ' + _self.selectData.width + 'm * ' + _self.selectData.height + 'm');
        $('#designComp1').html(_self.selectData.designComp);
        $('#buildTime1').html(_self.selectData.buildTime);
        $('#surface1').html(_self.selectData.surface);
        $('#structSeismic1').html(_self.selectData.structSeismic);
        $('#address1').html(_self.selectData.address);
        $('#completionTime1').html((new Date(_self.selectData.completionTime)).Format('yyyy年'));
        $('#landslide1').html(_self.selectData.landslide);
        $('#investigationComp1').html(_self.selectData.investigationComp);
        $('#siteType1').html(_self.selectData.siteType);
        $('#constructComp1').html(_self.selectData.constructComp);
        $('#completionAcc1').html(_self.selectData.completionAcc);
        $('#reinforce1').html(_self.selectData.reinforce);
        $('#reinforceTime1').html((new Date(_self.selectData.reinforceTime)).Format('yyyy年'));
        $('#floorType1').html(_self.selectData.floorType);
        $('#baseType1').html(_self.selectData.baseType);
        $('#fortifyLevel1').html(_self.selectData.fortifyLevel);
        $('#standardVersion1').html(_self.selectData.standardVersion);
        _self._constructThumbs();
        $('.right-panel').removeClass('hiden');
        setTimeout(function(){
          _self._constructDetialMap(_self.selectData);
          $('.right-panel .tab-pane').css('max-height', $('.right-panel').innerHeight()- $('.right-panel .sub-menu-title').outerHeight(true) * 3 - $('.right-panel .detial-tabs .nav-tabs').outerHeight(true) - $('.detialmap').outerHeight(true) - 18);
          $('.right-panel .tab-pane').css('height', $('.tab-pane').css('max-height'));
          !$('.right-panel .tab-pane').hasClass('mCustomScrollbar') && _self._initTableScrollBar('.right-panel .tab-pane', 'outside');
        }, 400);
      }
    },
    _hideDetialPanel: function() {
      var _self = this;
      !$('.right-panel').hasClass('hiden') && $('.right-panel').addClass('hiden');
    },
    _constructThumbs: function() {
      var _self = this,
          html = '';
      if(_self.selectData) {
        if(_self.selectData.attachments == null || _self.selectData.attachments.length == 0){
          html += '<p class="text-muted text-center">未上传建筑物照片</p>';
        } else {
          html += '<div class="row">';
          $.each(_self.selectData.attachments, function(key, val) {
            html += '<div id="' + val.id + '" class="col-xs-6 col-md-6">';
            html += '<a href="javascript:void(0)" class="thumbnail" role="button">';
            html += '<img src="' + _self.options.thumbnailBaseUrl + val.url + '">';
            html += '</a>';
            html += '<button type="button" class="close thu-close" aria-label="Close" title="删除附件" target="' + (val.id ? val.id : '') + '"><span aria-hidden="true">&times;</span></button>';
            html += '</div>';
          });
          html += '</div>';
        }
        $('#thumb-contain').html(html);
        $('#thumb-contain a').on('click', function(e) {
          var selectUrl = $(this).children('img').attr('src');
          var thtml = '';
          thtml += '<div class="carousel-inner" role="listbox">';
          thtml += '<div class="item active" style="background: url(' + selectUrl + ') no-repeat center center;background-size:contain;"></div>';
          $.each(_self.selectData.attachments, function(key, val) {
            if (selectUrl.indexOf(val.url) < 0)
              thtml += '<div class="item" style="background: url(' + _self.options.thumbnailBaseUrl + val.url + ') no-repeat center center;background-size:contain;"></div>';
          });
          thtml += '</div>';
          thtml += '<a class="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span><span class="sr-only">Previous</span></a>';
          thtml += '<a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span><span class="sr-only">Next</span></a>';
          $('#carousel-example-generic').html(thtml);
          $('#dlgThumb').modal('show');
          $('.carousel .item').css('height', document.body.clientHeight - 120);
          $('.carousel .item').on('dblclick', function(e) {
            $('#dlgThumb').modal('hide');
          });
        });
        $('#thumb-contain .close').on('click', function(e) {
          _self._oprThumbID = $(this).attr('target');
          if (_self._oprThumbID != '') {
            $('#deleteContent').html('</span><i class="fa fa-question-circle"></i> 确认删除该附件？');
            $('#dlgDelete .modal-footer').css('display', 'block');
            $('#dlgDelete').modal({
              backdrop: 'static'
            });
            _self.isDeleteThumb = true;
          }
        });
      }
    },
    _initTableScrollBar: function(id, position) {
      $.mCustomScrollbar.defaults.theme = "dark";
      $(id).mCustomScrollbar({ scrollbarPosition: position == null ? 'inside' : position, autoHideScrollbar: true });
      $(id).mCustomScrollbar('update');
    },
    _updateTableScrollBar: function(id) {
      $(id).mCustomScrollbar('update');
    },
    _destroyTableScrollBar: function(id) {
      $(id).mCustomScrollbar('destroy');
    },
    _initDatePickUp: function(id, container, minView) {
      $(id).datetimepicker({
        language: 'zh-CN',
        weekStart: 1,
        todayBtn: 1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 4,
        minView: 4,
        forceParse: 0,
        showMeridian: 1,
        format: 'yyyy',
        container: container
      });
    },
    resize: function() {
      var _self = this;
      $('.page-body-static').css('height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight());
      $('#tableBody').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true)- $('#tableHeader').outerHeight(true) - 38);
      $('.right-panel .tab-pane').css('max-height', $('.right-panel').innerHeight()- $('.right-panel .sub-menu-title').outerHeight(true) * 3 - $('.right-panel .detial-tabs .nav-tabs').outerHeight(true) - $('.detialmap').outerHeight(true) - 18);
      $('#tableBody').css('height', $('#tableBody').css('max-height'));
      $('.right-panel .tab-pane').css('height', $('.tab-pane').css('max-height'));
      _self.myChart.resize();
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
        $('.content-contain').removeClass('show' + $('.sub-menu-item.data-type.active').attr('data')).addClass('show' + $(this).attr('data'));
        $('.sub-menu-item.data-type').removeClass('active');
        $(this).addClass('active');
        $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
        var sindex = parseInt($(this).attr('sindex'));
        if (sindex === -1) {
          for (var i = _self.myChart.getOption().series.length - 1; i >= 0; i--) {
            _self.myChart.dispatchAction({
              type: 'legendSelect',
              name: _self.myChart.getOption().series[i].name
            });
          }
        }
        else {
          for (var i = _self.myChart.getOption().series.length - 1; i >= 0; i--) {
            _self.myChart.dispatchAction({
              type: 'legendUnSelect',
              name: _self.myChart.getOption().series[i].name
            });
          }
          _self.myChart.dispatchAction({
              type: 'legendSelect',
              name: _self.myChart.getOption().series[sindex].name
          });
        }
      });
      $('.sub-menu-item.view-type').on('click', function(e){
        if($(this).hasClass('active')) return;
        $('#' + $('.sub-menu-item.view-type.active').attr('data')).removeClass('show').addClass('hidden');
        $('#' + $(this).attr('data')).removeClass('hidden').addClass('show');
        setTimeout(function(){
          _self.resize();
        }, 300);
        $('.sub-menu-item.view-type').removeClass('active');
        $(this).addClass('active');
      });
      $('.right-panel .fa-close').on('click', function(){
        _self._disSelectData();
        _self._hideDetialPanel();
      });
      _self.myChart.on('click', function(params){
        if(params && params.componentType == 'series' && params.componentSubType == 'scatter'){
          _self._selectData(params.data.index);
          _self._showDetialPanel();
        } else if(params && params.componentType == 'series' && params.componentSubType == 'effectScatter') {
          _self._disSelectData(params.data.index);
          _self._hideDetialPanel();
        }
      });
    },
    _dialog: function() {
      var _self = this;
      $('#btnAddBuilding').on('click', function(e) {
        $('#dlgExport #gridSystemModalLabel').html('新建记录');
        _self._initialDataDlg();
        $('#btn-add').css('display', 'inline-block');
        $('#btn-modify').css('display', 'none');
        $('#dlgExport').modal({
          backdrop: 'static'
        });
      });
      $('#btnModifyCurrent').on('click', function(e) {
        $('#dlgExport #gridSystemModalLabel').html('编辑记录-' + _self.selectData.name);
        _self._initialDataDlg(_self.selectData);
        $('#btn-add').css('display', 'none');
        $('#btn-modify').css('display', 'inline-block');
        $('#dlgExport').modal({
          backdrop: 'static'
        });
      });
      $('#btnUploadImgs').on('click', function(e){
        _self.successCallback = function(data){
          window.buildingList.selectData.attachments.push(data);
        };
        _self.completeCallBack = function(){
          window.buildingList._constructThumbs(window.buildingList.selectData);
        };
        _self._appendAttachments();
      });
      $('#btn-export').on('click', function(e) {
        $('#dlgDelete .modal-title').html('导出');
        if ($('#tableBody input:visible:checked').length == 0) {
          $('#deleteContent').html('<i class="fa fa-warning"></i> 请先选择要导出的数据！');
          $('#dlgDelete .modal-footer').css('display', 'none');
          $('#dlgDelete').modal('show');
          return;
        }
        _self._constructExportTable();
        tableExport('export-table', '建筑物列表-' + (new Date()).Format('yyyyMMddhhmmss'), 'csv');
      });
      $('#dlgExport #structType').change(function() {
        if ($('#structType').val() == '钢筋混凝土结构') {
          $('#structSubType').html('<option>框架</option><option>框剪</option><option>剪力墙</option><option>框筒</option><option>筒中筒</option><option>其他</option>');
          $('#structSubType').val('框架');
          $('.subtype').css('display', 'block');
        } else if ($('#structType').val() == '砖混结构') {
          $('#structSubType').html('<option>无框</option><option>底框</option><option>内框</option><option>其他</option>');
          $('#structSubType').val('无框');
          $('.subtype').css('display', 'block');
        } else
          $('.subtype').css('display', 'none');
      });
      $('.dlg-switch > .btn').on('click', function(e){
        if($(this).hasClass('btn-info')) return -1;
        $('.dlg-switch > .btn').removeClass('btn-info').addClass('btn-white');
        $(this).removeClass('btn-white').addClass('btn-info');
        $(this).attr('id') == 'baseinfo' ? $('#tab2').removeClass('active') && $('#tab1').addClass('active') : $('#tab1').removeClass('active') && $('#tab2').addClass('active');
      });
    },
    _constructExportTable: function(){
      var _self = this;
      var selectNodes = $('#tableBody').find('input:checked');
      var html = '<table id="export-table">';
      html += '<thead>';
      html += '<tr>';
      html += '<th>序号</th>';
      html += '<th>采集人</th>';
      html += '<th>采集时间</th>';
      html += '<th>建筑物编号</th>';
      html += '<th>建筑物名称</th>';
      html += '<th>产权人</th>';
      html += '<th>联系电话</th>';
      html += '<th>建筑物用途</th>';
      html += '<th>设防烈度</th>';
      html += '<th>经度</th>';
      html += '<th>纬度</th>';
      html += '<th>设计单位</th>';
      html += '<th>建造年代</th>';
      html += '<th>房屋现状</th>';
      html += '<th>平立面规则</th>';
      html += '<th>结构抗震措施</th>';
      html += '<th>地上面积（㎡）</th>';
      html += '<th>地下面积（㎡）</th>';
      html += '<th>地上层数</th>';
      html += '<th>地下层数</th>';
      html += '<th>长（m）</th>';
      html += '<th>宽（m）</th>';
      html += '<th>高（m）</th>';
      html += '<th>结构类型</th>';
      html += '<th>竣工时间</th>';
      html += '<th>改造时间</th>';
      html += '<th>滑坡危险</th>';
      html += '<th>勘查单位</th>';
      html += '<th>场地类型</th>';
      html += '<th>施工单位</th>';
      html += '<th>竣工验收备案</th>';
      html += '<th>是否加固</th>';
      html += '<th>楼板类型</th>';
      html += '<th>基础形式</th>';
      html += '<th>抗震规范版本</th>';
      html += '<th>详细地址</th>';
      html += '<th>附件</th>';
      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';
      var i = 1;
      $.each(selectNodes, function(key, val) {
        var data = _self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))];
        html += '<tr>';
        html += '<td>' + (i++) + '</td>';
        html += '<td>' + (data.user == null ? '' : data.user.alias) + '</td>';
        html += '<td>' + (new Date(data.createTime)).Format('yyyy年MM月dd日') + '</td>';
        html += '<td>' + data.buildID + '</td>';
        html += '<td>' + data.name + '</td>';
        html += '<td>' + data.buildOwner + '</td>';
        html += '<td>' + data.telephone + '</td>';
        html += '<td>' + data.buildUsage + '</td>';
        html += '<td>' + data.fortifyLevel + '</td>';
        html += '<td>' + data.longitude + '</td>';
        html += '<td>' + data.latitude + '</td>';
        html += '<td>' + data.designComp + '</td>';
        html += '<td>' + data.buildTime + '</td>';
        html += '<td>' + data.statusQuo + '</td>';
        html += '<td>' + data.surface + '</td>';
        html += '<td>' + data.structSeismic + '</td>';
        html += '<td>' + data.areaOver + '</td>';
        html += '<td>' + data.areaUnder + '</td>';
        html += '<td>' + data.floorOver + '</td>';
        html += '<td>' + data.floorUnder + '</td>';
        html += '<td>' + data.length + '</td>';
        html += '<td>' + data.width + '</td>';
        html += '<td>' + data.height + '</td>';
        html += '<td>' + data.structType + (data.structSubType ? ('-' + data.structSubType) : '') + '</td>';
        html += '<td>' + (new Date(data.completionTime)).Format('yyyy年MM月dd日') + '</td>';
        html += '<td>' + (new Date(data.reinforceTime)).Format('yyyy年MM月dd日') + '</td>';
        html += '<td>' + data.landslide + '</td>';
        html += '<td>' + data.investigationComp + '</td>';
        html += '<td>' + data.siteType + '</td>';
        html += '<td>' + data.constructComp + '</td>';
        html += '<td>' + data.completionAcc + '</td>';
        html += '<td>' + data.reinforce + '</td>';
        html += '<td>' + data.floorType + '</td>';
        html += '<td>' + data.baseType + '</td>';
        html += '<td>' + data.standardVersion + '</td>';
        html += '<td>' + data.address + '</td>';
        //attachments
        html += '<td>';
        if(data.attachments && data.attachments.length > 0){
          $.each(data.attachments, function(i, attachment){
            html += _self.options.thumbnailBaseUrl + attachment.url + ' ';
          });
        }else html += '';
        html += '</td>';
      });
      html += '</tbody>';
      html += '</table>';

      $('#exportContainer').html(html);
    },
    _add: function() {
      var _self = this;
      $('#btn-add').on('click', function(e){
        $('.has-error').removeClass('has-error');
        $('#buildID').val().trim() == '' && $('#buildID').parent('.form-group').addClass('has-error') && $('#buildID').focus();
        $('#name').val().trim() == '' && $('#name').parent('.form-group').addClass('has-error') && $('#name').focus();
        $('#longitude').val().trim() == '' && !/^[0-9]+(.[0-9]{1,6})?$/.test($('#longitude').val()) && $('#longitude').parent('.form-group').addClass('has-error') && $('#longitude').focus();
        $('#latitude').val().trim() == '' && !/^[0-9]+(.[0-9]{1,6})?$/.test($('#latitude').val()) && $('#latitude').parent('.form-group').addClass('has-error') && $('#latitude').focus();
        $('#address').val().trim() == '' && $('#address').parent('.form-group').addClass('has-error') && $('#address').focus();
        if($('.has-error').length > 0)return;
        var newdata = {
          "id": _self.common.guid(),
          "address": $('#address').val().trim(),
          "user": {
            "id": _self.options.authorInfo.userid
          },
          "telephone": $('#telephone').val().trim(),
          "baseType": $('#baseType').val().trim(),
          "buildID": $('#buildID').val().trim(),
          "buildOwner": $('#buildOwner').val().trim(),
          "buildTime": $('#buildTime').val().trim(),
          "buildUsage": $('#buildUsage').val().trim(),
          "completionAcc": $('#completionAcc').val().trim(),
          "surface": $('#surface').val().trim(),
          "constructComp": $('#constructComp').val().trim(),
          "structType": $('#structType').val().trim(),
          "structSubType": $('.subtype').css('display') == 'block' ? $('#structSubType').val() : '--',
          "designComp": $('#designComp').val().trim(),
          "floorType": $('#floorType').val().trim(),
          "structSeismic": $('#structSeismic').val().trim(),
          "fortifyLevel": $('#fortifyLevel').val().trim(),
          "statusQuo": $('#statusQuo').val().trim(),
          "investigationComp": $('#investigationComp').val().trim(),
          "landslide": $('#landslide').val().trim(),
          "standardVersion": $('#standardVersion').val().trim(),
          "siteType": $('#siteType').val().trim(),
          "reinforce": $('#reinforce').val().trim(),
          "name": $('#name').val().trim(),
          "floorOver": parseInt($('#floorOver').val().trim()),
          "reinforceTime": (new Date($('#reinforceTime').val())).getTime(),
          "length": parseFloat($('#length').val().trim()),
          "latitude": parseFloat($('#latitude').val().trim()),
          "height": parseFloat($('#height').val().trim()),
          "width": parseFloat($('#width').val().trim()),
          "longitude": parseFloat($('#longitude').val().trim()),
          "createTime": (new Date()).getTime(),
          "completionTime": (new Date($('#completionTime').val())).getTime(),
          "areaUnder": parseFloat($('#areaUnder').val().trim()),
          "areaOver": parseFloat($('#areaOver').val().trim()),
          "floorUnder": parseInt($('#floorUnder').val().trim()),
          "approveStatus": 0
        };
        var query = {
          list: [newdata]
        };

        _self.ajaxUtil._ajaxPost(_self.options.OprUrls.building.addUrl, query, function(response){
          if(response.result){
            _self._raiseMessage('添加数据成功！');
            _self._getDataByID(newdata.id, function(data){
              _self.viewModuls.push(data);
              _self._insertRow(data, _self.viewModuls.length - 1);
              _self._updateTypeNum();
              _self.resize();
            });
            _self._disSelectData();
            _self._hideDetialPanel();
          }else
            _self._raiseMessage('添加数据失败！请检查网络连接.');
          $('#dlgExport').modal('hide');
        });
      });
    },
    _delete: function() {
      var _self = this;
      $('#btnDeleteSelected').on('click', function(e) {
        $('#dlgDelete .modal-title').html('删除');
        if ($('#tableBody input:visible:checked').length == 0) {
          $('#deleteContent').html('<i class="fa fa-warning"></i> 请先选择要删除的数据！');
          $('#dlgDelete .modal-footer').css('display', 'none');
          $('#dlgDelete').modal('show');
        } else {
          $('#deleteContent').html('<i class="fa fa-question-circle"></i> 确认删除选中的数据？');
          $('#dlgDelete .modal-footer').css('display', 'block');
          $('#dlgDelete').modal({
            backdrop: 'static'
          });
        }
        _self.isDeleteSingle = false;
      });

      $('#btnDeleteCurrent').on('click', function(e) {
        $('#deleteContent').html('<i class="fa fa-question-circle"></i> 确认删除该记录？');
        $('#dlgDelete .modal-footer').css('display', 'block');
        $('#dlgDelete').modal({
          backdrop: 'static'
        });
        _self.isDeleteSingle = true;
      });

      $('#btnDelete').on('click', function(e) {
        $('#dlgDelete .modal-title').html('删除');
        $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在删除...');
        if(_self.isDeleteThumb){
          _self.isDeleteThumb = false;
          _self.ajaxUtil._ajaxGet(_self.options.OprUrls.attachment.deleteUrl + _self._oprThumbID, function(response){
            if(!response || !response.result) {
              $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除附件失败！');
              return;
            }
            $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除附件成功！');
            setTimeout(function(e){
              $('#dlgDelete').modal('hide');
              $('#' + _self._oprThumbID).remove();
              _self.selectData.attachments = $.grep(_self.selectData.attachments, function(thumb, index){return thumb.id != _self._oprThumbID;});
              _self.viewModuls[_self.selectIndex].attachments = _self.selectData.attachments;
            }, 300);
          });
        }else if (!_self.isDeleteSingle) {
          var selectNodes = $('#tableBody').find('input:visible:checked');
          var deleteDatas = [];
          var indexs = [];
          $.each(selectNodes, function(index, val) {
            deleteDatas.push(_self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))].id);
            indexs.push(parseInt($(this).parent().parent('tr').attr('index')));
          });
          _self.ajaxUtil.delete(_self.options.OprUrls.building.deleteUrl, deleteDatas, function(respons) {
            if (respons.result) {
              $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除数据成功！');
              _self._removeRows(indexs);
              _self._updateTypeNum();
              _self._disSelectData();
              _self._hideDetialPanel();
              _self.resize();
            } else{
              $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除数据失败！');
            }
            setTimeout(function(e){
              $('#dlgDelete').modal('hide');
            }, 300);
          });
        } else {
          var deleteDatas = [_self.selectData.id];
          _self.ajaxUtil.delete(_self.options.OprUrls.building.deleteUrl, deleteDatas, function(respons) {
            if (respons.result) {
              $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除数据成功！');
              _self._removeRows([_self.selectIndex]);
              _self._updateTypeNum();
              _self._disSelectData();
              _self._hideDetialPanel();
              _self.resize();
            } else{
              $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除数据失败！');
            }
            setTimeout(function(e){
              $('#dlgDelete').modal('hide');
            }, 300);
          });
        }
      });
    },
    _modify: function() {
      var _self = this;
      $('#btn-modify').on('click', function(e) {
        $('.has-error').removeClass('has-error');
        $('#buildID').val().trim() == '' && $('#buildID').parent('.form-group').addClass('has-error') && $('#buildID').focus();
        $('#name').val().trim() == '' && $('#name').parent('.form-group').addClass('has-error') && $('#name').focus();
        $('#longitude').val().trim() == '' && !/^[0-9]+(.[0-9]{1,6})?$/.test($('#longitude').val()) && $('#longitude').parent('.form-group').addClass('has-error') && $('#longitude').focus();
        $('#latitude').val().trim() == '' && !/^[0-9]+(.[0-9]{1,6})?$/.test($('#latitude').val()) && $('#latitude').parent('.form-group').addClass('has-error') && $('#latitude').focus();
        $('#address').val().trim() == '' && $('#address').parent('.form-group').addClass('has-error') && $('#address').focus();
        if ($('.has-error').length > 0) return;
        _self.selectData.address = $('#address').val().trim();
        _self.selectData.telephone = $('#telephone').val().trim();
        _self.selectData.baseType = $('#baseType').val().trim();
        _self.selectData.buildID = $('#buildID').val().trim();
        _self.selectData.buildOwner = $('#buildOwner').val().trim();
        _self.selectData.buildTime = $('#buildTime').val().trim();
        _self.selectData.buildUsage = $('#buildUsage').val().trim();
        _self.selectData.completionAcc = $('#completionAcc').val().trim();
        _self.selectData.constructComp = $('#constructComp').val() ? $('#constructComp').val().trim() : '--';
        _self.selectData.structType = $('#structType').val().trim();
        _self.selectData.structSubType = $('.subtype').css('display') == 'block' ? $('#structSubType').val() : '--';
        _self.selectData.designComp = $('#designComp').val().trim();
        _self.selectData.floorType = $('#floorType').val().trim();
        _self.selectData.structSeismic = $('#structSeismic').val().trim();
        _self.selectData.fortifyLevel = $('#fortifyLevel').val().trim();
        _self.selectData.statusQuo = $('#statusQuo').val().trim();
        _self.selectData.investigationComp = $('#investigationComp').val() ? $('#investigationComp').val().trim() : '--';
        _self.selectData.landslide = $('#landslide').val() ? $('#landslide').val().trim() : '--';
        _self.selectData.standardVersion = $('#standardVersion').val().trim();
        _self.selectData.siteType = $('#siteType').val() ? $('#siteType').val().trim() : '--';
        _self.selectData.reinforce = $('#reinforce').val().trim();
        _self.selectData.name = $('#name').val().trim();
        _self.selectData.floorOver = $('#floorOver').val().trim();
        _self.selectData.reinforceTime = (new Date($('#reinforceTime').val())).getTime();
        _self.selectData.length = parseFloat($('#length').val().trim());
        _self.selectData.latitude = parseFloat($('#latitude').val().trim());
        _self.selectData.height = parseFloat($('#height').val().trim());
        _self.selectData.width = parseFloat($('#width').val().trim());
        _self.selectData.longitude = parseFloat($('#longitude').val().trim());
        _self.selectData.createTime = (new Date()).getTime();
        _self.selectData.completionTime = (new Date($('#completionTime').val())).getTime();
        _self.selectData.areaUnder = parseFloat($('#areaUnder').val().trim());
        _self.selectData.areaOver = parseFloat($('#areaOver').val().trim());
        _self.selectData.floorUnder = parseFloat($('#floorUnder').val().trim());
        _self.selectData.attachments = [];
        var query = {
          q: '',
          list: [_self.selectData]
        };
        _self.ajaxUtil._ajaxPost(_self.options.OprUrls.building.updateUrl, query, function(response) {
          if (response.result) {
            _self._raiseMessage('更新数据成功！');
            _self.datas[_self.selectIndex] = _self.selectData;
            _self.viewModuls[_self.selectIndex] = _self.selectData;
            _self._updateRow();
            _self._disSelectData();
            _self._hideDetialPanel();
            _self.resize();
          } else
            _self._raiseMessage('更新数据失败！请检查网络连接.');
          $('#dlgExport').modal('hide');
        });
      });
    },
    _audit: function() {
      var _self = this;
      $('.muilty-audit a').on('click', function(e){
        $('#dlgDelete .modal-title').html('审核记录');
        if ($('#tableBody input:visible:checked').length == 0) {
          $('#deleteContent').html('<i class="fa fa-warning"></i> 请先选择要审核的数据！');
          $('#dlgDelete .modal-footer').css('display', 'none');
          $('#dlgDelete').modal('show');
        } else {
          $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在提交审核数据...');
          $('#dlgDelete .modal-footer').css('display', 'none');
          $('#dlgDelete').modal({
            backdrop: 'static'
          });
          var selectNodes = $('#tableBody').find('input:visible:checked');
          var deleteDatas = [];
          var indexs = [];
          var approveStatus = parseInt($(this).attr('data'));
          $.each(selectNodes, function(index, val) {
            var selectData = _self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))];
            if (selectData.approveStatus != approveStatus) {
              deleteDatas.push({
                "id": selectData.id,
                "address": selectData.address,
                "user": {
                  "id": selectData.user ? selectData.user.id : _self.options.authorInfo.userid
                },
                "telephone": selectData.telephone,
                "baseType": selectData.baseType,
                "buildID": selectData.buildID,
                "buildOwner": selectData.buildOwner,
                "buildTime": selectData.buildTime,
                "buildUsage": selectData.buildUsage,
                "completionAcc": selectData.completionAcc,
                "surface": selectData.surface,
                "constructComp": selectData.constructComp,
                "structType": selectData.structType,
                "structSubType": selectData.structSubType,
                "designComp": selectData.designComp,
                "floorType": selectData.floorType,
                "structSeismic": selectData.structSeismic,
                "fortifyLevel": selectData.fortifyLevel,
                "statusQuo": selectData.statusQuo,
                "investigationComp": selectData.investigationComp,
                "landslide": selectData.landslide,
                "standardVersion": selectData.standardVersion,
                "siteType": selectData.siteType,
                "reinforce": selectData.reinforce,
                "name": selectData.name,
                "floorOver": selectData.floorOver,
                "reinforceTime": selectData.reinforceTime,
                "length": selectData.length,
                "latitude": selectData.latitude,
                "height": selectData.height,
                "width": selectData.width,
                "longitude": selectData.longitude,
                "createTime": selectData.createTime,
                "completionTime": selectData.completionTime,
                "areaUnder": selectData.areaUnder,
                "areaOver": selectData.areaOver,
                "floorUnder": selectData.floorUnder,
                "approveStatus": approveStatus
              });
              indexs.push(parseInt($(this).parent().parent('tr').attr('index')));
            }
          });
          
          $.each(deleteDatas, function(key, val) {
            var query = {
              q: '',
              list: [val]
            };
            _self.ajaxUtil._ajaxPost(_self.options.OprUrls.building.updateUrl, query, function(response) {
              if (response.result) {
                _self._updateRow(indexs[key], approveStatus);
                if (key == deleteDatas.length - 1) {
                  _self._raiseMessage('提交审核数据成功！');
                  _self._updateTypeNum();
                  _self._disSelectData();
                  _self._hideDetialPanel();
                  _self.resize();
                  $('#dlgDelete').modal('hide');
                }
              } else {
                _self._raiseMessage('提交审核数据失败！请检查网络连接.');
                $('#dlgDelete').modal('hide');
              }
            });
          });
        }
      });
      $('.single-audit a').on('click', function(e){
        var approveStatus = parseInt($(this).attr('data'));
        $('#dlgDelete .modal-title').html('审核记录');
        if (_self.selectData.approveStatus == approveStatus) {
          return;
        } else {
          $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在提交审核数据...');
          $('#dlgDelete .modal-footer').css('display', 'none');
          $('#dlgDelete').modal({
            backdrop: 'static'
          });
          var deleteDatas = [{
            "id": _self.selectData.id,
            "address": _self.selectData.address,
            "user": {
              "id": _self.selectData.user ? _self.selectData.user.id : _self.options.authorInfo.userid
            },
            "telephone": _self.selectData.telephone,
            "baseType": _self.selectData.baseType,
            "buildID": _self.selectData.buildID,
            "buildOwner": _self.selectData.buildOwner,
            "buildTime": _self.selectData.buildTime,
            "buildUsage": _self.selectData.buildUsage,
            "completionAcc": _self.selectData.completionAcc,
            "surface": _self.selectData.surface,
            "constructComp": _self.selectData.constructComp,
            "structType": _self.selectData.structType,
            "structSubType": _self.selectData.structSubType,
            "designComp": _self.selectData.designComp,
            "floorType": _self.selectData.floorType,
            "structSeismic": _self.selectData.structSeismic,
            "fortifyLevel": _self.selectData.fortifyLevel,
            "statusQuo": _self.selectData.statusQuo,
            "investigationComp": _self.selectData.investigationComp,
            "landslide": _self.selectData.landslide,
            "standardVersion": _self.selectData.standardVersion,
            "siteType": _self.selectData.siteType,
            "reinforce": _self.selectData.reinforce,
            "name": _self.selectData.name,
            "floorOver": _self.selectData.floorOver,
            "reinforceTime": _self.selectData.reinforceTime,
            "length": _self.selectData.length,
            "latitude": _self.selectData.latitude,
            "height": _self.selectData.height,
            "width": _self.selectData.width,
            "longitude": _self.selectData.longitude,
            "createTime": _self.selectData.createTime,
            "completionTime": _self.selectData.completionTime,
            "areaUnder": _self.selectData.areaUnder,
            "areaOver": _self.selectData.areaOver,
            "floorUnder": _self.selectData.floorUnder,
            "approveStatus": approveStatus
          }];
          var query = {
            q: '',
            list: deleteDatas
          };
          _self.ajaxUtil._ajaxPost(_self.options.OprUrls.building.updateUrl, query, function(response) {
            if (response.result) {
              _self._updateRow(_self.selectIndex, approveStatus);
              _self._raiseMessage('提交审核数据成功！');
              _self._updateTypeNum();
              _self._disSelectData();
              _self._hideDetialPanel();
              _self.resize();
              $('#dlgDelete').modal('hide');
            } else {
              _self._raiseMessage('提交审核数据失败！请检查网络连接.');
              $('#dlgDelete').modal('hide');
            }
          });
        }
      });
    },
    _getDataByID: function(id, callback) {
      var _self = this;
      _self.ajaxUtil.search(_self.options.OprUrls.building.queryUrl, {
        q: "id='" + id + "'",
        userid: _self.options.authorInfo.userid
      }, function(respons) {
        if (respons.result && respons.list) {
          callback && callback(respons.list[0]);
        }
        else {
          callback && callback(null);
        }
      });
    },
    _insertRow: function(val, index) {
      var _self = this,
          options = _self.myChart.getOption(),
          html = '';
      if(!val) return;
      _self.buildingDatas[val.approveStatus.toString()].push({
        index: index,
        name: val.name,
        value: [val.longitude, val.latitude]
      });
      html += '<tr index="' + index + '" class="tr' + val.approveStatus + '">';
      html += '<td style="width:5%;text-align: center;"><input type="checkbox"></td>';
      html += '<td style="width:15%;"><strong>' + val.name + '</strong></td>';
      html += '<td style="width:10%;">' + val.buildUsage + '</td>';
      html += '<td style="width:15%;">' + val.structType + '</td>';
      html += '<td style="width:10%;">' + (val.user == null ? '' : val.user.alias) + '</td>';
      html += '<td style="width:15%;" class="blue">' + (new Date(val.createTime)).Format('yyyy年MM月dd日 hh:mm') + '</td>';
      html += '<td style="width:10%;text-align: center;">' + (val.approveStatus == 0 ? '<span class="label label-dsh">待审核</span>' : (val.approveStatus == -1 ? '<span class="label label-wtg">未通过</span>' : '<span class="label label-ytg">已通过</span>')) + '</td>';
      html += '<td style="width:20%;">' + val.address + '</td>';
      html += '</tr>';
      $('#tableBody tbody').prepend(html);
      options.series[2].data = _self.buildingDatas[val.approveStatus.toString()];
      _self.myChart.setOption(options);

      //handel events
      $("#tableBody [index = '" + index + "']").on('click', function(e){
        if(e.target.tagName == 'INPUT') return -1;
        if($(this).hasClass('select')) {
          _self._disSelectData($(this).attr('index')) && _self._hideDetialPanel();
          return -1;
        }
        _self._selectData($(this).attr('index'));
        _self._showDetialPanel();
      });
      $("#tableBody [index = '" + index + "'] input").on('click', function(e) {
          $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      });
    },
    _removeRows: function(indexs) {
      var _self = this,
          options = _self.myChart.getOption();
      _self.buildingDatas = {
        '0': [],
        '1': [],
        '-1': []
      };
      $.each(indexs, function(key, val){$("#tableBody [index = '" + val + "']").remove();});
      
      $.each(_self.viewModuls, function(key, val) {
        typeof(indexs.find(function(ind){return ind == key;})) == "undefined" && _self.buildingDatas[val.approveStatus.toString()].push({
              index: key,
              name: val.name,
              value: [val.longitude, val.latitude]
        });
      });
      options.series[0].data = _self.buildingDatas['1'];
      options.series[1].data = _self.buildingDatas['-1'];
      options.series[2].data = _self.buildingDatas['0'];
      _self.myChart.setOption(options);
    },
    _updateRow: function(index, approveStatus) {
      var _self = this,
          options = _self.myChart.getOption();
      typeof(index) == 'undefined' && (index = _self.selectIndex);
      var data = _self.viewModuls[index];
      typeof(approveStatus) == 'undefined' && (approveStatus = data.approveStatus);
      $($("#tableBody [index = '" + index + "'] td")[1]).html('<strong>' + data.name + '</strong>');
      $($("#tableBody [index = '" + index + "'] td")[2]).html(data.buildUsage);
      $($("#tableBody [index = '" + index + "'] td")[3]).html(data.structType);
      $($("#tableBody [index = '" + index + "'] td")[5]).html((new Date(data.createTime)).Format('yyyy年MM月dd日 hh:mm'));
      $($("#tableBody [index = '" + index + "'] td")[6]).html((approveStatus == 0 ? '<span class="label label-dsh">待审核</span>' : (approveStatus == -1 ? '<span class="label label-wtg">未通过</span>' : '<span class="label label-ytg">已通过</span>')));
      $($("#tableBody [index = '" + index + "'] td")[7]).html(data.address);
      if (approveStatus != data.approveStatus) {
        $($("#tableBody [index = '" + index + "']")).removeClass('tr' + data.approveStatus).addClass('tr' + approveStatus);
        _self.buildingDatas[data.approveStatus.toString()] = $.grep(_self.buildingDatas[data.approveStatus.toString()], function(val, ind){
          if(val.index == index) _self.buildingDatas[approveStatus].push(val);
          return val.index != index;
        });
        (data.approveStatus == 0 && (options.series[2].data = _self.buildingDatas[data.approveStatus.toString()])) ||
        (data.approveStatus == 1 && (options.series[0].data = _self.buildingDatas[data.approveStatus.toString()])) ||
        (data.approveStatus == -1 && (options.series[1].data = _self.buildingDatas[data.approveStatus.toString()]));
        _self.viewModuls[index].approveStatus = approveStatus;
        data.approveStatus = approveStatus;
      } else {
        $.each(_self.buildingDatas[data.approveStatus.toString()], function(key, val) {
          if (val.index == index) {
            _self.buildingDatas[data.approveStatus.toString()][key].name = data.name;
            _self.buildingDatas[data.approveStatus.toString()][key].value = [data.longitude, data.latitude];
          } else return;
        });
      }
      ((data.approveStatus == 0 && (options.series[2].data = _self.buildingDatas[data.approveStatus.toString()])) ||
        (data.approveStatus == 1 && (options.series[0].data = _self.buildingDatas[data.approveStatus.toString()])) ||
        (data.approveStatus == -1 && (options.series[1].data = _self.buildingDatas[data.approveStatus.toString()]))) &&
      _self.myChart.setOption(options);
    },
    _appendAttachments: function() {
      var _self = this;
      var formHtml = '';
      formHtml += '<form class="form-horizontal no-margin-bottom">';
      formHtml += '<div class="control-group no-margin-bottom">';
      formHtml += '<div class="controls formTableContainer">';

      formHtml += '<div id="attachmentsHeader">';
      formHtml += '<table class="table table-bordered">';
      formHtml += '<thead>';
      formHtml += '<tr>';
      formHtml += '<th style="width:30%;" class="text-center">文件名</th>';
      formHtml += '<th style="width:10%;" class="text-center">类型</th>';
      formHtml += '<th style="width:20%;" class="text-center">大小(KB)</th>';
      formHtml += '<th style="width:30%;" class="text-center">状态</th>';
      formHtml += '<th style="width:10%;" class="text-center">操作</th>';
      formHtml += '</tr>';
      formHtml += '</thead>';
      formHtml += '</table>';
      formHtml += '</div>';

      formHtml += '<div id="attachmentsContent">';
      formHtml += '<table id="attachmentsTable" class="table table-striped table-bordered table-hover">';
      formHtml += '<tbody id="attachmentsBody">';
      formHtml += '</tbody>';
      formHtml += '</table>';
      formHtml += '</div>';

      formHtml += '<div class="row-fluid warn-text">';
      formHtml += '<p class="muted"><span class="label label-warning">注意！</span>    每次限选<strong>10个</strong>文件,并且文件大小需小于<strong>100M</strong></p>';
      formHtml += '</div>';

      formHtml += '<div class="row-fluid" style="margin-top: 20px;">';
      formHtml += '<div class="left">';
      formHtml += '<span id="spanButtonPlaceHolder"></span>';
      formHtml += '</div>';
      formHtml += '</div>';

      formHtml += '</div>';
      formHtml += '</div>';

      formHtml += '</form>';
      if (_self.selectData != null) {
        $('#dlgUpload .modal-body > .container-fluid').html(formHtml);
        $('#dlgUpload').modal({
          backdrop: 'static'
        });
        _self._initSwfObject("spanButtonPlaceHolder", _self.options.OprUrls.building.uploadUrl, {
          "id": _self.selectData.id
        });
        _self._initTableScrollBar('#attachmentsContent');

        //events
        $('#btnUpload').on('click', function(e) {
          _self.swfu.startUpload();
        });
      }
    },
    _initialDataDlg: function(data) {
      var _self = this;
      $('#buildID').val(data ? data.buildID : '');
      $('#name').val(data ? data.name : '');
      $('#buildOwner').val(data ? data.buildOwner : '');
      $('#telephone').val(data ? data.telephone : '');
      $('#buildUsage').val(data ? data.buildUsage : '学校');
      $('#fortifyLevel').val(data ? data.fortifyLevel : '不设防');
      $('#longitude').val(data ? data.longitude : '');
      $('#latitude').val(data ? data.latitude : '');
      $('#designComp').val(data ? data.designComp : '有');
      $('#buildTime').val(data ? data.buildTime : '60年代前');
      $('#statusQuo').val(data ? data.statusQuo : '完好');
      $('#surface').val(data ? data.surface : '是');
      $('#structSeismic').val(data ? data.structSeismic : '有');
      $('#areaOver').val(data ? data.areaOver : '');
      $('#areaUnder').val(data ? data.areaUnder : '');
      $('#floorOver').val(data ? data.floorOver : '');
      $('#floorUnder').val(data ? data.floorUnder : '');
      $('#length').val(data ? data.length : '');
      $('#width').val(data ? data.width : '');
      $('#height').val(data ? data.height : '');
      $('#structType').val(data ? data.structType : '钢筋混凝土结构');
      $('#structType').trigger('change');
      $('#structSubType').val(data ? data.structSubType : '框架');
      $('#address').val(data ? data.address : '');
      $('#completionTime').val(data ? (new Date(data.completionTime)).getFullYear() : (new Date()).getFullYear());
      $('#reinforceTime').val(data ? (new Date(data.reinforceTime)).getFullYear() : (new Date()).getFullYear());
      $('#landslide').val(data ? data.landslide : '有');
      $('#investigationComp').val(data ? data.investigationComp : '有');
      $('#siteType').val(data ? data.siteType : 'I0');
      $('#constructComp').val(data ? data.constructComp : '有');
      $('#completionAcc').val(data ? data.completionAcc : '是');
      $('#reinforce').val(data ? data.reinforce : '是');
      $('#floorType').val(data ? data.floorType : '现浇板');
      $('#baseType').val(data ? data.baseType : '独立基础');
      $('#standardVersion').val(data ? data.standardVersion : '74规范');
    },
    _initSwfObject: function(placeholder_id, uploadurl, params) {
      var _self = this;
      var settings = {
        flash_url: "libs/swfupload/swfupload.swf",
        upload_url: uploadurl,
        post_params: params,
        file_size_limit: "100 MB",
        file_types: "*.jpg;*.png;*.jpeg;*.bmp",
        file_types_description: "Web Image Files",
        file_upload_limit: 10,
        file_queue_limit: 0,
        custom_settings: {
          progressTarget: "",
          cancelButtonId: "btnCancel"
        },
        debug: false,
        use_query_string: true,

        // Button settings
        button_image_url: "images/browser.png",
        button_width: "83",
        button_height: "26",
        button_placeholder_id: placeholder_id,
        button_cursor: SWFUpload.CURSOR.HAND,

        // The event handler functions are defined in handlers.js
        file_queued_handler: _self._fileQueued,
        file_queue_error_handler: _self._fileQueueError,
        upload_start_handler: _self._uploadStart,
        upload_progress_handler: _self._uploadProgress,
        upload_error_handler: _self._uploadError,
        upload_success_handler: _self._uploadSuccess,
        upload_complete_handler: _self._uploadComplete,
        queue_complete_handler: _self._queueComplete
      };

      _self.swfu = new SWFUpload(settings);
    },
    //swfobject events
    _fileQueued: function(file) {
      if (file == null) return;
      var html = '';
      html += '<tr id="' + file.id + '">';
      html += '<td style="width:30%;" class="text-center">' + file.name.replace(file.type, ''); + '</td>';
      html += '<td style="width:10%;" class="text-center">' + file.type + '</td>';
      html += '<td style="width:20%;" class="text-center">' + (parseFloat(file.size) / 1024).toFixed(2) + '</td>';
      html += '<td class="status" style="width:30%;">等待上传</td>';
      html += '<td style="width:10%;" class="text-center"><button type="button" class="close" aria-label="Close"><span aria-hidden="true">×</span></button></td>';
      html += '</tr>';
      $('#attachmentsBody').append(html);
      $('#' + file.id + ' .close').on('click', function(){
        window.buildingList.swfu.cancelUpload($(this).parents('tr').attr('id'), true);
        $(this).parents('tr').remove();
      });
    },
    _fileQueueError: function(file, errorCode, message) {
      if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
        return;
      }

      switch (errorCode) {
        case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
          progress.setStatus("文件大小超限.");
          break;
        case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
          progress.setStatus("无法上传文件大小为0的文件.");
          break;
        case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
          progress.setStatus("未知文件类型.");
          break;
        default:
          if (file !== null) {
            progress.setStatus("未知错误");
          }
          break;
      }
    },
    _uploadStart: function(file) {
      $('#' + file.id + ' .status').html('<div class="progress"></div>');
    },
    _uploadProgress: function(file, bytesLoaded, bytesTotal) {
      var percent = parseFloat(bytesLoaded / bytesTotal * 100).toFixed(1) + '%';
      $('#' + file.id + ' .progress').html('<div class="progress-bar progress-bar-success" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: ' + percent + ';"><span class="sr-only">' + percent + '%</span></div>');
    },
    _uploadError: function(file, errorCode, message) {
      $('#' + file.id + ' .status').html('上传文件失败');
    },
    _uploadSuccess: function(file, serverData) {
      $('#' + file.id + ' .status').html('上传成功');
      var result = $.parseJSON(serverData);
      if (result != null && result.result) {
        window.buildingList.successCallback({
          id: result.data,
          name: file.name,
          url: 'attachments/' + window.buildingList.selectData.id + '/' + file.name
        });
      }
    },
    _uploadComplete: function(file) {
      if (window.buildingList.swfu.getStats().files_queued > 0)
        window.buildingList.swfu.startUpload();
      else {
        setTimeout(function(e) {
          $('#dlgUpload').modal('hide');
          window.buildingList._raiseMessage('完成附件上传，共上传' + window.buildingList.swfu.getStats().successful_uploads + '个文件');
        }, 1000);
        window.buildingList.completeCallBack();
      }
    },
    _queueComplete: function(numFilesUploaded) {},
    //swfobject events
    _raiseMessage: function(msg) {
      $('.top-right').notify({
        message: {
          html: msg
        },
        type: 'success',
        transition: 'fade',
        fadeOut: {
          delay: 2500
        }
      }).show();
    },
    _raiseError: function(msg) {
      $('.top-right').notify({
        message: {
          html: msg
        },
        type: 'error',
        transition: 'fade',
        fadeOut: {
          delay: 2500
        }
      }).show();
    }
	};

	return Widget;
});