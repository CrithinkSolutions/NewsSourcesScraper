/* Do not modify this file directly. It is compiled from other files. */
!function(){function t(){if(this.complete){var e=this.getAttribute("data-lazy-src");if(e&&this.src!==e)this.addEventListener("onload",t);else{var d=this.width,n=this.height;d&&d>0&&n&&n>0&&(this.setAttribute("width",d),this.setAttribute("height",n),i(this))}}else this.addEventListener("onload",t)}var e=function(){for(var e=document.querySelectorAll("img[data-recalc-dims]"),i=0;i<e.length;i++)t.call(e[i])},i=function(t){t.removeAttribute("data-recalc-dims"),t.removeAttribute("scale")};"undefined"!=typeof window&&"undefined"!=typeof document&&("loading"===document.readyState?document.addEventListener("DOMContentLoaded",e):e()),document.body.addEventListener("is.post-load",e)}();;
function advanced_ads_sticky_check_position_fixed() {
	var container = document.body;
	if (document.createElement && container && container.appendChild && container.removeChild) {
		var el = document.createElement( 'div' );
		if ( ! el.getBoundingClientRect) {
			return null; }
		el.innerHTML = 'x';
		el.style.cssText = 'position:fixed;top:100px;';
		container.appendChild( el );
		var originalHeight = container.style.height,
				originalScrollTop = container.scrollTop;
		// In IE<=7, the window's upper-left is at 2,2 (pixels) with respect to the true client.
		// surprisely, in IE8, the window's upper-left is at -2, -2 (pixels), but other elements
		// tested is just right, so we need adjust this.
		// https://groups.google.com/forum/?fromgroups#!topic/comp.lang.javascript/zWJaFM5gMIQ
		// https://bugzilla.mozilla.org/show_bug.cgi?id=174397
		var extraTop = parseInt( document.documentElement.getBoundingClientRect().top, 10 );
		extraTop = extraTop > 0 ? extraTop : 0;
		container.style.height = '3000px';
		container.scrollTop = 500;
		var elementTop = parseInt( el.getBoundingClientRect().top, 10 );
		container.style.height = originalHeight;
		var isSupported = (elementTop - extraTop) === 100;
		container.removeChild( el );
		container.scrollTop = originalScrollTop;
		return isSupported;
	}
	return null;
};

// decode sticky ads right after consent is given.
document.addEventListener('advanced_ads_privacy', function (event) {
	if (event.detail.state !== 'accepted' && event.detail.state !== 'not_needed') {
		return;
	}

	window.advanced_ads_sticky_settings.placements.forEach(function (value) {
		document.querySelectorAll('script[type="text/plain"][data-tcf="waiting-for-consent"][data-placement="' + value + '"]').forEach(advads.privacy.decode_ad);
	});
});

jQuery( document ).ready(function($) {
	var resize_timeout = null, $el, previous_width = $( window ).width();


	// Update position when viewport size changes.
	function resize_handler() {
		if ( resize_timeout ) clearTimeout( resize_timeout );
		resize_timeout = setTimeout( function() {
			var new_width = $( window ).width();
			if ( previous_width === new_width ) {
				// Return if the viewport has not actually changed
				// Scroll event triggered this due to the position of the address bar.
				return;
			}
			previous_width  = new_width;

			if ( typeof advanced_ads_sticky_items !== 'undefined' ) {
				$.each( advanced_ads_sticky_items, function( wrapper_id, data ) {
					$el = $( '#' + wrapper_id );
					// Apply initial 'position: absolute' styles if 'position: absolute' was transformed to 'position: fixed'
					// using the 'advads.fix_element' function.
					$el.prop( 'style', data.initial_css );

					// Fix to windows position and/or center vertically again.
					data.modifying_func();
				} );
			}
		}, 1000 );
	}

	if ( 'undefined' === typeof advanced_ads_responsive || ! parseInt( advanced_ads_responsive.reload_on_resize, 10 ) ) {
		// If the "Reload ads on resize" feature of the Responsive add-on is not used.
		jQuery( window ).on( 'resize', resize_handler );
	}

	//Remove 'position: fixed' if not supported, if the feature enabled in the settings.
	if ( typeof advanced_ads_sticky_settings === 'undefined' || ! advanced_ads_sticky_settings.check_position_fixed ) {
		return;
	}

	// story scroll enable value so it isn’t checked multiple times per page view
	var advanced_ads_sticky_position_fixed_supported = '';
	var allowed_offset = $( document.body ).is( '.admin-bar' ) ? $( '#wpadminbar' ).height() : 0;

	/**
	 * Remove all position related inline styles.
	 *
	 * @param {object=} $stickyads Optional jQuery object.
	 */
	function remove_css( $stickyads ) {
		// if position fixed is unsupported
		if ( advanced_ads_sticky_position_fixed_supported === false ) {
			$( window ).off( 'resize', resize_handler );
			$stickyads = $stickyads || jQuery( '.' + advanced_ads_sticky_settings.sticky_class );
			setTimeout( function() {
				$stickyads.each( function( key, value ) {
					var $stickyad = $( value );
					if ( window.advanced_ads_sticky_items[ $stickyad.attr( 'id' ) ].can_convert_to_abs ) {
						$stickyad.css( 'position', 'absolute' );
					} else {
						$stickyad.css( 'position', '' ).css( 'top', '' ).css( 'right', '' ).css( 'bottom', '' ).css( 'left', '' ).css( 'margin-left', '' )
							.css( 'transform', 'none' ).css( '-webkit-transform', 'none' ).css( '-moz-transform', 'none' ).css( '-ms-transform', 'none' );
					}
				});
			} );
		}
	}


	function scroll_handler() {
		clearTimeout( $.data( this, 'scrollTimer' ) );
		// wait 100ms when scrolling before checking
		$.data(this, 'scrollTimer', setTimeout(function() {
			// don’t do anything if scroll position is 0 == top
			// or admin bar has not been scrolled.
			if($( document ).scrollTop() <= allowed_offset ) { return; }
			// check if position fixed is supported; story result in a variable so test runs only once
			if(advanced_ads_sticky_position_fixed_supported == ''){
				advanced_ads_sticky_position_fixed_supported = advanced_ads_sticky_check_position_fixed();
				clearTimeout( $.data( this, 'scrollTimer' ) );
				$( window ).off( 'scroll', scroll_handler );
			}
			// rewrite sticky ads
			remove_css();
		}, 100));
	}

	if ( navigator.userAgent.indexOf( 'Opera Mini' ) > -1 ) {
		//Opera mini does not support 'scroll' event.
		advanced_ads_sticky_position_fixed_supported = false;
		remove_css();
	} else {
		$( window ).scroll( scroll_handler );
	}


	// When cache-busting inserts new item.
	if ( typeof advanced_ads_pro === 'object' && advanced_ads_pro !== null ) {
		advanced_ads_pro.postscribeObservers.add( function (event) {
			if ( event.event === 'postscribe_done' && event.ref && event.ad ) {
				var $stickyad = jQuery( event.ref ).children( '.' + advanced_ads_sticky_settings.sticky_class );
				if ( $stickyad.length ) {
					remove_css( $stickyad );
				}
			}
		} );
	}
});
;
/*! This file is auto-generated */
!function(I){I.fn.hoverIntent=function(e,t,n){function r(e){o=e.pageX,v=e.pageY}var o,v,i,u,s={interval:100,sensitivity:6,timeout:0},s="object"==typeof e?I.extend(s,e):I.isFunction(t)?I.extend(s,{over:e,out:t,selector:n}):I.extend(s,{over:e,out:e,selector:t}),h=function(e,t){if(t.hoverIntent_t=clearTimeout(t.hoverIntent_t),Math.sqrt((i-o)*(i-o)+(u-v)*(u-v))<s.sensitivity)return I(t).off("mousemove.hoverIntent",r),t.hoverIntent_s=!0,s.over.apply(t,[e]);i=o,u=v,t.hoverIntent_t=setTimeout(function(){h(e,t)},s.interval)},t=function(e){var n=I.extend({},e),o=this;o.hoverIntent_t&&(o.hoverIntent_t=clearTimeout(o.hoverIntent_t)),"mouseenter"===e.type?(i=n.pageX,u=n.pageY,I(o).on("mousemove.hoverIntent",r),o.hoverIntent_s||(o.hoverIntent_t=setTimeout(function(){h(n,o)},s.interval))):(I(o).off("mousemove.hoverIntent",r),o.hoverIntent_s&&(o.hoverIntent_t=setTimeout(function(){var e,t;e=n,(t=o).hoverIntent_t=clearTimeout(t.hoverIntent_t),t.hoverIntent_s=!1,s.out.apply(t,[e])},s.timeout)))};return this.on({"mouseenter.hoverIntent":t,"mouseleave.hoverIntent":t},s.selector)}}(jQuery);;
/*jslint browser: true, white: true, this: true, long: true */
/*global console,jQuery,megamenu,window,navigator*/

/*! Max Mega Menu jQuery Plugin */
(function ( $ ) {
    "use strict";

    $.maxmegamenu = function(menu, options) {
        var plugin = this;
        var $menu = $(menu);
        var $toggle_bar = $menu.siblings(".mega-menu-toggle");
        var html_body_class_timeout;

        var defaults = {
            event: $menu.attr("data-event"),
            effect: $menu.attr("data-effect"),
            effect_speed: parseInt($menu.attr("data-effect-speed")),
            effect_mobile: $menu.attr("data-effect-mobile"),
            effect_speed_mobile: parseInt($menu.attr("data-effect-speed-mobile")),
            panel_width: $menu.attr("data-panel-width"),
            panel_inner_width: $menu.attr("data-panel-inner-width"),
            mobile_force_width: $menu.attr("data-mobile-force-width"),
            mobile_overlay: $menu.attr("data-mobile-overlay"),
            mobile_state: $menu.attr("data-mobile-state"),
            second_click: $menu.attr("data-second-click"),
            vertical_behaviour: $menu.attr("data-vertical-behaviour"),
            document_click: $menu.attr("data-document-click"),
            breakpoint: $menu.attr("data-breakpoint"),
            unbind_events: $menu.attr("data-unbind"),
            hover_intent_timeout: $menu.attr("data-hover-intent-timeout"),
            hover_intent_interval: $menu.attr("data-hover-intent-interval")
        };

        plugin.settings = {};

        var items_with_submenus = $("li.mega-menu-megamenu.mega-menu-item-has-children," +
                                    "li.mega-menu-flyout.mega-menu-item-has-children," +
                                    "li.mega-menu-tabbed > ul.mega-sub-menu > li.mega-menu-item-has-children," +
                                    "li.mega-menu-flyout li.mega-menu-item-has-children", menu);

        var collapse_children_parents = $("li.mega-menu-megamenu li.mega-menu-item-has-children.mega-collapse-children > a.mega-menu-link", menu);

        plugin.addAnimatingClass = function(element) {
            if (plugin.settings.effect === "disabled") {
                return;
            }

            $(".mega-animating").removeClass("mega-animating");

            var timeout = plugin.settings.effect_speed + parseInt(megamenu.timeout, 10);

            element.addClass("mega-animating");

            setTimeout(function() {
               element.removeClass("mega-animating");
            }, timeout );
        };

        plugin.hideAllPanels = function() {
            $(".mega-toggle-on > a.mega-menu-link", $menu).each(function() {
                plugin.hidePanel($(this), false);
            });
        };

        plugin.expandMobileSubMenus = function() {
            $(".mega-menu-item-has-children.mega-expand-on-mobile > a.mega-menu-link", $menu).each(function() {
                plugin.showPanel($(this));
            });

            if ( plugin.settings.mobile_state == 'expand_all' ) {
                $(".mega-menu-item-has-children > a.mega-menu-link", $menu).each(function() {
                    plugin.showPanel($(this));
                });
            }

            if ( plugin.settings.mobile_state == 'expand_active' ) {
                $("li.mega-current-menu-ancestor.mega-menu-item-has-children > a.mega-menu-link," + 
                  "li.mega-current-menu-item.mega-menu-item-has-children > a.mega-menu-link" + 
                  "li.mega-current-menu-parent.mega-menu-item-has-children > a.mega-menu-link" + 
                  "li.mega-current_page_ancestor.mega-menu-item-has-children > a.mega-menu-link" + 
                  "li.mega-current_page_item.mega-menu-item-has-children > a.mega-menu-link", $menu).each(function() {
                    plugin.showPanel($(this));
                });
            }
        }

        plugin.hideSiblingPanels = function(anchor, immediate) {
            anchor.parent().parent().find(".mega-toggle-on").children("a.mega-menu-link").each(function() { // all open children of open siblings
                plugin.hidePanel($(this), immediate);
            });
        };

        plugin.isDesktopView = function() {
            return Math.max(window.outerWidth, $(window).width()) > plugin.settings.breakpoint; // account for scrollbars
        };

        plugin.isMobileView = function() {
            return !plugin.isDesktopView();
        };

        plugin.showPanel = function(anchor) {
            anchor.parent().triggerHandler("before_open_panel");

            anchor.attr("aria-expanded", "true");

            $(".mega-animating").removeClass("mega-animating");

            if (plugin.isMobileView() && anchor.parent().hasClass("mega-hide-sub-menu-on-mobile")) {
                return;
            }

            if (plugin.isDesktopView() && ( $menu.hasClass("mega-menu-horizontal") || $menu.hasClass("mega-menu-vertical") ) && !anchor.parent().hasClass("mega-collapse-children")) {
                plugin.hideSiblingPanels(anchor, true);
            }

            if ((plugin.isMobileView() && $menu.hasClass("mega-keyboard-navigation")) || plugin.settings.vertical_behaviour === "accordion") {
                plugin.hideSiblingPanels(anchor, false);
            }

            plugin.calculateDynamicSubmenuWidths(anchor);

            // apply jQuery transition (only if the effect is set to "slide", other transitions are CSS based)
            if ( anchor.parent().hasClass("mega-collapse-children") || plugin.settings.effect === "slide" || 
                ( plugin.isMobileView() && ( plugin.settings.effect_mobile === "slide" || plugin.settings.effect_mobile === "slide_left" || plugin.settings.effect_mobile === "slide_right" ) )
               ) {
                var speed = plugin.isMobileView() ? plugin.settings.effect_speed_mobile : plugin.settings.effect_speed;

                anchor.siblings(".mega-sub-menu").css("display", "none").animate({"height":"show", "paddingTop":"show", "paddingBottom":"show", "minHeight":"show"}, speed, function() {
                    $(this).css("display", "");
                });
            }

            anchor.parent().addClass("mega-toggle-on").triggerHandler("open_panel");
        };
        
        plugin.hidePanel = function(anchor, immediate) {
            anchor.parent().triggerHandler("before_close_panel");

            anchor.attr("aria-expanded", "false");

            if ( anchor.parent().hasClass("mega-collapse-children") || ( ! immediate && plugin.settings.effect === "slide" ) || 
                ( plugin.isMobileView() && ( plugin.settings.effect_mobile === "slide" || plugin.settings.effect_mobile === "slide_left" || plugin.settings.effect_mobile === "slide_right" ) )
               ) {
                var speed = plugin.isMobileView() ? plugin.settings.effect_speed_mobile : plugin.settings.effect_speed;

                anchor.siblings(".mega-sub-menu").animate({"height":"hide", "paddingTop":"hide", "paddingBottom":"hide", "minHeight":"hide"}, speed, function() {
                    anchor.siblings(".mega-sub-menu").css("display", "");
                    anchor.parent().removeClass("mega-toggle-on").triggerHandler("close_panel");
                });

                return;
            }

            if (immediate) {
                anchor.siblings(".mega-sub-menu").css("display", "none").delay(plugin.settings.effect_speed).queue(function(){
                    $(this).css("display", "").dequeue();
                });
            }

            // pause video widget videos
            anchor.siblings(".mega-sub-menu").find(".widget_media_video video").each(function() {
                this.player.pause();
            });

            anchor.parent().removeClass("mega-toggle-on").triggerHandler("close_panel");
            plugin.addAnimatingClass(anchor.parent());
        };

        plugin.calculateDynamicSubmenuWidths = function(anchor) {
            // apply dynamic width and sub menu position (only to top level mega menus)
            if (anchor.parent().hasClass("mega-menu-megamenu") && anchor.parent().parent().hasClass("max-mega-menu") && plugin.settings.panel_width && $(plugin.settings.panel_width).length > 0) {
                if (plugin.isDesktopView()) {
                    var submenu_offset = $menu.offset();
                    var target_offset = $(plugin.settings.panel_width).offset();

                    anchor.siblings(".mega-sub-menu").css({
                        width: $(plugin.settings.panel_width).outerWidth(),
                        left: (target_offset.left - submenu_offset.left) + "px"
                    });
                } else {
                    anchor.siblings(".mega-sub-menu").css({
                        width: "",
                        left: ""
                    });
                }
            }

            // apply inner width to sub menu by adding padding to the left and right of the mega menu
            if (anchor.parent().hasClass("mega-menu-megamenu") && anchor.parent().parent().hasClass("max-mega-menu") && plugin.settings.panel_inner_width && $(plugin.settings.panel_inner_width).length > 0) {
                var target_width = 0;

                if ($(plugin.settings.panel_inner_width).length) {
                    // jQuery selector
                    target_width = parseInt($(plugin.settings.panel_inner_width).width(), 10);
                } else {
                    // we"re using a pixel width
                    target_width = parseInt(plugin.settings.panel_inner_width, 10);
                }

                var submenu_width = parseInt(anchor.siblings(".mega-sub-menu").innerWidth(), 10);

                if (plugin.isDesktopView() && target_width > 0 && target_width < submenu_width) {
                    anchor.siblings(".mega-sub-menu").css({
                        "paddingLeft": (submenu_width - target_width) / 2 + "px",
                        "paddingRight": (submenu_width - target_width) / 2 + "px"
                    });
                } else {
                    anchor.siblings(".mega-sub-menu").css({
                        "paddingLeft": "",
                        "paddingRight": ""
                    });
                }
            }
        };

        plugin.bindClickEvents = function() {
            var dragging = false;

            $(document).on({
                "touchmove": function(e) { dragging = true; },
                "touchstart": function(e) { dragging = false; }
            });

            $(document).on("click touchend", function(e) { // hide menu when clicked away from
                if (!dragging && plugin.settings.document_click === "collapse" && ! $(e.target).closest(".max-mega-menu li").length && ! $(e.target).closest(".mega-menu-toggle").length ) {
                    plugin.hideAllPanels();
                    plugin.hideMobileMenu();
                }
                dragging = false;
            });

            var clickable_parents = $("> a.mega-menu-link", items_with_submenus).add(collapse_children_parents);

            clickable_parents.on("touchend.megamenu", function(e) {
                plugin.unbindHoverEvents();
                plugin.unbindHoverIntentEvents();
            });

            clickable_parents.not("[data-has-click-event]").on("click.megamenu", function(e) {
                if (plugin.isDesktopView() && $(this).parent().hasClass("mega-toggle-on") && $(this).parent().parent().parent().hasClass("mega-menu-tabbed") ) {
                    if (plugin.settings.second_click === "go") {
                        return;
                    } else {
                        e.preventDefault();
                        return;
                    }
                }
                if (dragging) {
                    return;
                }
                if (plugin.isMobileView() && $(this).parent().hasClass("mega-hide-sub-menu-on-mobile")) {
                    return; // allow all clicks on parent items when sub menu is hidden on mobile
                }
                if ((plugin.settings.second_click === "go" || $(this).parent().hasClass("mega-click-click-go")) && $(this).attr("href") !== undefined) { // check for second click
                    if (!$(this).parent().hasClass("mega-toggle-on")) {
                        e.preventDefault();
                        plugin.showPanel($(this));
                    }
                } else {
                    e.preventDefault();

                    if ($(this).parent().hasClass("mega-toggle-on")) {
                        plugin.hidePanel($(this), false);
                    } else {
                        plugin.showPanel($(this));
                    }
                }
            });

            collapse_children_parents.each(function() {
                $(this).attr('data-has-click-event', 'true');
            });
        };

        plugin.bindHoverEvents = function() {
            items_with_submenus.on({
                "mouseenter.megamenu" : function() {
                    plugin.unbindClickEvents();
                    if (! $(this).hasClass("mega-toggle-on")) {
                        plugin.showPanel($(this).children("a.mega-menu-link"));
                    }
                },
                "mouseleave.megamenu" : function() {
                    if ($(this).hasClass("mega-toggle-on") && ! $(this).hasClass("mega-disable-collapse") && ! $(this).parent().parent().hasClass("mega-menu-tabbed")) {
                        plugin.hidePanel($(this).children("a.mega-menu-link"), false);
                    }
                }
            });
        };

        plugin.bindHoverIntentEvents = function() {
            items_with_submenus.hoverIntent({
                over: function () {
                    plugin.unbindClickEvents();
                    if (! $(this).hasClass("mega-toggle-on")) {
                        plugin.showPanel($(this).children("a.mega-menu-link"));
                    }
                },
                out: function () {
                    if ($(this).hasClass("mega-toggle-on") && ! $(this).hasClass("mega-disable-collapse") && ! $(this).parent().parent().hasClass("mega-menu-tabbed")) {
                        plugin.hidePanel($(this).children("a.mega-menu-link"), false);
                    }
                },
                timeout: plugin.settings.hover_intent_timeout,
                interval: plugin.settings.hover_intent_interval
            });
        };

        plugin.bindKeyboardEvents = function() {
            var tab_key = 9;
            var escape_key = 27;
            var enter_key = 13;
            var left_arrow_key = 37;
            var right_arrow_key = 39;
            var space_key = 32;

            $menu.parent().on("keyup.megamenu", function(e) {
                var keyCode = e.keyCode || e.which;

                if (keyCode === tab_key) {
                    $menu.parent().addClass("mega-keyboard-navigation");
                }
            });

            $menu.parent().on("keydown.megamenu", function(e) {
                var keyCode = e.keyCode || e.which;
                var active_link = $(e.target);

                if ( keyCode === space_key && active_link.is(".mega-menu-link") && $menu.parent().hasClass("mega-keyboard-navigation") ) {
                    e.preventDefault();

                    // pressing space on a parent item will always toggle the sub menu
                    if ( active_link.parent().is(items_with_submenus) ) {
                        if ( active_link.parent().hasClass("mega-toggle-on") && ! active_link.parent().parent().parent().hasClass("mega-menu-tabbed") ) {
                            plugin.hidePanel(active_link);
                        } else {
                            plugin.showPanel(active_link);
                        }
                    }
                }
            });

            $menu.parent().on("keyup.megamenu", function(e) {
                var keyCode = e.keyCode || e.which;
                var active_link = $(e.target);
                
                if ( keyCode === tab_key && $menu.parent().hasClass("mega-keyboard-navigation") ) {
                    if ( active_link.parent().is(items_with_submenus) && active_link.is("[href]") !== false ) {
                        plugin.showPanel(active_link);
                    } else {
                        if ( ! active_link.parent().parent().parent().hasClass("mega-menu-tabbed") ) {
                            plugin.hideSiblingPanels(active_link);
                        }
                    }
                }

                if ( keyCode === escape_key && $menu.parent().hasClass("mega-keyboard-navigation") ) {
                    var submenu_open = $("> .mega-toggle-on", $menu).length !== 0;

                    $("> .mega-toggle-on > a.mega-menu-link", $menu).focus();

                    plugin.hideAllPanels();

                    if ( plugin.isMobileView() && ! submenu_open ) {
                        plugin.hideMobileMenu();
                        $(".mega-menu-toggle-block, button.mega-toggle-animated", $toggle_bar).first().focus();
                    }
                }

                if ( keyCode === enter_key && $menu.parent().hasClass("mega-keyboard-navigation") ) {
                    if ( active_link.hasClass("mega-menu-toggle-block") ) {
                        if ( $toggle_bar.hasClass("mega-menu-open") ) {
                            plugin.hideMobileMenu();
                        } else {
                            plugin.showMobileMenu();
                        }
                    }

                    // pressing enter on a parent item without a link will toggle the sub menu
                    if ( active_link.parent().is(items_with_submenus) && active_link.is("[href]") === false ) {
                        if ( active_link.parent().hasClass("mega-toggle-on") && ! active_link.parent().parent().parent().hasClass("mega-menu-tabbed") ) {
                            plugin.hidePanel(active_link);
                        } else {
                            plugin.showPanel(active_link);
                        }
                    }
                }

                if ( keyCode === right_arrow_key && plugin.isDesktopView() && $menu.parent().hasClass("mega-keyboard-navigation") && $menu.hasClass("mega-menu-horizontal") ) {
                    var next_top_level_item = $("> .mega-toggle-on", $menu).nextAll("li.mega-menu-item:visible").find("> a.mega-menu-link, .mega-search input[type=text]").first();

                    if (next_top_level_item.length === 0) {
                        next_top_level_item = $(":focus", $menu).parent().nextAll("li.mega-menu-item:visible").find("> a.mega-menu-link, .mega-search input[type=text]").first();
                    }

                    next_top_level_item.focus();

                    if ( next_top_level_item.parent().is(items_with_submenus) && next_top_level_item.is("[href]") !== false ) {
                        plugin.showPanel(next_top_level_item);
                    } else {
                        plugin.hideSiblingPanels(next_top_level_item);
                    }
                }

                if ( keyCode === left_arrow_key && plugin.isDesktopView() && $menu.parent().hasClass("mega-keyboard-navigation") && $menu.hasClass("mega-menu-horizontal") ) {
                    var prev_top_level_item = $("> .mega-toggle-on", $menu).prevAll("li.mega-menu-item:visible").find("> a.mega-menu-link, .mega-search input[type=text]").last();

                    if (prev_top_level_item.length === 0) {
                        prev_top_level_item = $(":focus", $menu).parent().prevAll("li.mega-menu-item:visible").find("> a.mega-menu-link, .mega-search input[type=text]").last();
                    }

                    prev_top_level_item.focus();

                    if ( prev_top_level_item.parent().is(items_with_submenus) && prev_top_level_item.is("[href]") !== false  ) {
                        plugin.showPanel(prev_top_level_item);
                    } else {
                        plugin.hideSiblingPanels(prev_top_level_item);
                    }
                }

            });

            $menu.parent().on("focusout.megamenu", function(e) {
                if ( $menu.parent().hasClass("mega-keyboard-navigation") ) {
                    setTimeout(function() {
                        var menu_has_focus = $menu.parent().find(":focus").length > 0;
                        if (! menu_has_focus) {
                            $menu.parent().removeClass("mega-keyboard-navigation");
                            plugin.hideAllPanels();
                            plugin.hideMobileMenu();
                        }
                    }, 10);
                }
            });
        };

        plugin.unbindAllEvents = function() {
            $("ul.mega-sub-menu, li.mega-menu-item, li.mega-menu-row, li.mega-menu-column, a.mega-menu-link, span.mega-indicator", menu).off().unbind();
        };

        plugin.unbindClickEvents = function() {
            // collapsable parents always have a click event
            $("> a.mega-menu-link", items_with_submenus).not(collapse_children_parents).off("click.megamenu touchend.megamenu");
        };

        plugin.unbindHoverEvents = function() {
            items_with_submenus.unbind("mouseenter.megamenu mouseleave.megamenu");
        };

        plugin.unbindHoverIntentEvents = function() {
            items_with_submenus.unbind("mouseenter mouseleave").removeProp("hoverIntent_t").removeProp("hoverIntent_s"); // hoverintent does not allow namespaced events
        };

        plugin.unbindKeyboardEvents = function() {
            $menu.parent().off("keyup.megamenu keydown.megamenu focusout.megamenu");
        };

        plugin.unbindMegaMenuEvents = function() {
            if (plugin.settings.event === "hover_intent") {
                plugin.unbindHoverIntentEvents();
            }

            if (plugin.settings.event === "hover") {
                plugin.unbindHoverEvents();
            }

            plugin.unbindClickEvents();
            plugin.unbindKeyboardEvents();
        };

        plugin.bindMegaMenuEvents = function() {
            plugin.unbindMegaMenuEvents();

            if (plugin.isDesktopView() && plugin.settings.event === "hover_intent") {
                plugin.bindHoverIntentEvents();
            }

            if (plugin.isDesktopView() && plugin.settings.event === "hover") {
                plugin.bindHoverEvents();
            }

            plugin.bindClickEvents(); // always bind click events for touch screen devices
            plugin.bindKeyboardEvents();
        };

        plugin.checkWidth = function() {
            if ( plugin.isMobileView() && $menu.data("view") === "desktop" ) {
                plugin.switchToMobile();
            }

            if ( plugin.isDesktopView() && $menu.data("view") === "mobile" ) {
                plugin.switchToDesktop();
            }

            plugin.calculateDynamicSubmenuWidths($("> li.mega-menu-megamenu > a.mega-menu-link", $menu));
        };

        plugin.reverseRightAlignedItems = function() {
            if ( ! $("body").hasClass("rtl") ) {
                $menu.append($menu.children("li.mega-item-align-right").get().reverse());
            }
        };

        plugin.addClearClassesToMobileItems = function() {
            $(".mega-menu-row", $menu).each(function() {
                $("> .mega-sub-menu > .mega-menu-column:not(.mega-hide-on-mobile)", $(this)).filter(":even").addClass("mega-menu-clear"); // :even is 0 based
            });
        };

        plugin.initDesktop = function() {
            $menu.data("view", "desktop");
            plugin.bindMegaMenuEvents();
            plugin.initIndicators();
        };

        plugin.switchToDesktop = function() {
            $menu.data("view", "desktop");
            plugin.bindMegaMenuEvents();
            plugin.reverseRightAlignedItems();
            plugin.hideAllPanels();
            plugin.hideMobileMenu(true);
        };

        plugin.initMobile = function() {
            plugin.switchToMobile();
        };

        plugin.switchToMobile = function() {
            $menu.data("view", "mobile");
            plugin.bindMegaMenuEvents();
            plugin.initIndicators();
            plugin.reverseRightAlignedItems();
            plugin.addClearClassesToMobileItems();
            plugin.hideAllPanels();
            plugin.expandMobileSubMenus();
        };

        plugin.initToggleBar = function() {
            $toggle_bar.on("click", function(e) {
                if ( $(e.target).is(".mega-menu-toggle, .mega-menu-toggle-custom-block *, .mega-menu-toggle-block, .mega-menu-toggle-animated-block, .mega-menu-toggle-animated-block *, .mega-toggle-blocks-left, .mega-toggle-blocks-center, .mega-toggle-blocks-right, .mega-toggle-label, .mega-toggle-label span") ) {
                    e.preventDefault();
                    
                    if ($(this).hasClass("mega-menu-open")) {
                        plugin.hideMobileMenu();
                    } else {
                        plugin.showMobileMenu();
                    }
                }
            });
        };

        plugin.initIndicators = function() {
            $("span.mega-indicator", $menu).not("[data-has-click-event]").on("click.megamenu", function(e) {
                e.preventDefault();
                e.stopPropagation();

                if ( $(this).parent().parent().hasClass("mega-toggle-on") ) {
                    if ( ! $(this).parent().parent().parent().parent().hasClass("mega-menu-tabbed") || plugin.isMobileView() ) {
                        plugin.hidePanel($(this).parent(), false);
                    }
                } else {
                    plugin.showPanel($(this).parent(), false);
                }
            });

            $("span.mega-indicator", $menu).each(function() {
                $(this).attr('data-has-click-event', 'true');
            });
        }

        plugin.hideMobileMenu = function(force) {
            force = force || false;

            if ( ! $toggle_bar.is(":visible") && ! force ) {
                return;
            }

            html_body_class_timeout = setTimeout(function() {
                $("body").removeClass($menu.attr("id") + "-mobile-open");
                $("html").removeClass($menu.attr("id") + "-off-canvas-open");
            }, plugin.settings.effect_speed_mobile);

            $(".mega-toggle-label, .mega-toggle-animated", $toggle_bar).attr("aria-expanded", "false");

            if (plugin.settings.effect_mobile === "slide" && ! force ) {
                $menu.animate({"height":"hide"}, plugin.settings.effect_speed_mobile, function() {
                    $menu.css({
                        width: "",
                        left: "",
                        display: ""
                    });
                });
            }

            $menu.css({
                width: "",
                left: "",
                display: ""
            });
                
            $toggle_bar.removeClass("mega-menu-open");

            $menu.triggerHandler("mmm:hideMobileMenu");
        };

        plugin.showMobileMenu = function() {
            if ( ! $toggle_bar.is(":visible")) {
                return;
            }

            clearTimeout(html_body_class_timeout);

            $("body").addClass($menu.attr("id") + "-mobile-open");

            if ( plugin.settings.effect_mobile === "slide_left" || plugin.settings.effect_mobile === "slide_right" ) {
                $("html").addClass($menu.attr("id") + "-off-canvas-open");
            }

            $(".mega-toggle-label, .mega-toggle-animated", $toggle_bar).attr("aria-expanded", "true");

            plugin.toggleBarForceWidth();

            if (plugin.settings.effect_mobile === "slide") {
                $menu.animate({"height":"show"}, plugin.settings.effect_speed_mobile);
            }

            $toggle_bar.addClass("mega-menu-open");

            $menu.triggerHandler("mmm:showMobileMenu");
        };

        plugin.toggleBarForceWidth = function() {
            if ($(plugin.settings.mobile_force_width).length && ( plugin.settings.effect_mobile === "slide" || plugin.settings.effect_mobile === "disabled" ) ) {
                var submenu_offset = $toggle_bar.offset();
                var target_offset = $(plugin.settings.mobile_force_width).offset();

                $menu.css({
                    width: $(plugin.settings.mobile_force_width).outerWidth(),
                    left: (target_offset.left - submenu_offset.left) + "px"
                });
            }
        };

        plugin.init = function() {
            $menu.triggerHandler("before_mega_menu_init");
            plugin.settings = $.extend({}, defaults, options);
            $menu.removeClass("mega-no-js");

            plugin.initToggleBar();
            
            if (plugin.settings.unbind_events === "true") {
                plugin.unbindAllEvents();
            }

            $(window).on("load", function() {
                plugin.calculateDynamicSubmenuWidths($("> li.mega-menu-megamenu > a.mega-menu-link", $menu));
            });

            if ( plugin.isDesktopView() ) {
                plugin.initDesktop();
            } else {
                plugin.initMobile();
            }

            $(window).resize(function() {
                plugin.checkWidth();
            });

            $menu.triggerHandler("after_mega_menu_init");
        };

        plugin.init();
    };

    $.fn.maxmegamenu = function(options) {
        return this.each(function() {
            if (undefined === $(this).data("maxmegamenu")) {
                var plugin = new $.maxmegamenu(this, options);
                $(this).data("maxmegamenu", plugin);
            }
        });
    };

    $(function() {
        $(".max-mega-menu").maxmegamenu();
    });
}( jQuery ));;
/*jslint browser: true, white: true */
/*global console,jQuery,megamenu,window,navigator*/

/**
 * EDD Ajax Cart
 */
(function($) {
    "use strict";

    $(function() {
        $('body').on('edd_cart_item_added', function(event, data) {
            $('.mega-menu-edd-cart-total').html(data.total);
            $('.mega-menu-edd-cart-count').html(data.cart_quantity);
        });
    });

    $(".max-mega-menu").on("after_mega_menu_init", function() {
        $('li.mega-menu-megamenu').on('open_panel', function() {
            // reset default
            var placeholder = $(this).closest(".mega-menu-megamenu").find(".widget_maxmegamenu_image_swap img.mega-placeholder");
            var default_src = placeholder.attr('data-default-src');
            placeholder.attr('src', default_src);

            // preload
            $('.mega-sub-menu [data-image-swap-url]', $(this) ).not(['data-preloaded']).each( function() {
                $('<img/>')[0].src = $(this).attr('data-image-swap-url');
                $(this).attr('data-preloaded', 'true');
            });
        });

        $('.mega-sub-menu [data-image-swap-url]').hoverIntent({
            over: function () {
                var placeholder = $(this).closest(".mega-menu-megamenu").find(".widget_maxmegamenu_image_swap img.mega-placeholder");
                var new_src = $(this).attr('data-image-swap-url');
                placeholder.attr('src', new_src);
            },
            out: function() {}
        });
    });

})(jQuery);

/**
 * Searchbox jQuery plugin
 */
(function($) {
    "use strict";

    $.maxmegamenu_searchbox = function(form, options) {

        var plugin = this;
        var form = $(form);
        var $menu = form.parents('.max-mega-menu');
        var $wrap = $menu.parent();
        var breakpoint = $menu.attr('data-breakpoint');
        var input = $('input[type=text]', form);
        var icon = $('.search-icon', form);

        plugin.isDesktopView = function() {
            return Math.max(window.outerWidth, $(window).width()) >= breakpoint; // account for scrollbars
        };

        plugin.monitorView = function() {
            if (typeof $menu.data("view") === 'undefined') {
                if (plugin.isDesktopView()) {
                    $menu.data("view", "desktop");
                } else {
                    $menu.data("view", "mobile");
                }
            }

            plugin.checkWidth();

            $(window).resize(function() {
                plugin.checkWidth();
            });
        };

        plugin.checkWidth = function() {
            var expanding_search = $("li.mega-menu-item .mega-search.expand-to-left input[type=text], li.mega-menu-item .mega-search.expand-to-right input[type=text]", $menu);

            if ( $menu.data("view") === "mobile" ) {
                var placeholder = expanding_search.attr('data-placeholder');
                expanding_search.attr('placeholder', placeholder);
            }

            if ( $menu.data("view") === "desktop" ) {
                expanding_search.attr('placeholder', '');
            }
        };

        plugin.close_search = function() {
            input.val("");
            input.attr('placeholder', '');
            form.removeClass('mega-search-open');
            form.addClass('mega-search-closed');
        }

        plugin.open_search = function() {
            input.attr('placeholder', input.attr('data-placeholder'));
            form.removeClass('mega-search-closed');
            form.addClass('mega-search-open');
        }

        plugin.detect_background_click = function() {
            var dragging = false;

            $(document).on({
                "touchmove": function(e) { dragging = true; },
                "touchstart": function(e) { dragging = false; }
            });

            $(document).on("click touchend", function(e) { // hide menu when clicked away from
                if ( form.parent().hasClass('mega-static') ) {
                    return;
                }
                if ( ! dragging && ! $(e.target).closest(".max-mega-menu li").length && ! $(e.target).closest(".mega-menu-toggle").length ) {
                    plugin.close_search();
                }
                dragging = false;
            });
        }

        plugin.init_replacements_search = function() {

            input.val("");

            if ( $menu.data("view") === "mobile" ) {
                $(".search-icon", $menu).on('click', function(e) {
                    $(this).parents(".mega-search").submit();
                });
            }

            if ( $menu.data("view") === "desktop" ) {
                input.on('focus', function(e) {
                    if (! form.parent().hasClass('mega-static') && form.hasClass('mega-search-closed') && $wrap.hasClass('mega-keyboard-navigation') ) {
                        plugin.open_search();
                    }
                });

                input.on('blur', function(e) {
                    if (! form.parent().hasClass('mega-static') && form.hasClass('mega-search-open') && $wrap.hasClass('mega-keyboard-navigation') ) {
                        plugin.close_search();
                    }
                });

                icon.on('click', function(e) {
                    if (form.parent().hasClass('mega-static') ) {
                        form.submit();
                        return;
                    }
                    
                    if (form.hasClass('mega-search-closed')) {
                        plugin.open_search();
                        input.focus();
                    } else if ( input.val() == '' ) {
                        plugin.close_search();
                    } else {
                        form.submit();
                    }
                });
            }
        };

        plugin.monitorView();
        plugin.init_replacements_search();
        plugin.detect_background_click();
    };

    $.fn.maxmegamenu_searchbox = function(options) {
        return this.each(function() {
            if (undefined === $(this).data('maxmegamenu_searchbox')) {
                var plugin = new $.maxmegamenu_searchbox(this, options);
                $(this).data('maxmegamenu_searchbox', plugin);
            }
        });
    };

    $(function() {
        $(".max-mega-menu .mega-search").maxmegamenu_searchbox();
    });
})(jQuery);


/**
 * Searchbox jQuery plugin
 */
(function($) {
    "use strict";

    $.maxmegamenu_toggle_searchbox = function(form, options) {

        var plugin = this;
        var form = $(form);
        var $wrap = form.parents('.mega-menu-wrap');
        var input = $("input[type=text]", form);
        var icon = $(".search-icon", form);
        
        plugin.open_search = function() {
            input.attr('placeholder', input.attr('data-placeholder'));
            form.removeClass('mega-search-closed');
            form.addClass('mega-search-open');
        }

        plugin.close_search = function() {
            input.attr('placeholder', '');
            form.removeClass('mega-search-open');
            form.addClass('mega-search-closed');
        }

        plugin.init_toggle_search = function() {

            input.val("");

            input.on('focus', function(e) {
                if (! form.parent().hasClass('mega-static') && form.hasClass('mega-search-closed') && $wrap.hasClass('mega-keyboard-navigation') ) {
                    plugin.open_search();
                }
            });

            input.on('blur', function(e) {
                if ( ! form.parent().hasClass('mega-static') && form.hasClass('mega-search-open') && $wrap.hasClass('mega-keyboard-navigation') ) {
                    plugin.close_search();
                }
            });

            icon.on('click', function(e) {
                if (form.hasClass('static') ) {
                    form.submit();
                } else if (form.hasClass('mega-search-closed')) {
                    input.focus();
                    plugin.open_search();
                } else if ( input.val() == '' ) {
                    plugin.close_search();
                } else {
                    form.submit();
                }
            });

        };

        plugin.init_toggle_search();

    };

    $.fn.maxmegamenu_toggle_searchbox = function(options) {
        return this.each(function() {
            if (undefined === $(this).data('maxmegamenu_toggle_searchbox')) {
                var plugin = new $.maxmegamenu_toggle_searchbox(this, options);
                $(this).data('maxmegamenu_toggle_searchbox', plugin);
            }
        });
    };

    $(function() {
        $(".mega-menu-toggle .mega-search").maxmegamenu_toggle_searchbox();
    });
})(jQuery);

/**
 * Sticky jQuery Plugin
 */
(function($) {

    "use strict";

    $.maxmegamenu_sticky = function(menu, options) {
        var plugin = this;
        var $menu = $(menu);
        var $wrap = $menu.parent();
        var breakpoint = $menu.attr('data-breakpoint');
        var sticky_on_mobile = $menu.attr('data-sticky-mobile');
        var sticky_on_desktop = $menu.attr('data-sticky-desktop');
        var sticky_expand = $menu.attr('data-sticky-expand');
        var sticky_expand_mobile = $menu.attr('data-sticky-expand-mobile');
        var sticky_offset = isNaN(parseInt($menu.attr('data-sticky-offset'))) ? 0 : parseInt($menu.attr('data-sticky-offset'));
        var sticky_hide_until_scroll_up = $menu.attr('data-sticky-hide');
        var sticky_hide_until_scroll_up_tolerance = isNaN(parseInt($menu.attr('data-sticky-hide-tolerance'))) ? 0 : parseInt($menu.attr('data-sticky-hide-tolerance'));
        var sticky_hide_until_scroll_up_offset = isNaN(parseInt($menu.attr('data-sticky-hide-offset'))) ? 0 : parseInt($menu.attr('data-sticky-hide-offset'));
        var sticky_transition = $menu.attr('data-sticky-transition');
        var sticky_menu_offset_top;
        var sticky_menu_offset_left;
        var sticky_menu_width;
        var sticky_menu_width_round_up;
        var sticky_menu_height;
        var is_stuck = false;
        var admin_bar_height = 0;
        var last_scroll_top = 0;
        var saved_scroll_top = 0;
        var is_vertical = $menu.hasClass('mega-menu-vertical') || $menu.hasClass('mega-menu-accordion');

        plugin.isDesktopView = function() {
            return Math.max(window.outerWidth, $(window).width()) >= breakpoint; // account for scrollbars
        };

        var sticky_hide_until_scroll_up_enabled = function() {
            return $menu.hasClass('mega-menu-horizontal') && sticky_hide_until_scroll_up == "true";
        }

        var sticky_enabled = function() {
            if ( plugin.isDesktopView() ) {
                return sticky_on_desktop === 'true';
            } else {
                return sticky_on_mobile === 'true';
            }

            return false;
        };

        plugin.calculate_menu_position = function() {
            sticky_menu_offset_top = $wrap.offset().top;

            if ($('body').hasClass('admin-bar') && $("#wpadminbar").is(":visible") && $("#wpadminbar").css('top') == '0px' && $("#wpadminbar").css('position') == 'fixed') {
                admin_bar_height = $('#wpadminbar').height();
                sticky_menu_offset_top = sticky_menu_offset_top - admin_bar_height;
            }

            if (sticky_offset < 0) {
                sticky_menu_offset_top = sticky_menu_offset_top + sticky_offset;
            } else {
                sticky_menu_offset_top = sticky_menu_offset_top - sticky_offset;
            }

            sticky_menu_offset_left = $menu.parent().offset().left;
            sticky_menu_width = window.getComputedStyle($wrap[0]).width;
            sticky_menu_width_round_up = Math.ceil(parseFloat(sticky_menu_width));
            sticky_menu_height = $wrap.height();
        };

        plugin.stick_menu = function() {
            is_stuck = true;

            var total_offset = parseInt(admin_bar_height, 10) + parseInt(sticky_offset, 10);

            if (sticky_offset < 0) {
                total_offset = parseInt(admin_bar_height, 10);
            }

            var placeholder = $("<div />").addClass("mega-sticky-wrapper").css({
                'height' : sticky_menu_height + 'px',
                'position' :'static'
            });

            $wrap.addClass('mega-sticky').wrap(placeholder).css({
                'margin-top' : total_offset + 'px'
            });

            $("body").addClass($menu.attr("id") + "-mega-sticky");

            $menu.css({
                'max-width' : sticky_menu_width_round_up + 'px'
            });

            if (sticky_menu_offset_left > 0) {
                $menu.css({
                    'margin-left' : sticky_menu_offset_left + 'px'
                });
            }

            if (is_vertical || sticky_expand === 'false') {
                $wrap.css({
                    'margin-left' : '0',
                    'margin-right' : '0',
                    'width' : sticky_menu_width_round_up + 'px',
                    'left' : sticky_menu_offset_left + 'px'
                });

                $menu.css({
                    'margin-left' : '0'
                });
            }

            if ( $(window).width() <= breakpoint ) {
                $wrap.css({
                    'width' : sticky_menu_width_round_up + 'px'
                });

                if (sticky_expand_mobile === 'true') {
                   $wrap.css({
                        'margin-left' : '',
                        'margin-right' : '',
                        'width' : '',
                        'left' : ''
                    });

                    $menu.css({
                        'max-width' : '',
                        'margin-left' : '',
                        'width' : '',
                        'left' : ''
                    });
                }
            }

            $wrap.delay(0).queue(function(next){
                $(this).addClass('mega-stuck');
                next();
            });
        };

        plugin.unstick_menu = function(doing_resize) {
            doing_resize = doing_resize || false;
            is_stuck = false;
            
            $wrap.removeClass('mega-sticky').removeClass('mega-hide').css({
                'margin' : '',
                'width' : '',
                'left': ''
            });

            $("body").removeClass($menu.attr("id") + "-mega-sticky");

            if ( ! doing_resize ) { // this class is used for the height transition, do not remove it if we are simply resizing the window
                $wrap.delay(0).queue(function(next){
                    $(this).removeClass('mega-stuck');
                    next();
                });
            }

            $menu.css({
                'margin-left' : '',
                'max-width' : '',
                'left' : '',
                'width' : ''
            });

            if (sticky_transition == 'true' && ! doing_resize ) {
                var delay = 250; // allows the transiton to complete before unwrapping the menu
            } else {
                var delay = 0;
            }

            $wrap.delay(delay).queue(function(next){
                $(this).unwrap();
                next();
            });
        };

        plugin.mega_sticky_on_scroll = function(){
            if ( ! sticky_enabled() ) {
                return;
            }

            var scroll_top = $(window).scrollTop();

            if (scroll_top > sticky_menu_offset_top) {
                if (!is_stuck) {
                    plugin.stick_menu();
                }
            } else {
                if (is_stuck) {
                    plugin.unstick_menu();
                }
            }
        };

        var mega_hide_on_scroll_up = function() {
            if (sticky_hide_until_scroll_up_enabled()) {

                if ( $menu.data("view") === "mobile" && $('.mega-menu-toggle', $wrap).hasClass('mega-menu-open') ) {
                    return;
                }

                var scroll_top = $(window).scrollTop();
                
                if ( scroll_top < sticky_hide_until_scroll_up_offset ) {
                    $wrap.removeClass('mega-hide');
                    $("body").removeClass($menu.attr("id") + "-mega-hide");
                }
                
                saved_scroll_top = last_scroll_top;

                if (scroll_top < last_scroll_top) {
                    // scroll up
                    if (saved_scroll_top - scroll_top > sticky_hide_until_scroll_up_tolerance) {
                        $wrap.removeClass('mega-hide');
                        $("body").removeClass($menu.attr("id") + "-mega-hide");
                    }
                } else {
                    // scroll down
                    if (is_stuck && scroll_top - saved_scroll_top > sticky_hide_until_scroll_up_tolerance) {
                        $wrap.addClass('mega-hide');
                        $("body").addClass($menu.attr("id") + "-mega-hide");
                    }
                }

                last_scroll_top = scroll_top;
            }
        }

        plugin.mega_sticky_on_resize = function() {
            if ($('input', $wrap).is(':focus')) {
                return;
            }

            if ( sticky_enabled() ) {
                if (is_stuck) {
                    plugin.unstick_menu(true);
                    plugin.calculate_menu_position();
                    plugin.stick_menu();
                } else {
                    plugin.calculate_menu_position();
                    plugin.mega_sticky_on_scroll();
                }
            } else {
                if (is_stuck) {
                    plugin.unstick_menu();
                }
            }
        };

        plugin.init = function() {
            plugin.calculate_menu_position();
            plugin.mega_sticky_on_scroll();

            $('.mega-menu-accordion li.mega-menu-item').on('open_panel', function() {
                plugin.calculate_menu_position();
            });

            var $window = $(window);

            $window.scroll(function() {
                 plugin.mega_sticky_on_scroll();
                 mega_hide_on_scroll_up();
            });

            var windowWidth = $window.width();
            var resizeTimer;

            $window.resize(function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function(){    
                    windowWidth = $window.width();
                    plugin.mega_sticky_on_resize();
                }, 100);
            });
        };

        plugin.init();
    };

    $.fn.maxmegamenu_sticky = function(options) {

        return this.each(function() {
            if (undefined === $(this).data('maxmegamenu_sticky')) {
                var plugin = new $.maxmegamenu_sticky(this, options);
                $(this).data('maxmegamenu_sticky', plugin);
            }
        });

    };

    $(window).on('load', function (e) {
        $(".mega-menu[data-sticky-enabled]").maxmegamenu_sticky();
    });

})(jQuery);

/**
 * Handle tabbed functionality
 */
(function($) {
    $(function() {

        var calculate_tabbed_sub_menu_widths = function( menu_item ) {
            var menu = menu_item.parents('.max-mega-menu');

            if( $(menu.attr('data-panel-inner-width')).length > 0 ) {
                if ( menu.data("view") === "desktop" ) {
                    $('> ul.mega-sub-menu', menu_item).each(function() {
                        var tab_content = $(this);
                        var parent_submenu_content_width = parseInt(tab_content.width());
                        var parent_submenu_left_padding = parseInt(tab_content.css('paddingLeft'));
                        var tabs_width = $(this).find('a.mega-menu-link').first().outerWidth();

                        $('> li.mega-menu-item > ul.mega-sub-menu', $(this)).each(function() {
                            $(this).css('width', parent_submenu_content_width - tabs_width + 'px');
                            $(this).css('left', parent_submenu_left_padding + tabs_width + 'px'); 
                        });
                    });
                } else {
                    $('> ul.mega-sub-menu > li.mega-menu-item > ul.mega-sub-menu', menu_item).each(function() {
                        $(this).css('width', '');
                        $(this).css('left', ''); 
                    });
                }
            }
        }

        var calculate_tabbed_sub_menu_heights = function( menu_item ) {

            var menu = menu_item.parents('.max-mega-menu');
            var max_height = 0;

            if ( menu.data("view") === "desktop" ) {

                $('> ul.mega-sub-menu', menu_item).css('minHeight', '');
                
                $('> ul.mega-sub-menu > li.mega-menu-item > ul.mega-sub-menu', menu_item).each(function() {
                    var tab_content = $(this);
                    var this_height = parseInt(tab_content.css('height'));

                    if (this_height > max_height) {
                        max_height = this_height;
                    }
                });

                var border_top_width = parseInt($('> ul.mega-sub-menu', menu_item).css('borderTopWidth'),10);
                var border_bottom_width = parseInt($('> ul.mega-sub-menu', menu_item).css('borderBottomWidth'),10);
                
                $('> ul.mega-sub-menu', menu_item).css('minHeight', max_height + border_bottom_width + border_top_width);
            } else {
                $('> ul.mega-sub-menu', menu_item).css('minHeight', '');
            }
        }

        var $window = $(window);

        var windowWidth = $window.width();

        $window.resize(function() {
            if ($window.width() != windowWidth) {
                calculate_tabbed_sub_menu_widths($('li.mega-menu-tabbed'));
                calculate_tabbed_sub_menu_heights($('li.mega-menu-tabbed'));
            }            
        });

        $('li.mega-menu-tabbed, li.mega-menu-tabbed li.mega-collapse-children').on('open_panel', function() {
            var menu = $(this).parents('.max-mega-menu');
            var menu_item = $(this).closest(".mega-menu-tabbed");

            calculate_tabbed_sub_menu_widths( menu_item );

            $("> ul.mega-sub-menu", $(this)).promise().done(function(){ // wait until slide animation has completed
                calculate_tabbed_sub_menu_heights( menu_item );
            });

            if ( menu.data('view') == 'desktop' ) {
                if ($('> ul.mega-sub-menu > li.mega-menu-item-has-children.mega-toggle-on', menu_item).length == 0 ) {
                    

                    if ( $('> ul.mega-sub-menu > li.mega-current-menu-item:visible', menu_item).length ) {
                        $('> ul.mega-sub-menu > li.mega-current-menu-item:visible', menu_item).first().addClass('mega-toggle-on');
                    } else if ( $('> ul.mega-sub-menu > li.mega-current-menu-ancestor:visible', menu_item).length ) {
                        $('> ul.mega-sub-menu > li.mega-current-menu-ancestor:visible', menu_item).first().addClass('mega-toggle-on');
                    }
                    

                    if ($('> ul.mega-sub-menu > li.mega-toggle-on', menu_item).length == 0 ) {
                        $('> ul.mega-sub-menu > li.mega-menu-item-has-children:visible', menu_item).first().addClass('mega-toggle-on');
                    }
                }

                $('li.mega-menu-tabbed', menu).on('close_panel', function() {
                    $('li.mega-menu-tabbed .mega-toggle-on', menu).removeClass('mega-toggle-on');
                });
            }

            $('li.mega-menu-tabbed li.mega-collapse-children').on('close_panel', function() {
                var menu_item = $(this).closest('.mega-menu-tabbed');

                $("> ul.mega-sub-menu", $(this)).promise().done(function(){ // wait until slide animation has completed
                    calculate_tabbed_sub_menu_heights( menu_item );
                });
            });
        });
    });
})(jQuery);;
/*! This file is auto-generated */
!function(c,d){"use strict";var e=!1,n=!1;if(d.querySelector)if(c.addEventListener)e=!0;if(c.wp=c.wp||{},!c.wp.receiveEmbedMessage)if(c.wp.receiveEmbedMessage=function(e){var t=e.data;if(t)if(t.secret||t.message||t.value)if(!/[^a-zA-Z0-9]/.test(t.secret)){for(var r,a,i,s=d.querySelectorAll('iframe[data-secret="'+t.secret+'"]'),n=d.querySelectorAll('blockquote[data-secret="'+t.secret+'"]'),o=0;o<n.length;o++)n[o].style.display="none";for(o=0;o<s.length;o++)if(r=s[o],e.source===r.contentWindow){if(r.removeAttribute("style"),"height"===t.message){if(1e3<(i=parseInt(t.value,10)))i=1e3;else if(~~i<200)i=200;r.height=i}if("link"===t.message)if(a=d.createElement("a"),i=d.createElement("a"),a.href=r.getAttribute("src"),i.href=t.value,i.host===a.host)if(d.activeElement===r)c.top.location.href=t.value}}},e)c.addEventListener("message",c.wp.receiveEmbedMessage,!1),d.addEventListener("DOMContentLoaded",t,!1),c.addEventListener("load",t,!1);function t(){if(!n){n=!0;for(var e,t,r=-1!==navigator.appVersion.indexOf("MSIE 10"),a=!!navigator.userAgent.match(/Trident.*rv:11\./),i=d.querySelectorAll("iframe.wp-embedded-content"),s=0;s<i.length;s++){if(!(e=i[s]).getAttribute("data-secret"))t=Math.random().toString(36).substr(2,10),e.src+="#?secret="+t,e.setAttribute("data-secret",t);if(r||a)(t=e.cloneNode(!0)).removeAttribute("security"),e.parentNode.replaceChild(t,e)}}}}(window,document);;
