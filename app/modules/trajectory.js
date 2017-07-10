define('modules/trajectory', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
          window.location.href = "login.html";
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
      $('.right-panel .tab-pane').css('max-height', $('.right-panel').innerHeight()- $('.right-panel .sub-menu-title').outerHeight(true));
      $('.right-panel .tab-pane').css('height', $('.tab-pane').css('max-height'));
      $(window).on('resize', function(e){
        clearTimeout(_self.options.mapTimer);
        _self.options.mapTimer = setTimeout(function() {
          _self.resize();
        }, 300);
      });
    },
    _requestDatas: function(date) {
      var _self = this;
      _self.ajaxUtil.search(_self.options.OprUrls.devicetrack.queryUrl + '?dateform=' + (date ? (new Date(date)).Format('yyyy-MM-dd') : (new Date()).Format('yyyy-MM-dd')) + '&q=1%3D1', {}, function(respons) {
        if (respons && respons.result && respons.list) {
          _self.datas = respons.list;
          _self.viewModuls = _self.datas;
          _self._constructMap();
        }
        else {
          $('#map').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
      });
    },
    _constructMap: function() {
      var _self = this,
          html = '';
      if (!_self.map) {
        _self.map = new BMap.Map("map",{enableMapClick:false}); // 创建Map实例
        _self.map.setMapStyle({
          style: _self.options.city.style
        });
        var size = new BMap.Size(64, 20);
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
      }
      if (_self.viewModuls) {
        _self.map.closeInfoWindow();
        _self.map.clearOverlays();
        $.each(_self.viewModuls, function(key, data) {
          if (data.track) {
            $.each(data.track, function(key1, data1) {
              var marker = new BMap.Marker(new BMap.Point(data1.Longitude, data1.Latitude));
              var content = data1;
              _self.map.addOverlay(marker);
              var label = new BMap.Label(data.name, {
                offset: new BMap.Size(20, -10)
              });
              marker.setLabel(label);
              _self._addClickHandler(content, marker);
            });
          }
          html += '<li class="media" index="' + key + '">';
          html += '<a class="pull-left" href="#"><img class="media-object" src="images/defavatar.png" style="width: 24px; height: 24px;"></a>';
          html += '<div class="media-body">';
          html += '<p class="blue"><strong>' + data.name + '</strong><span class="label label-secondary pull-right">' + (data.track ? data.track.length : 0) + '</span></p>';
          html += '</div>';
          html += '</li>';
        });
        $('#userList').html(html);
        _self._attchEvents();
      }
    },
    _addClickHandler: function(content, marker) {
      var _self = this;
      marker.addEventListener("click", function(e) {
        _self.map.centerAndZoom(new BMap.Point(content.Longitude, content.Latitude), 18);
      });
    },
    _attchEvents: function() {
      var _self = this;
      $('.datepicker').on('changeDate', function(e){
        _self._requestDatas(e.date.Format('yyyy-MM-dd'));
      });
      $('.media').on('click', function(e){
        var data = _self.viewModuls[parseInt($(this).attr('index'))]
        if(data && data.track && data.track.length > 0)_self.map.centerAndZoom(new BMap.Point(data.track[0].Longitude, data.track[0].Latitude), 18);
      })
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
    resize: function() {
      var _self = this;
      $('.page-body-static').css('height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight());
      $('.right-panel .tab-pane').css('max-height', $('.right-panel').innerHeight()- $('.right-panel .sub-menu-title').outerHeight(true));
      $('.right-panel .tab-pane').css('height', $('.tab-pane').css('max-height'));
      _self.myChart.resize();
    },
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