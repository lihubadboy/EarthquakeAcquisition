define('modules/vulnerSetting', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self.ajaxUtil.query(_self.options.OprUrls.ysxinfo.queryUrl, null, function(respons) {
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
        '土木结构': [],
        '砖木结构': [],
        '砖混结构': [],
        '框架结构': [],
        '高层钢混结构': []
      };
      html += '<div id="tableHeader" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-striped table-hover table-clear">';
      html += '<thead>';
      html += '<tr>';
      // html += '<th style="width:10%;text-align: center;"><input id="chkAll" type="checkbox"></th>';
      html += '<th style="width:20%;">结构类型</th>';
      html += '<th style="width:20%;">烈度</th>';
      html += '<th style="width:10%;">是否设防</th>';
      html += '<th style="width:10%;">基本完好(%)</th>';
      html += '<th style="width:10%;">轻微破坏(%)</th>';
      html += '<th style="width:10%;">中等破坏(%)</th>';
      html += '<th style="width:10%;">严重破坏(%)</th>';
      html += '<th style="width:10%;">毁坏(%)</th>';
      html += '</tr>';
      html += '</thead>';
      html += '</table>';
      html += '</div>';
      html += '<div id="tableBody" class="col-md-12 clear-padding-left clear-padding-right">';
      html += '<table class="table table-hover table-clear">';
      html += '<tbody>';
      $.each(_self.viewModuls, function(key, val) {
        _self.buildingDatas[val.buildingtypesByType.name].push(val);
        html += '<tr index="' + key + '" class="trs' + val.buildingtypesByType.id + '">';
        // html += '<td style="width:10%;text-align: center;"><input type="checkbox"></td>';
        html += '<td style="width:20%;"><strong>' + val.buildingtypesByType.name + '</strong></td>';
        html += '<td style="width:20%;" class="blue">' + val.intensity + '</td>';
        html += '<td style="width:10%;">' + (val.isFortification ? '<span class="label label-secondary">是</span>' : '<span class="label label-red">否</span>') + '</td>';
        html += '<td style="width:10%;">' + val.jbwh + '</td>';
        html += '<td style="width:10%;">' + val.qwph + '</td>';
        html += '<td style="width:10%;">' + val.zdph + '</td>';
        html += '<td style="width:10%;">' + val.yzph + '</td>';
        html += '<td style="width:10%;">' + val.hh + '</td>';
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>';

      $('.table-contain').html(html);
      $('#tableBody').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true)- $('#tableHeader').outerHeight(true) - 38);
      _self._initTableScrollBar('#tableBody', 'outside');
      // $('#chkAll').attr('checked', false);

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
      // $('#chkAll').on('click', function(event) {
      //   $.each($('#tableBody input:visible'), function(index, node) {
      //     node.checked = event.currentTarget.checked;
      //   });
      // });

      // $('#tableBody input').on('click', function(e) {
      //     $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      // });
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
        // $('#chkAll').prop('checked', $('#tableBody input:visible:checked').length > 0 && $('#tableBody input:visible:checked').length == $('#tableBody input:visible').length);
      });
    },
    _dialog: function() {
      var _self = this;
      // $('#btnAddRecord').on('click', function(e) {
      //   $('#dlgExport #gridSystemModalLabel').html('新建记录');
      //   _self._initialDataDlg();
      //   $('#btn-add').css('display', 'inline-block');
      //   $('#btn-modify').css('display', 'none');
      //   $('#dlgExport').modal({
      //     backdrop: 'static'
      //   });
      // });
      $('#btnEditRecord').on('click', function(e) {
        if(!_self.selectData) {
          _self._raiseMessage('请先选择要编辑的记录.');
          return;
        }
        $('#dlgExport #gridSystemModalLabel').html('编辑记录-' + _self.selectData.buildingtypesByType.name);
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
        ($('#jbwh').val().trim() == '' || (new Number($('#jbwh').val().trim())).toString() == 'NaN') && $('#jbwh').parent('.form-group').addClass('has-error') && $('#jbwh').focus();
        ($('#qwph').val().trim() == '' || (new Number($('#qwph').val().trim())).toString() == 'NaN') && $('#qwph').parent('.form-group').addClass('has-error') && $('#qwph').focus();
        ($('#zdph').val().trim() == '' || (new Number($('#zdph').val().trim())).toString() == 'NaN') && $('#zdph').parent('.form-group').addClass('has-error') && $('#zdph').focus();
        ($('#yzph').val().trim() == '' || (new Number($('#yzph').val().trim())).toString() == 'NaN') && $('#yzph').parent('.form-group').addClass('has-error') && $('#yzph').focus();
        ($('#hh').val().trim() == '' || (new Number($('#hh').val().trim())).toString() == 'NaN') && $('#hh').parent('.form-group').addClass('has-error') && $('#hh').focus();
        if ($('.has-error').length > 0) return;
        if (parseFloat($('#jbwh').val()) + parseFloat($('#qwph').val()) + parseFloat($('#zdph').val()) + parseFloat($('#yzph').val()) + parseFloat($('#hh').val()) != 100) {
          $('#jbwh').parent('.form-group').addClass('has-error') && $('#structType').focus();
          _self._raiseMessage('5种状态之和必须等于100！');
          return;
        }
        _self._isExist($('#structType').val(), $('#intensity').val(), function(data) {
          if (data) {
            $('#structType').parent('.form-group').addClass('has-error') && $('#structType').focus();
            _self._raiseMessage('已存在指定结构类型的数据.');
            return;
          } else {
            var newdata = {
              // "id": _self.common.guid(),
              "jbwh": parseFloat($('#jbwh').val()),
              "qwph": parseFloat($('#qwph').val()),
              "zdph": parseFloat($('#zdph').val()),
              "yzph": parseFloat($('#yzph').val()),
              "hh": parseFloat($('#hh').val()),
              "intensity": parseInt($('#intensity').val()),
              "isFortification": 1,
              "buildingtypesByType": {
                "id": $('#structType').val()
              }
            };
            var query = newdata;
            _self.ajaxUtil._ajaxPost(_self.options.OprUrls.ysxinfo.addUrl, query, function(response) {
              if (response && response.result) {
                _self._raiseMessage('添加记录成功！');
                _self._isExist(newdata.buildingtypesByType.id, newdata.intensity, function(data) {
                  _self.viewModuls.push(data);
                  _self._insertRow(data, _self.viewModuls.length - 1);
                  _self.resize();
                });
                _self._disSelectData();
              } else
                _self._raiseMessage('添加记录成失败！请检查网络连接.');
              $('#dlgExport').modal('hide');
            });
          }
        });
      });
    },
    _delete: function() {
      var _self = this;
      $('#btnDeleteRecord').on('click', function(e) {
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
        $('#dlgDelete .modal-title').html('删除记录');
        $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在删除记录...');
        var selectNodes = $('#tableBody').find('input:visible:checked');
        var deleteDatas = [];
        var indexs = [];
        $.each(selectNodes, function(index, val) {
          deleteDatas.push(_self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))].id);
          indexs.push(parseInt($(this).parent().parent('tr').attr('index')));
        });
        _self.ajaxUtil.delete(_self.options.OprUrls.ysxinfo.deleteUrl, deleteDatas, function(respons) {
          if (respons.result) {
            $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除记录成功！');
            _self._removeRows(indexs);
            _self._disSelectData();
            _self.resize();
          } else{
            $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除记录失败！请检测网络连接.');
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
        ($('#jbwh').val().trim() == '' || (new Number($('#jbwh').val().trim())).toString() == 'NaN') && $('#jbwh').parent('.form-group').addClass('has-error') && $('#jbwh').focus();
        ($('#qwph').val().trim() == '' || (new Number($('#qwph').val().trim())).toString() == 'NaN') && $('#qwph').parent('.form-group').addClass('has-error') && $('#qwph').focus();
        ($('#zdph').val().trim() == '' || (new Number($('#zdph').val().trim())).toString() == 'NaN') && $('#zdph').parent('.form-group').addClass('has-error') && $('#zdph').focus();
        ($('#yzph').val().trim() == '' || (new Number($('#yzph').val().trim())).toString() == 'NaN') && $('#yzph').parent('.form-group').addClass('has-error') && $('#yzph').focus();
        ($('#hh').val().trim() == '' || (new Number($('#hh').val().trim())).toString() == 'NaN') && $('#hh').parent('.form-group').addClass('has-error') && $('#hh').focus();
        if ($('.has-error').length > 0) return;
        if (parseFloat($('#jbwh').val()) + parseFloat($('#qwph').val()) + parseFloat($('#zdph').val()) + parseFloat($('#yzph').val()) + parseFloat($('#hh').val()) != 100) {
          $('#jbwh').parent('.form-group').addClass('has-error') && $('#structType').focus();
          _self._raiseMessage('5种状态之和必须等于100！');
          return;
        }
        _self.selectData.jbwh = parseFloat($('#jbwh').val().trim());
        _self.selectData.qwph = parseFloat($('#qwph').val().trim());
        _self.selectData.zdph = parseFloat($('#zdph').val().trim());
        _self.selectData.yzph = parseFloat($('#yzph').val().trim());
        _self.selectData.hh = parseFloat($('#hh').val().trim());

        var query = _self.selectData;
        _self.ajaxUtil._ajaxPost(_self.options.OprUrls.ysxinfo.updateUrl, query, function(response) {
          if (response && response.result) {
            _self._raiseMessage('更新数据成功！');
            _self.datas[_self.selectIndex] = _self.selectData;
            _self.viewModuls[_self.selectIndex] = _self.selectData;
            _self._updateRow();
            _self._disSelectData();
            _self.resize();
          } else
            _self._raiseMessage('更新数据失败！请检查网络连接.');
          $('#dlgExport').modal('hide');
        });
      });
    },
    _isExist: function(id, intensity, callback) {
      var _self = this;
      _self.ajaxUtil.query(_self.options.OprUrls.ysxinfo.queryUrl, "intensity=" + intensity + " AND buildingtypesByType.id='" + id + "'", function(respons) {
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
      html += '<tr index="' + index + '" class="tr' + val.buildingtypesByType.id + '">';
      html += '<td style="width:10%;text-align: center;"><input type="checkbox"></td>';
      html += '<td style="width:20%;"><strong>' + val.buildingtypesByType.name + '</strong></td>';
      html += '<td style="width:20%;" class="blue">' + val.intensity + '</td>';
      html += '<td style="width:10%;">' + val.jbwh + '</td>';
      html += '<td style="width:10%;">' + val.qwph + '</td>';
      html += '<td style="width:10%;">' + val.zdph + '</td>';
      html += '<td style="width:10%;">' + val.yzph + '</td>';
      html += '<td style="width:10%;">' + val.hh + '</td>';
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
      $.each(indexs, function(key, val){$("#tableBody [index = '" + val + "']").remove();});
    },
    _updateRow: function(index) {
      var _self = this;
      typeof(index) == 'undefined' && (index = _self.selectIndex);
      var data = _self.viewModuls[index];
      $($("#tableBody [index = '" + index + "'] td")[2]).html(data.jbwh);
      $($("#tableBody [index = '" + index + "'] td")[3]).html(data.qwph);
      $($("#tableBody [index = '" + index + "'] td")[4]).html(data.zdph);
      $($("#tableBody [index = '" + index + "'] td")[5]).html(data.yzph);
      $($("#tableBody [index = '" + index + "'] td")[6]).html(data.hh);
    },
    _initialDataDlg: function(data) {
      var _self = this;
      $('#structType').val(data ? data.buildingtypesByType.id : '');
      $('#intensity').val(data ? data.intensity : '');
      $('#jbwh').val(data ? data.jbwh : '0');
      $('#qwph').val(data ? data.qwph : '0');
      $('#zdph').val(data ? data.zdph : '0');
      $('#yzph').val(data ? data.yzph : '0');
      $('#hh').val(data ? data.hh : '0');
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