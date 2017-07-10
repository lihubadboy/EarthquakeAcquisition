define('modules/buildingImages', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common){
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
      _self._attchEvents();
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
      $('.album-images').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true) - 30 *2);
      $('.album-images').css('height', $('#tableBody').css('max-height'));
      $(window).on('resize', function(e){
        clearTimeout(_self.options.mapTimer);
        _self.options.mapTimer = setTimeout(function() {
          _self.resize();
        }, 300);
      });
    },
    _requestDatas: function() {
      var _self = this;
      _self.ajaxUtil.query(_self.options.OprUrls.buildingimages.queryUrl, null, function(respons) {
        if (respons.result) {
          _self.datas = respons.list;
          _self.viewModuls = _self.datas;
          _self._constuctAlbums();
        } else {
          $('.album-images').html('<p class="text-center text-danger" style="padding-top: 280px;"><span class="fa fa-exclamation-triangle"></span> 获取数据失败，请检测网络环境...</p>');
        }
      });
    },
    _constuctAlbums: function() {
      var _self = this;
      var html = '';
      if(_self.datas){
        $.each(_self.datas, function(key, val){
          html += '<div class="col-md-3 col-sm-4 col-xs-6 trs' + val.type + '">';
          html += '<div id="' + val.id + '" class="album-image">';
          html += '<a href="#" class="thumb" data-action="edit">';
          html += '<img src="' + _self.options.thumbnailBaseUrl1 + val.name + '" class="img-responsive" />';
          html += '</a>';
          html += '<a href="#" class="name">';
          html += '<span>' + _self._getTypeByID(val.type) + '</span>';
          html += '<em>' + (new Date(val.uploadTime)).Format('yyyy年MM月dd日 hh:mm') +'</em>';
          html += '</a>';
          html += '<div class="image-options">';
          html += '<a href="#" data-action="trash"><i class="fa-trash"></i></a>';
          html += '</div>';
          html += '<div class="image-checkbox">';
          html += '<input type="checkbox" class="cbr"/>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
      }
      else
        html = '<p class="text-center text-muted" style="padding-top: 280px;"><i class="fa fa-info-circle"></i> 尚未上传建筑物图片</p>';
      if ($('.album-images.mCustomScrollbar').length > 0) {
        $('.album-images .mCSB_container').html(html);
        _self._updateTableScrollBar('.album-images');
      } else {
        $('.album-images').html(html);
        _self._initTableScrollBar('.album-images', 'outside');
      }

      $('.gallery-env a[data-action="trash"]').on('click', function(ev) {
        ev.preventDefault();
        $('#deleteContent').html('<i class="fa fa-question-circle"></i> 确认删除该记录？');
        $('#dlgDelete .modal-footer').css('display', 'block');
        $('#dlgDelete').modal({
          backdrop: 'static'
        });
        _self.selectID = $(this).parents('.album-image').attr('id');
        _self.isDeleteSingle = true;
      });
    },
    _getTypeByID: function(id) {
      if(id=='1')return '土木结构';
      if(id=='2')return '砖木结构';
      if(id=='3')return '砖混结构';
      if(id=='4')return '框架结构';
      if(id=='5')return '高层钢混结构';
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
      $('.album-images').css('max-height', $('.page-body-static').innerHeight() - $('.opration-contain').outerHeight(true) - 30 * 2);
      $('.album-images').css('height', $('#tableBody').css('max-height'));
    },
    _attchEvents: function() {
      var _self = this;
      $('.sub-menu-item.data-type').on('click', function(e){
        if($(this).hasClass('active')) return;
        $('.content-contain').removeClass('show' + $('.sub-menu-item.data-type.active').attr('data')).addClass('show' + $(this).attr('data'));
        $('.sub-menu-item.data-type').removeClass('active');
        $(this).addClass('active');
      });
    },
    _dialog: function() {
      var _self = this;
      $('#btnUploadImages').on('click', function(e){
        _self.successCallback = function(data){
          // window.buildingImages.datas.push(data);
        };
        _self.completeCallBack = function(){
          window.buildingImages._requestDatas();
        };
        _self._appendAttachments();
      });
    },
    _delete: function() {
      var _self = this;
      $('#btnDeleteSelected').on('click', function(e) {
        $('#dlgDelete .modal-title').html('删除');
        if ($('.album-images input:visible:checked').length == 0) {
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

      $('#btnDelete').on('click', function(e) {
        $('#dlgDelete .modal-title').html('删除');
        $('#deleteContent').html('<i class="fa fa-info-circle"></i> 正在删除...');
        if (!_self.isDeleteSingle) {
          var selectNodes = $('.album-images').find('input:visible:checked');
          var deleteDatas = [];
          var indexs = [];
          $.each(selectNodes, function(index, val) {
            deleteDatas.push($(this).parents('.album-image').attr('id'));
          });
          _self.ajaxUtil.delete(_self.options.OprUrls.buildingimages.deleteUrl, deleteDatas, function(respons) {
            if (respons.result) {
              $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除数据成功！');
              _self._removeRows(deleteDatas);
              _self.resize();
            } else{
              $('#deleteContent').html('<i class="fa fa-exclamation-circle"></i> 删除数据失败！');
            }
            setTimeout(function(e){
              $('#dlgDelete').modal('hide');
            }, 300);
          });
        } else {
          var deleteDatas = [_self.selectID];
          _self.ajaxUtil.delete(_self.options.OprUrls.buildingimages.deleteUrl, deleteDatas, function(respons) {
            if (respons.result) {
              $('#deleteContent').html('<i class="fa fa-check-circle"></i> 删除数据成功！');
              _self._removeRows([_self.selectID]);
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
      var _self = this;
      $.each(indexs, function(key, val){$("#" + val).parent('div').remove();});
    },
    _appendAttachments: function() {
      var _self = this;
      var formHtml = '';
      formHtml += '<form class="form-horizontal no-margin-bottom">';
      formHtml += '<div class="form-group">';
      formHtml += '<label class="col-sm-2 control-label">结构类型</label>';
      formHtml += '<div class="col-sm-10">';
      formHtml += '<select id="structType" class="form-control">';
      formHtml += '<option value="1">土木结构</option>';
      formHtml += '<option value="2">砖木结构</option>';
      formHtml += '<option value="3">砖混结构</option>';
      formHtml += '<option value="4">框架结构</option>';
      formHtml += '<option value="5">高层钢混结构</option>';
      formHtml += '</select>';
      formHtml += '</div>';
      formHtml += '</div>';
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
      formHtml += '<p class="muted"><span class="label label-warning">注意！</span> 每次限选<strong>5个</strong>文件,并且文件大小需小于<strong>1M</strong></p>';
      formHtml += '</div>';

      formHtml += '<div class="row-fluid" style="margin-top: 20px;">';
      formHtml += '<div class="left">';
      formHtml += '<span id="spanButtonPlaceHolder"></span>';
      formHtml += '</div>';
      formHtml += '</div>';

      formHtml += '</div>';
      formHtml += '</div>';

      formHtml += '</form>';
      $('#dlgUpload .modal-body > .container-fluid').html(formHtml);
      $('#dlgUpload').modal({
        backdrop: 'static'
      });
      _self._initSwfObject("spanButtonPlaceHolder", _self.options.OprUrls.buildingimages.uploadUrl);
      _self._initTableScrollBar('#attachmentsContent');

      //events
      $('#btnUpload').on('click', function(e) {
        _self.swfu.startUpload();
      });
    },
    _initSwfObject: function(placeholder_id, uploadurl, params) {
      var _self = this;
      var settings = {
        flash_url: "libs/swfupload/swfupload.swf",
        upload_url: uploadurl,
        post_params: params,
        file_size_limit: "1 MB",
        file_types: "*.jpg;*.png;*.jpeg;*.bmp",
        file_types_description: "Web Image Files",
        file_upload_limit: 5,
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
      window.buildingImages.swfu.addFileParam(file.id, "type", $('#structType').val());
      $('#' + file.id + ' .close').on('click', function(){
        window.buildingImages.swfu.cancelUpload($(this).parents('tr').attr('id'), true);
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
        // window.buildingImages.successCallback({
        //   id: result.data,
        //   name: file.name,
        //   url: 'attachments/' + window.buildingImages.selectData.id + '/' + file.name
        // });
      }
    },
    _uploadComplete: function(file) {
      if (window.buildingImages.swfu.getStats().files_queued > 0)
        window.buildingImages.swfu.startUpload();
      else {
        setTimeout(function(e) {
          $('#dlgUpload').modal('hide');
          window.buildingImages._raiseMessage('完成附件上传，共上传' + window.buildingImages.swfu.getStats().successful_uploads + '个文件');
        }, 1000);
        window.buildingImages.completeCallBack();
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