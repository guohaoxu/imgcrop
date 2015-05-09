/**
 * imgcrop jQuery plugin
 * version 1.0
 * Copyright (c) 2015 guohao
 * https://github.com/guohaoxu/imgcrop
 */
/*jslint browser: true, devel: true, bitwise: true, eqeq: true, nomen: true, plusplus: true */
/*global jQuery */

(function ($) {
	'use strict';
	
	var abs = Math.abs,
		max = Math.max,
		min = Math.min,
		round = Math.round,
		
		imgcrop;
	
	function Imgcrop() {
		this._default = {
			init: false,	//是否一开始显示截取正方形，正方形长度是图片显示宽高的最小值的0.8
			views: [],		//[{view: "#imgView_m img", view_WH: 100}, {view: "#imgView_m2 img", view_WH: 50}]	显示预览截图的dom及长度
			onSelectChange: null,	//选取变化时回调
			onSelectEnd: null	//选取结束时回调
		};
	}
	
	$.extend(Imgcrop.prototype, {
		
		propertyName: "imgcrop",
		markerClassName: "hasImgcrop",
		_destroyImgcrop: function (target) {
			
			var $window = $(window),
				$doc = $(document),
				$body = $("body");
			
			target = $(target);
			if (!target.hasClass(this.markerClassName)) {
				return;
			}
			target.removeClass(this.markerClassName);
			$doc.off("." + target.propertyName);
			target.data("imgcrop_bg").hide();
			target.data("imgcrop").hide();
			target.data("imgcrop_border").hide();
			target.off("dragstart");
		},
		
		_attachImgcrop: function (target, options) {
			
			target = $(target);
			options = $.extend({}, this._default, options);
			if (target.hasClass(this.markerClassName)) {
				return;
			}
			target.addClass(this.markerClassName);
			
			var	$window = $(window),
				$doc = $(document),
				$body = $("body"),
				imgSrc = target.attr("src"),
				WH = 0,		//矩形宽度=高度
				ifMouseDown = false,
				ifDragImg = false,
				
				fix_t_l = false,
				fix_t_r = false,
				fix_b_l = false,
				fix_b_r = false,
				
				line_left = false,
				line_top = false,
				line_right = false,
				line_bottom = false,
				
				nowFace = {},
				factImg = {},
				
				ifBorder,	//边框线长度 1px
				
				s_top,	//矩形相对于图片的top
				s_left,	//矩形相对于图片的left
				
				click_black,
				hide_imgcrop,
				
				$elem = $('<div><div class="imgcrop-bg"></div><div class="imgcrop"><img src="' + imgSrc + "?v=" + Math.random() + '" src="" alt=""></div><div class="imgcrop-border"><span class="imgcrop-point-01"></span><span class="imgcrop-point-02"></span><span class="imgcrop-point-03"></span><span class="imgcrop-point-04"></span><span class="imgcrop-point-05"></span><span class="imgcrop-point-06"></span><span class="imgcrop-point-07"></span><span class="imgcrop-point-08"></span><span class="imgcrop-dashed-01"></span><span class="imgcrop-dashed-02"></span><span class="imgcrop-dashed-03"></span><span class="imgcrop-dashed-04"></span></div></div>');
			
			//绑定数据-预览图
			function showInfo() {
				var percent, i;
				nowFace.imgWid = target.width();
				nowFace.imgHei = target.height();
				nowFace.wid = nowFace.hei = target.data("imgcrop").width();
				nowFace.x1 = target.data("imgcrop").offset().left - target.offset().left;
				nowFace.y1 = target.data("imgcrop").offset().top - target.offset().top;
				nowFace.x2 = nowFace.x1 + nowFace.wid;
				nowFace.y2 = nowFace.y1 + nowFace.hei;

				percent = factImg.imgWid / nowFace.imgWid;
				factImg.wid = factImg.hei = round(nowFace.wid * percent);
				factImg.x1 = round(nowFace.x1 * percent);
				factImg.y1 = round(nowFace.y1 * percent);
				factImg.x2 = round(nowFace.x2 * percent);
				factImg.y2 = round(nowFace.y2 * percent);

				target.data({"imgcrop_x1": factImg.x1, "imgcrop_y1": factImg.y1, "imgcrop_WH": factImg.wid, "imgcrop_x2": factImg.x2, "imgcrop_y2": factImg.y2});
				if (options.views.length > 0) {
					for (i = 0; i < options.views.length; i++) {
						$(options.views[i].view).width(options.views[i].view_WH / nowFace.wid * nowFace.imgWid);
						$(options.views[i].view).height(options.views[i].view_WH / nowFace.hei * nowFace.imgHei);
						$(options.views[i].view).css("margin-left", -(options.views[i].view_WH / nowFace.wid * nowFace.x1));
						$(options.views[i].view).css("margin-top", -(options.views[i].view_WH / nowFace.hei * nowFace.y1));
					}
				}

				target.on("dragstart", false);
				target.data("imgcrop").css("user-select", "none").on("selectstart", false);
				target.data("imgcrop").children("img").css("user-select", "none").on("selectstart", false).on("dragstart", false);
				target.data("imgcrop_border").css("user-select", "none").on("selectstart", false);
				$body.css("user-select", "none").on("selectstart", false);

				s_top = target.data("imgcrop").offset().top - target.offset().top;
				s_left = target.data("imgcrop").offset().left - target.offset().left;
				
				
				if ($.isFunction(options.onSelectChange)) {
					options.onSelectChange.apply(target, []);
				}
			}

			//制作矩形
			function makeRect(e, fixPoint_x, fixPoint_y) {
				ifBorder = parseInt(target.data("imgcrop_border").css("borderRightWidth"), 10);
				WH = abs(e.pageX - fixPoint_x) < abs(e.pageY - fixPoint_y) ? abs(e.pageY - fixPoint_y) : abs(e.pageX - fixPoint_x);
				if (e.pageX > fixPoint_x && e.pageY < fixPoint_y) {
					if (fixPoint_y - WH < target.offset().top) {
						WH =  fixPoint_y - target.offset().top;
					}
					if (fixPoint_x + WH > target.offset().left + target.width()) {
						WH = target.offset().left + target.width() - fixPoint_x;
					}

					target.data("imgcrop").css({ "top": fixPoint_y - WH, "left": fixPoint_x });
					target.data("imgcrop_border").css({ "top": fixPoint_y - WH - ifBorder, "left": fixPoint_x - ifBorder });
				} else if (e.pageX > fixPoint_x && e.pageY > fixPoint_y) {
					if (fixPoint_y + WH > target.offset().top + target.height()) {
						WH =  target.offset().top + target.height() - fixPoint_y;
					}
					if (fixPoint_x + WH > target.offset().left + target.width()) {
						WH = target.offset().left + target.width() - fixPoint_x;
					}
					target.data("imgcrop").css({ "top": fixPoint_y, "left": fixPoint_x });
					target.data("imgcrop_border").css({ "top": fixPoint_y - ifBorder, "left": fixPoint_x - ifBorder });
				} else if (e.pageX < fixPoint_x && e.pageY > fixPoint_y) {
					if (fixPoint_y + WH > target.offset().top + target.height()) {
						WH =  target.offset().top + target.height() - fixPoint_y;
					}
					if (fixPoint_x - WH < target.offset().left) {
						WH = fixPoint_x - target.offset().left;
					}
					target.data("imgcrop").css({ "top": fixPoint_y, "left": fixPoint_x - WH });
					target.data("imgcrop_border").css({ "top": fixPoint_y - ifBorder, "left": fixPoint_x - WH - ifBorder });
				} else if (e.pageX < fixPoint_x && e.pageY < fixPoint_y) {
					if (fixPoint_y - WH < target.offset().top) {
						WH =  fixPoint_y - target.offset().top;
					}
					if (fixPoint_x - WH < target.offset().left) {
						WH = fixPoint_x - target.offset().left;
					}
					target.data("imgcrop").css({ "top": fixPoint_y - WH, "left": fixPoint_x - WH });
					target.data("imgcrop_border").css({ "top": fixPoint_y - WH - ifBorder, "left": fixPoint_x - WH - ifBorder });
				}
				target.data("imgcrop").css({ "width": WH, "height": WH });
				target.data("imgcrop_border").css({ "width": WH, "height": WH });
				target.data("imgcrop").children("img").css({
					"top": target.offset().top - target.data("imgcrop").offset().top,
					"left": target.offset().left - target.data("imgcrop").offset().left
				});
				showInfo(target);
			}

			//拖拽矩形
			function dragImg(e) {
				var initX = target.get(0).initX,
					initY = target.get(0).initY,
					disX = e.pageX - target.get(0).dragX,
					disY = e.pageY - target.get(0).dragY;
				target.data("imgcrop").css({ "left": initX + disX, "top": initY + disY });
				target.data("imgcrop_border").css({ "left": initX + disX - ifBorder, "top": initY + disY - ifBorder});
				if (target.data("imgcrop").offset().left + WH > target.offset().left + target.width()) {
					target.data("imgcrop").css("left", target.offset().left + target.width() - WH);
					target.data("imgcrop_border").css("left", target.offset().left + target.width() - WH - ifBorder);
				}
				if (target.data("imgcrop").offset().left < target.offset().left) {
					target.data("imgcrop").css("left", target.offset().left);
					target.data("imgcrop_border").css("left", target.offset().left - ifBorder);
				}
				if (target.data("imgcrop").offset().top + WH > target.offset().top + target.height()) {
					target.data("imgcrop").css("top", target.offset().top + target.height() - WH);
					target.data("imgcrop_border").css("top", target.offset().top + target.height() - WH - ifBorder);
				}
				if (target.data("imgcrop").offset().top < target.offset().top) {
					target.data("imgcrop").css("top", target.offset().top);
					target.data("imgcrop_border").css("top", target.offset().top - ifBorder);
				}
				target.data("imgcrop").children("img").css({
					"top": target.offset().top - target.data("imgcrop").offset().top,
					"left": target.offset().left - target.data("imgcrop").offset().left
				});
				showInfo(target);
			}
			
			//固定定位层下的图片-窗口大小变化
			function doFix(str) {
				if (str == "fixed") {
					$window.on("scroll", function () {
						target.data("imgcrop").css({"left": target.offset().left + s_left, "top": target.offset().top + s_top});
						target.data("imgcrop_border").css({"left": target.offset().left + s_left - ifBorder, "top": target.offset().top + s_top - ifBorder});
						target.data("imgcrop_bg").css({
							"left": target.offset().left,
							"top": target.offset().top
						});
					});
				} else if (str == "resize") {
					target.data("imgcrop").css({"left": target.offset().left + s_left, "top": target.offset().top + s_top});
					target.data("imgcrop_border").css({"left": target.offset().left + s_left - ifBorder, "top": target.offset().top + s_top - ifBorder});
					target.data("imgcrop_bg").css({
						"left": target.offset().left,
						"top": target.offset().top
					});
				}
				
			}
			
			//鼠标点击
			function docDown(e) {
				
				if (e.button === 0 || (e.button === 1 && document.all && !document.addEventListener)) {
					if (e.pageX > target.offset().left && e.pageX < target.offset().left + target.width() && e.pageY > target.offset().top && e.pageY < target.offset().top + target.height()) {
						if (WH === 0) {
							ifMouseDown = true;
							target.data("imgcrop_img").width(target.width());
							target.data("imgcrop").css({"left": e.pageX, "top": e.pageY, "width": 0, "height": 0}).show();
							target.data("imgcrop_border").css({"left": e.pageX, "top": e.pageY, "width": 0, "height": 0}).show();
							target.data("imgcrop_bg").css({
								"left": target.offset().left,
								"top": target.offset().top,
								"width": target.width(),
								"height": target.height()
							}).show();
							
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
						} else if (e.pageX > target.data("imgcrop").offset().left + 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5 && e.pageY > target.data("imgcrop").offset().top + 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5) {
							ifDragImg = true;
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).dragX = e.pageX;
							target.get(0).dragY = e.pageY;
						} else if (e.pageX > target.data("imgcrop").offset().left && e.pageX < target.data("imgcrop").offset().left + 5 && e.pageY > target.data("imgcrop").offset().top + 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5) {
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).tempWH = WH;
							fix_t_r = true;
							line_left = true;
						} else if (e.pageY > target.data("imgcrop").offset().top && e.pageY < target.data("imgcrop").offset().top + 5 && e.pageX > target.data("imgcrop").offset().left + 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5) {
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).tempWH = WH;
							fix_b_l = true;
							line_top = true;
						} else if (e.pageX > target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() && e.pageY > target.data("imgcrop").offset().top + 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5) {
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).tempWH = WH;
							fix_t_l = true;
							line_right = true;
						} else if (e.pageY > target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() && e.pageX > target.data("imgcrop").offset().left + 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5) {
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).tempWH = WH;
							fix_t_l = true;
							line_bottom = true;
						} else if (fix_t_l || fix_t_r || fix_b_l || fix_b_r) {
							target.get(0).initX = target.data("imgcrop").offset().left;
							target.get(0).initY = target.data("imgcrop").offset().top;
							target.get(0).tempWH = WH;
						} else {
							click_black = true;
							hide_imgcrop = true;
							target.get(0).initX = e.pageX;
							target.get(0).initY = e.pageY;
						}
					} else if (fix_t_l || fix_t_r || fix_b_l || fix_b_r) {
						target.get(0).initX = target.data("imgcrop").offset().left;
						target.get(0).initY = target.data("imgcrop").offset().top;
						target.get(0).tempWH = WH;
					}
				}
			}

			//鼠标指针
			function doCursor(e) {
				if (WH > 0) {
					if (line_left) {
						$body.css("cursor", "w-resize");
					} else if (line_top) {
						$body.css("cursor", "n-resize");
					} else if (line_right) {
						$body.css("cursor", "e-resize");
					} else if (line_bottom) {
						$body.css("cursor", "s-resize");
					} else if (e.pageX > target.data("imgcrop").offset().left + 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5 && e.pageY > target.data("imgcrop").offset().top + 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5) {
						$body.css("cursor", "move");
					} else if (e.pageX > target.data("imgcrop").offset().left + 1 && e.pageX < target.data("imgcrop").offset().left + 5) {
						$body.css("cursor", "w-resize");
						if (fix_t_r) {
							$body.css("cursor", "w-resize");
						}
					} else if (e.pageX > target.data("imgcrop").offset().left + target.data("imgcrop").width() - 5 && e.pageX < target.data("imgcrop").offset().left + target.data("imgcrop").width() - 1) {
						$body.css("cursor", "e-resize");
						if (fix_t_l) {
							$body.css("cursor", "e-resize");
						}
					} else if (e.pageY > target.data("imgcrop").offset().top + 1 && e.pageY < target.data("imgcrop").offset().top + 5) {
						$body.css("cursor", "n-resize");
						if (fix_b_l) {
							$body.css("cursor", "n-resize");
						}
					} else if (e.pageY > target.data("imgcrop").offset().top + target.data("imgcrop").height() - 5 && e.pageY < target.data("imgcrop").offset().top + target.data("imgcrop").height() - 1) {
						$body.css("cursor", "s-resize");
						if (fix_b_l) {
							$body.css("cursor", "s-resize");
						}
					} else if (fix_t_l) {
						$body.css("cursor", "se-resize");
					} else {
						$body.css("cursor", "");
					}
				}
			}
			
			//鼠标移动
			function docMove(e) {
				if (click_black) {
					hide_imgcrop = false;
					makeRect(e, target.get(0).initX, target.get(0).initY);
				}
				if (ifMouseDown) {
					makeRect(e, target.get(0).initX, target.get(0).initY);
				} else if (ifDragImg) {
					dragImg(e);
				} else if (fix_b_l) {
					makeRect(e, target.get(0).initX, target.get(0).initY + target.get(0).tempWH);
				} else if (fix_b_r) {
					makeRect(e, target.get(0).initX + target.get(0).tempWH, target.get(0).initY + target.get(0).tempWH);
				} else if (fix_t_r) {
					makeRect(e, target.get(0).initX + target.get(0).tempWH, target.get(0).initY);
				} else if (fix_t_l) {
					makeRect(e, target.get(0).initX, target.get(0).initY);
				}
				if (WH > 0) {
					doCursor(e);
				}
			}

			//鼠标松开
			function docUp() {
				if (hide_imgcrop) {
					target.data("imgcrop_bg").hide();
					target.data("imgcrop").hide();
					target.data("imgcrop_border").hide();
					WH = 0;
				}
				hide_imgcrop = false;
				click_black = false;
				ifMouseDown = false;
				ifDragImg = false;
				fix_t_l = false;
				fix_t_r = false;
				fix_b_l = false;
				fix_b_r = false;
				line_left = false;
				line_top = false;
				line_right = false;
				line_bottom = false;
				$body.css("cursor", "").css("user-select", "").off("selectstart");
				
				if ($.isFunction(options.onSelectEnd)) {
					options.onSelectEnd.apply(target, []);
				}
			}
			
			//添加事件
			function addEvent() {
				$doc.on("mousedown." + target.propertyName, docDown);
				$doc.on("mouseup." + target.propertyName, docUp);
				$doc.on("mousemove." + target.propertyName, docMove);
				
				target.data("imgcrop_p01").mousedown(function () { fix_b_r = true; });
				target.data("imgcrop_p02").mousedown(function () { fix_b_l = true; });
				target.data("imgcrop_p03").mousedown(function () { fix_b_l = true; });
				target.data("imgcrop_p04").mousedown(function () { fix_t_r = true; });
				target.data("imgcrop_p05").mousedown(function () { fix_t_l = true; });
				target.data("imgcrop_p06").mousedown(function () { fix_t_r = true; });
				target.data("imgcrop_p07").mousedown(function () { fix_t_l = true; });
				target.data("imgcrop_p08").mousedown(function () { fix_t_l = true; });
				
				if (options.init) {
					target.data("imgcrop").show();
					target.data("imgcrop_border").show();
					target.data("imgcrop_bg").show();
					
					ifBorder = parseInt(target.data("imgcrop_border").css("borderRightWidth"), 10);
					
					var initWH = min(target.width(), target.height()) * 0.8,
						initTop = target.offset().top + ((target.height() - initWH) >> 1),
						initLeft = target.offset().left + ((target.width() - initWH) >> 1);
					
					target.data("imgcrop_img").width(target.width());
					target.data("imgcrop").css({"left": initLeft, "top": initTop, "width": initWH, "height": initWH});
					target.data("imgcrop_border").css({"left": initLeft - ifBorder, "top": initTop - ifBorder, "width": initWH, "height": initWH});
					target.data("imgcrop_bg").css({
						"left": target.offset().left,
						"top": target.offset().top,
						"width": target.width(),
						"height": target.height()
					});
					target.data("imgcrop").children("img").css({
						"top": target.offset().top - target.data("imgcrop").offset().top,
						"left": target.offset().left - target.data("imgcrop").offset().left
					});
					WH = initWH;
					showInfo();
				}
				
				//检测图片是否位于固定层上
				target.parents().each(function () {
					if ($(this).css("position") == "fixed") {
						doFix("fixed");
					}
				});
				$window.resize(function () {
					doFix("resize");
				});
			}
			
			//初始化
			function init() {
				
				$body.append($elem);
				
				target.data("imgcrop_bg", $elem.find(".imgcrop-bg"));
				target.data("imgcrop", $elem.find(".imgcrop"));
				target.data("imgcrop_img", $elem.find(".imgcrop").children("img"));
				target.data("imgcrop_border", $elem.find(".imgcrop-border"));
				target.data("imgcrop_p01", $elem.find(".imgcrop-point-01"));
				target.data("imgcrop_p02", $elem.find(".imgcrop-point-02"));
				target.data("imgcrop_p03", $elem.find(".imgcrop-point-03"));
				target.data("imgcrop_p04", $elem.find(".imgcrop-point-04"));
				target.data("imgcrop_p05", $elem.find(".imgcrop-point-05"));
				target.data("imgcrop_p06", $elem.find(".imgcrop-point-06"));
				target.data("imgcrop_p07", $elem.find(".imgcrop-point-07"));
				target.data("imgcrop_p08", $elem.find(".imgcrop-point-08"));
				
				//获取目标图片原始宽高
				var tempImg = new Image();
				tempImg.onload = function () {
					factImg.imgWid = tempImg.width;
					factImg.imgHei = tempImg.height;
					
					addEvent();
				};
				tempImg.src = imgSrc;
			}
			
			init();
			
		}
		
	});
	
	imgcrop = $.imgcrop = new Imgcrop();
	
	$.fn.imgcrop = function (options) {
		return this.each(function () {
			if (typeof options == 'string') {
				if (!imgcrop['_' + options + 'Imgcrop']) {
					throw 'Unknown imgcrop method: ' + options;
				}
				imgcrop['_' + options + 'Imgcrop'].apply(imgcrop, [this]);
			} else {
				imgcrop._attachImgcrop(this, options || {});
			}
		});
	};
	
}(jQuery));
