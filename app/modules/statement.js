define('modules/statement', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self._logout();
    },
    _getAuthorInfo: function() {
      var _self = this;
      var cookies = _self.common.getCookieValue(_self.options.authorInfoKey);
      if (cookies == "" || cookies == null || cookies == undefined) {
        $('.dropdown.user-profile').empty();
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
      $('.page-body-static').css('max-height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight() - $('.main-footer').innerHeight() - 20);
      $('.page-body-static').css('height', $('.page-body-static').css('max-height'));
      _self._initTableScrollBar('.page-body-static');
      $(window).on('resize', function(e){
        clearTimeout(_self.options.mapTimer);
        _self.options.mapTimer = setTimeout(function() {
          _self.resize();
        }, 300);
      });
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
      $('.page-body-static').css('max-height', document.body.clientHeight - $('.user-info-navbar').innerHeight() - $('.page-title').innerHeight() - $('.main-footer').innerHeight() - 20);
      _self._updateTableScrollBar('.page-body-static');
    }
	};

	return Widget;
});