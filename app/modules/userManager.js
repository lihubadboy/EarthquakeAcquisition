define('modules/userManager', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self._attchEvents();
      _self._dialog();
      _self._delete();
      _self._add();
      _self._modify();
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

      $(window).on('resize', function(e){
        clearTimeout(_self.options.mapTimer);
        _self.options.mapTimer = setTimeout(function() {
          _self.resize();
        }, 300);
      });
    },
    _requestDatas: function() {
      var _self = this;
      _self.ajaxUtil.query(_self.options.OprUrls.user.queryUrl, null, function(respons) {
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
      _self.users = {
        '123': [],
        '456': []
      };
      html += '<div id="tableHeader" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-striped table-hover table-clear">';
      html += '<thead>';
      html += '<tr>';
      html += '<th style="width:5%;text-align: center;"><input id="chkAll" type="checkbox"></th>';
      html += '<th style="width:15%;">用户名</th>';
      html += '<th style="width:20%;">别名</th>';
      html += '<th style="width:15%;">角色</th>';
      html += '<th style="width:20%;">联系电话</th>';
      html += '<th style="width:25%;">邮箱地址</th>';
      html += '</tr>';
      html += '</thead>';
      html += '</table>';
      html += '</div>';
      html += '<div id="tableBody" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-hover table-clear">';
      html += '<tbody>';
      $.each(_self.viewModuls, function(key, val) {
        _self.users[val.role.id].push(val);
        html += '<tr index="' + key + '" class="tr' + (val.role.name == "管理员" ? '0' : '1') + '">';
        html += '<td style="width:5%;text-align: center;"><input type="checkbox"></td>';
        html += '<td style="width:15%;"><strong>' + val.name + '</strong></td>';
        html += '<td style="width:20%;">' + val.alias + '</td>';
        html += '<td style="width:15%;text-align: center;">' + (val.role.name == "管理员" ? '<span class="label label-dsh">管理员</span>' : '<span class="label label-ytg">采集员</span>') + '</td>';
        html += '<td style="width:20%;">' + val.telephone + '</td>';
        html += '<td style="width:25%;">' + val.email + '</td>';
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>';

      _self._updateTypeNum();
      $('.table-contain').html(html);
      $('#tableBody').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true)- $('#tableHeader').outerHeight(true) - 38);
      _self._initTableScrollBar('#tableBody', 'outside');
      $('#chkAll').attr('checked', false);

      //handel events
      $('.table > tbody > tr').on('click', function(e){
        if(e.target.tagName == 'INPUT') return -1;
        if($(this).hasClass('select')) {
          _self._disSelectData($(this).attr('index'));
          return -1;
        }
        _self._selectData($(this).attr('index'));
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
    _updateTypeNum: function() {
      var _self = this;
      $('#allnum').html(_self.users['123'].length + _self.users['456'].length);
      $('#num0').html(_self.users['123'].length);
      $('#num1').html(_self.users['456'].length);
    },
    _selectData: function(index) {
      var _self = this;
      _self.selectIndex = index;
      _self.selectData = _self.viewModuls[index];
      //select table
      $("#tableBody .select").removeClass('select');
      $("#tableBody [index = '" + index + "']").addClass('select');
    },
    _disSelectData: function() {
      var _self = this;
      _self.selectIndex = -1;
      _self.selectData = null;
      //unselect table
      $("#tableBody .select").removeClass('select');
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
      $('#tableBody').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true)- $('#tableHeader').outerHeight(true) - 38);
      $('#tableBody').css('height', $('#tableBody').css('max-height'));
    },
    _attchEvents: function() {
      var _self = this;
      $('.sub-menu-item.data-type').on('click', function(e){
        if($(this).hasClass('active')) return;
        $('.content-contain').removeClass('show' + $('.sub-menu-item.data-type.active').attr('data')).addClass('show' + $(this).attr('data'));
        $('.sub-menu-item.data-type').removeClass('active');
        $(this).addClass('active');
        $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      });
    },
    _dialog: function() {
      var _self = this;
      $('#btnAddUser').on('click', function(e) {
        $('#dlgExport #gridSystemModalLabel').html('新建用户');
        _self._initialDataDlg();
        $('#btn-add').css('display', 'inline-block');
        $('#btn-modify').css('display', 'none');
        $('#dlgExport').modal({
          backdrop: 'static'
        });
      });
      $('#btnEditUser').on('click', function(e) {
        if(!_self.selectData) {
          _self._raiseMessage('请先选择要编辑的用户.');
          return;
        }
        $('#dlgExport #gridSystemModalLabel').html('编辑用户-' + _self.selectData.name);
        _self._initialDataDlg(_self.selectData);
        $('#btn-add').css('display', 'none');
        $('#btn-modify').css('display', 'inline-block');
        $('#dlgExport').modal({
          backdrop: 'static'
        });
      });
    },
    _add: function() {
      var _self = this;
      $('#btn-add').on('click', function(e) {
        $('.has-error').removeClass('has-error');
        $('#ufield-1').val().trim() == '' && $('#ufield-1').parent('.form-group').addClass('has-error') && $('#ufield-1').focus();
        $('#ufield-3').val().trim() == '' && $('#ufield-3').parent('.form-group').addClass('has-error') && $('#ufield-3').focus();
        if ($('.has-error').length > 0) return;
        _self._getDataByName($('#ufield-1').val().trim(), function(data) {
          if (data) {
            $('#ufield-1').val('') && $('#ufield-1').parent('.form-group').addClass('has-error') && $('#ufield-1').focus();
            _self._raiseMessage('用户名已存在.');
            return;
          } else {
            var newdata = {
              "id": _self.common.guid(),
              "name": $('#ufield-1').val().trim(),
              "alias": ($('#ufield-2').val().trim() == '' ? $('#ufield-1').val().trim() : $('#ufield-2').val().trim()),
              "password": $('#ufield-3').val().trim(),
              "age": -1,
              "email": $('#ufield-4').val().trim(),
              "telephone": $('#ufield-5').val().trim(),
              "cellphone": $('#ufield-5').val().trim(),
              "sex": '',
              "role": {
                "id": $('#ufield-6').val()
              }
            };
            var query = newdata;

            _self.ajaxUtil._ajaxPost(_self.options.OprUrls.user.addUrl, query, function(response) {
              if (response.result) {
                _self._raiseMessage('添加用户成功！');
                _self._getDataByName(newdata.name, function(data) {
                  _self.viewModuls.push(data);
                  _self._insertRow(data, _self.viewModuls.length - 1);
                  _self._updateTypeNum();
                  _self.resize();
                });
                _self._disSelectData();
              } else
                _self._raiseError('添加用户成失败！请检查网络连接.');
              $('#dlgExport').modal('hide');
            });
          }
        });
      });
    },
    _delete: function() {
      var _self = this;
      $('#btnDeleteUser').on('click', function(e) {
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
      });

      $('#btnDelete').on('click', function(e) {
        $('#dlgDelete .modal-title').html('删除用户');
        $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在删除用户...');
        var selectNodes = $('#tableBody').find('input:visible:checked');
        var deleteDatas = [];
        var indexs = [];
        $.each(selectNodes, function(index, val) {
          deleteDatas.push(_self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))].id);
          indexs.push(parseInt($(this).parent().parent('tr').attr('index')));
        });
        _self.ajaxUtil.delete(_self.options.OprUrls.user.deleteUrl, deleteDatas, function(respons) {
          if (respons.result) {
            $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除用户成功！');
            _self._removeRows(indexs);
            _self._updateTypeNum();
            _self._disSelectData();
            _self.resize();
          } else{
            $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除用户失败！请检测网络连接.');
          }
          setTimeout(function(e){
            $('#dlgDelete').modal('hide');
          }, 300);
        });
      });
    },
    _modify: function() {
      var _self = this;
      $('#btn-modify').on('click', function(e) {
        $('.has-error').removeClass('has-error');
        $('#ufield-1').val().trim() == '' && $('#ufield-1').parent('.form-group').addClass('has-error') && $('#ufield-1').focus();
        $('#ufield-3').val().trim() == '' && $('#ufield-3').parent('.form-group').addClass('has-error') && $('#ufield-3').focus();
        if ($('.has-error').length > 0) return;
        _self._getDataByName($('#ufield-1').val().trim(), function(data) {
          if (data && data.id != _self.selectData.id) {
            $('#ufield-1').val('') && $('#ufield-1').parent('.form-group').addClass('has-error') && $('#ufield-1').focus();
            _self._raiseMessage('用户名已存在.');
            return;
          } else {
            _self.selectData.name = $('#ufield-1').val().trim();
            _self.selectData.alias = ($('#ufield-2').val().trim() == '' ? $('#ufield-1').val().trim() : $('#ufield-2').val().trim());
            _self.selectData.password = $('#ufield-3').val().trim();
            _self.selectData.email = $('#ufield-4').val().trim();
            _self.selectData.telephone = $('#ufield-5').val().trim();
            _self.selectData.role = {
              "id": $('#ufield-6').val(),
              "name": $('#ufield-6').val() == '123' ? '管理员' : '采集员'
            }
            var query = _self.selectData;
            _self.ajaxUtil._ajaxPost(_self.options.OprUrls.user.updateUrl, query, function(response) {
              if (response && response.result) {
                _self._raiseMessage('更新数据成功！');
                _self.datas[_self.selectIndex] = _self.selectData;
                _self.viewModuls[_self.selectIndex] = _self.selectData;
                _self._updateRow();
                _self._updateTypeNum();
                _self._disSelectData();
                _self.resize();
              } else
                _self._raiseMessage('更新数据失败！请检查网络连接.');
              $('#dlgExport').modal('hide');
            });
          }
        });
      });
    },
    _getDataByName: function(name, callback) {
      var _self = this;
      _self.ajaxUtil.query(_self.options.OprUrls.user.queryUrl, "name='" + name + "'", function(respons) {
        if (respons.result && respons.list && respons.list.length > 0) {
          callback && callback(respons.list[0]);
        }
        else {
          callback && callback(null);
        }
      });
    },
    _insertRow: function(val, index) {
      var _self = this,
          html = '';
      if(!val) return;
      _self.users[val.role.id].push(val);
      html += '<tr index="' + index + '" class="tr' + (val.role.name == "管理员" ? '0' : '1') + '">';
      html += '<td style="width:5%;text-align: center;"><input type="checkbox"></td>';
      html += '<td style="width:15%;"><strong>' + val.name + '</strong></td>';
      html += '<td style="width:20%;">' + val.alias + '</td>';
      html += '<td style="width:15%;text-align: center;">' + (val.role.name == "管理员" ? '<span class="label label-dsh">管理员</span>' : '<span class="label label-ytg">采集员</span>') + '</td>';
      html += '<td style="width:20%;">' + val.telephone + '</td>';
      html += '<td style="width:25%;">' + val.email + '</td>';
      html += '</tr>';
      $('#tableBody tbody').prepend(html);

      //handel events
      $("#tableBody [index = '" + index + "']").on('click', function(e){
        if(e.target.tagName == 'INPUT') return -1;
        if($(this).hasClass('select')) {
          _self._disSelectData($(this).attr('index'));
          return -1;
        }
        _self._selectData($(this).attr('index'));
      });
      $("#tableBody [index = '" + index + "'] input").on('click', function(e) {
          $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      });
    },
    _removeRows: function(indexs) {
      var _self = this;
      _self.users = {
        '123': [],
        '456': []
      };
      $.each(indexs, function(key, val){$("#tableBody [index = '" + val + "']").remove();});
      
      $.each(_self.viewModuls, function(key, val) {
        typeof(indexs.find(function(ind){return ind == key;})) == "undefined" && _self.users[val.role.id].push(val);
      });
    },
    _updateRow: function(index) {
      var _self = this;
      _self.users = {
        '123': [],
        '456': []
      };
      typeof(index) == 'undefined' && (index = _self.selectIndex);
      var data = _self.viewModuls[index];
      $($("#tableBody [index = '" + index + "'] td")[1]).html('<strong>' + data.name + '</strong>');
      $($("#tableBody [index = '" + index + "'] td")[2]).html(data.alias);
      $($("#tableBody [index = '" + index + "'] td")[3]).html(data.role.name == "管理员" ? '<span class="label label-dsh">管理员</span>' : '<span class="label label-ytg">采集员</span>');
      $($("#tableBody [index = '" + index + "'] td")[4]).html(data.telephone);
      $($("#tableBody [index = '" + index + "'] td")[5]).html(data.email);
      $.each(_self.viewModuls, function(key, val) {
        _self.users[val.role.id].push(val);
      });
    },
    _initialDataDlg: function(data) {
      var _self = this;
      $('#ufield-1').val(data ? data.name : '');
      $('#ufield-2').val(data ? data.alias : '');
      $('#ufield-3').val(data ? data.password : '');
      $('#ufield-6').val(data ? data.role.id : '456');
      $('#ufield-4').val(data ? data.email : '');
      $('#ufield-5').val(data ? data.telephone : '');
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