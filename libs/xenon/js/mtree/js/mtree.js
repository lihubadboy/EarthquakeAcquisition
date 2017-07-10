/**
 *
 */
(function($) {
    $.fn.extend({
        mtree: function(dataList, opts) {
            var opts = $.extend({
                title: "",
                identify_field: "code",
                display_field: "name",
                child_field: "childs",
                num_field: "",
                callback: function() {return false;}
            }, opts || {});

            return $(this).each(function(index, item) {

                var this_id = item.id;
                //创建树节点
                var draw = function (list) {
                    var panel = $('<ul class="mtree"/>');
                    drawLevel(panel, list);
                    return panel;
                };

                var drawLevel = function (parent, list) {
                    $.each(list, function (index, val) {
                        var li = $('<li/>').appendTo(parent),
                            a = $('<a/>').text(val[opts["display_field"]])
                                .attr("href", "javascript:void(0);")
                                .attr("name", val[opts["identify_field"]])
                                .appendTo(li);
                        if(opts["num_field"]) {
                            a.append($('<span class="node-data-num"/>').text((val[opts["num_field"]] || 0) + "条"));
                        }

                        if (val[opts["child_field"]] && val[opts["child_field"]].length > 0) {
                            var ul = $('<ul/>').appendTo(li);
                            drawLevel(ul, val[opts["child_field"]]);
                        }
                    });
                };

                //====================

                //根据选中id获取对象，需改
                var getObjById = function(arr, id) {
                    var obj;
                    $.each(arr, function(index, item) {
                        if(item[opts["identify_field"]] == id) {
                            obj = item;
                            return false;
                        } else {
                            if(item[opts["child_field"]]) {
                                var result = getObjById(item[opts["child_field"]], id);
                                if(result) {
                                    obj = result;
                                    return false;
                                }
                            }
                        }
                    });

                    return obj;
                };

                //初始化树操作
                var initEvt = function () {
                    ;(function ($, window, document, undefined) {
                        if ($('#' + this_id + ' ul.mtree').length) {
                            var collapsed = true;
                            var close_same_level = true;
                            var duration = 400;
                            var listAnim = true;
                            var easing = 'easeOutQuart';
                            $('#' + this_id + ' .mtree ul').css({
                                'overflow': 'hidden',
                                'height': collapsed ? 0 : 'auto',
                                'display': collapsed ? 'none' : 'block'
                            });
                            var node = $('#' + this_id + ' .mtree li:has(ul)');
                            node.each(function (index, val) {
                                $(this).children(':first-child').css('cursor', 'pointer');
                                $(this).addClass('mtree-node mtree-' + (collapsed ? 'closed' : 'open'));
                                $(this).children('ul').addClass('mtree-level-' + ($(this).parentsUntil($('#' + this_id + ' ul.mtree'), 'ul').length + 1));
                            });
                            $('#' + this_id + ' .mtree li > *:first-child').on('click.mtree-active', function (e) {

                                if (!$(this).parent().hasClass('mtree-active')) {// && $(this).parent().children().length == 1

                                    var obj = getObjById(dataList, $(this).attr("name"));

                                    opts.callback(obj, this);
                                }

                                if ($(this).parent().hasClass('mtree-closed')) {
                                    $('#' + this_id + ' .mtree-active').not($(this).parent()).removeClass('mtree-active');
                                    $(this).parent().addClass('mtree-active');
                                } else if ($(this).parent().hasClass('mtree-open')) {
//                        $(this).parent().removeClass('mtree-active');
                                    $(this).parent().addClass('mtree-active');
                                } else {
                                    $('#' + this_id + ' .mtree-active').not($(this).parent()).removeClass('mtree-active');
                                    $(this).parent().addClass('mtree-active');
//                            $(this).parent().toggleClass('mtree-active');
                                }
                            });
                            node.children(':first-child').on('click.mtree', colHandler);
                            $('#' + this_id + " .mtree > li:not(:has(ul))").children(":first-child").on('click.mtree', function(){
                                var isOpen = $(this).parent().hasClass('mtree-open');
                                if (close_same_level && !isOpen) {
                                    var close_items = $(this).closest('ul').children('.mtree-open').not($(this).parent()).children('ul');
                                    if ($.Velocity) {
                                        close_items.velocity({height: 0}, {
                                            duration: duration,
                                            easing: easing,
                                            display: 'none',
                                            delay: 100,
                                            complete: function () {
                                                setNodeClass($(this).parent(), true);
                                            }
                                        });
                                    } else {
                                        close_items.delay(100).slideToggle(duration, function () {
                                            setNodeClass($(this).parent(), true);
                                        });
                                    }
                                }
                            });
                            function colHandler (e) {
                                var el = $(this).parent().children('ul').first();
                                var isOpen = $(this).parent().hasClass('mtree-open');
                                if (close_same_level && !isOpen) {
                                    var close_items = $(this).closest('ul').children('.mtree-open').not($(this).parent()).children('ul');
                                    if ($.Velocity) {
                                        close_items.velocity({height: 0}, {
                                            duration: duration,
                                            easing: easing,
                                            display: 'none',
                                            delay: 100,
                                            complete: function () {
                                                setNodeClass($(this).parent(), true);
                                            }
                                        });
                                    } else {
                                        close_items.delay(100).slideToggle(duration, function () {
                                            setNodeClass($(this).parent(), true);
                                        });
                                    }
                                }
                                el.css({'height': 'auto'});
                                if (!isOpen && $.Velocity && listAnim)
                                    el.find(' > li, li.mtree-open > ul > li').css({'opacity': 0}).velocity('stop').velocity('list');
                                if ($.Velocity) {
                                    el.velocity('stop').velocity({
                                        height: isOpen ? [
                                            0,
                                            el.outerHeight()
                                        ] : [
                                            el.outerHeight(),
                                            0
                                        ]
                                    }, {
                                        queue: false,
                                        duration: duration,
                                        easing: easing,
                                        display: isOpen ? 'none' : 'block',
                                        begin: setNodeClass($(this).parent(), isOpen),
                                        complete: function () {
                                            if (!isOpen)
                                                $(this).css('height', 'auto');
                                        }
                                    });
                                } else {
                                    setNodeClass($(this).parent(), isOpen);
                                    el.slideToggle(duration);
                                }
                                e.preventDefault();
                            }
                            function setNodeClass(el, isOpen) {
                                if (isOpen) {
                                    el.removeClass('mtree-open').addClass('mtree-closed');
                                } else {
                                    el.removeClass('mtree-closed').addClass('mtree-open');
                                }
                            }

                            if ($.Velocity && listAnim) {
                                $.Velocity.Sequences.list = function (element, options, index, size) {
                                    $.Velocity.animate(element, {
                                        opacity: [
                                            1,
                                            0
                                        ],
                                        translateY: [
                                            0,
                                            -(index + 1)
                                        ]
                                    }, {
                                        delay: index * (duration / size / 2),
                                        duration: duration,
                                        easing: easing
                                    });
                                };
                            }
                            if ($('#' + this_id + ' .mtree').css('opacity') == 0) {
                                if ($.Velocity) {
                                    $('#' + this_id + ' .mtree').css('opacity', 1).children().css('opacity', 0).velocity('list');
                                } else {
                                    $('#' + this_id + ' .mtree').show(200);
                                }
                            }
                        }
                    }(jQuery, this, this.document));

                    $(document).ready(function () {
                        var mtree = $('#' + this_id + ' ul.mtree');
                        var skins = [
                            'bubba',
                            'skinny',
                            'transit',
                            'jet',
                            'nix'
                        ];
                        mtree.addClass(skins[0]);
                    });
                };

                //执行
                var treeDiv = $(item);
                var tree = draw(dataList);
                if(opts["title"]) {
                    var title = $('<p class="mtree-title"/>').text(opts["title"]).appendTo(treeDiv);
                    var colBtn = $('<span class="mtree-collapse-btn mtree-display">')
                        .appendTo(title);
                    colBtn.on("click", function(e){
                        $(this).toggleClass("mtree-display");

                        if($(this).hasClass("mtree-display")){
                            $('#' + this_id + ' ul.mtree').show(200);
                        } else {
                            $('#' + this_id + ' ul.mtree').hide(200);
                        }
                    });
                }
                treeDiv.append(tree);
                initEvt();
            });
        }
    });
})(jQuery);