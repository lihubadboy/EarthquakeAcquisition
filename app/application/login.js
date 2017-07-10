define('application/login', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common) {
  var Widget = function(options) {
    var _self = this;
    _self.options = options;
    _self.ajaxUtil = new ajaxUtil(_self.options.proxyUrl);
    _self.common = new common();
    _self._init();
  };
  Widget.prototype = {
    _init: function() {
      var _self = this;
      _self._event();
      _self._fill();
    },
    _formartUrl: function (url) {
      var _self = this;
      return url.indexOf(window.location.host) > -1 ? url : _self.options.proxyUrl + '?' + url;
    },
    _fill: function() {
      var _self = this;
      var remember = _self.common.getCookieValue("rememberMe");
      if (remember == null || remember == undefined || remember == "") {
        $("#username").val('');
        $("#passwd").val('');
        $("#remember")[0].checked = false;
        $('.cbr-replaced').removeClass('cbr-checked');
      } else {
        var authors = eval("(" + remember + ")");
        $("#username").val(authors.username);
        $("#password").val(authors.password);
        $("#remember")[0].checked = true;
        $('.cbr-replaced').addClass('cbr-checked');
        $("#username").blur();
      }
    },
    _remember: function() {
      var _self = this;
      var isChecked = $("#remember")[0].checked;
      if (isChecked == false) {
        _self.common.deleteCookie("rememberMe", "/");
      } else {
        var username = $("#username").val();
        var password = $("#password").val();
        var user = {
          username: username,
          password: password
        }
        _self.common.setCookie("rememberMe", JSON.stringify(user), 10, '/');
      }
    },
    _event: function() {
      var _self = this;
      setTimeout(function() {
        $(".fade-in-effect").addClass('in');
      }, 1);
      $("form#login").validate({
        rules: {
          username: {
            required: true
          },
          passwd: {
            required: true
          }
        },
        messages: {
          username: {
            required: '用户名不能为空.'
          },

          passwd: {
            required: '密码不能为空.'
          }
        },
        submitHandler: function(form) {
          show_loading_bar(70);
          _self._remember();
          var opts = {
            "closeButton": true,
            "debug": false,
            "positionClass": "toast-top-full-width",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
          };
          $.ajax({
            type: "GET",
            url: _self._formartUrl(_self.options.LoginUrls.url + "?username=" + $(form).find('#username').val() + "&password=" + $(form).find('#passwd').val()),
            dataType: "json",
            contentType: "application/json",
            timeout: 2000,
            success: function(data) {
              show_loading_bar({
                delay: .5,
                pct: 100,
                finish: function() {
                  if (data.result && data.data) {
                    var author = {
                      userid: data.data.id,
                      username: data.data.alias,
                      role: {
                        id: data.data.role.id,
                        name: data.data.role.name
                      }
                    }
                    _self.common.setCookie(_self.options.authorInfoKey, JSON.stringify(author), '', '/');
                    window.location.href = 'index.html';
                  }
                }
              });
              // Remove any alert
              $(".errors-container .alert").slideUp('fast');
              // Show errors
              if (!data.result || !data.data) {
                $(".errors-container").html('<div class="alert alert-danger">\
                        <button type="button" class="close" data-dismiss="alert">\
                          <span aria-hidden="true">&times;</span>\
                          <span class="sr-only">Close</span>\
                        </button>\
                        ' + '用户名或密码错误，登入失败' + '\
                      </div>');


                $(".errors-container .alert").hide().slideDown();
                $(form).find('#passwd').select();
              }
            }
          });

        }
      });
    }
  };

  return Widget;
});