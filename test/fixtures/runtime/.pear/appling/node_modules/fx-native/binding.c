#include <assert.h>
#include <bare.h>
#include <js.h>

#include "lib/app.h"
#include "lib/image.h"
#include "lib/node.h"
#include "lib/screen.h"
#include "lib/text.h"
#include "lib/view.h"
#include "lib/web-view.h"
#include "lib/window.h"

static js_value_t *
fx_native_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", fx_native_init)
  V("destroy", fx_native_destroy)
  V("run", fx_native_run)
  V("isMain", fx_native_is_main)
  V("broadcast", fx_native_broadcast)

  V("getMainScreen", fx_native_get_main_screen)
  V("getScreenBounds", fx_native_get_screen_bounds)

  V("setChild", fx_native_set_child)
  V("unsetChild", fx_native_unset_child)

  V("initWindow", fx_native_init_window)
  V("destroyWindow", fx_native_destroy_window)
  V("getWindowBounds", fx_native_get_window_bounds)
  V("showWindow", fx_native_show_window)
  V("hideWindow", fx_native_hide_window)
  V("activateWindow", fx_native_activate_window)
  V("closeWindow", fx_native_close_window)

  V("initView", fx_native_init_view)
  V("destroyView", fx_native_destroy_view)
  V("getViewBounds", fx_native_get_view_bounds)
  V("setViewBounds", fx_native_set_view_bounds)

  V("initText", fx_native_init_text)
  V("destroyText", fx_native_destroy_text)
  V("getTextBounds", fx_native_get_text_bounds)
  V("getTextBoundsUsed", fx_native_get_text_bounds_used)
  V("setTextBounds", fx_native_set_text_bounds)
  V("initTextSpan", fx_native_init_text_span)
  V("appendTextSpan", fx_native_append_text_span)

  V("initImage", fx_native_init_image)
  V("destroyImage", fx_native_destroy_image)
  V("getImageBounds", fx_native_get_image_bounds)
  V("setImageBounds", fx_native_set_image_bounds)
  V("loadImageFile", fx_native_load_image_file)
  V("loadImagePixels", fx_native_load_image_pixels)

  V("initWebView", fx_native_init_web_view)
  V("destroyWebView", fx_native_destroy_web_view)
  V("getWebViewBounds", fx_native_get_web_view_bounds)
  V("setWebViewBounds", fx_native_set_web_view_bounds)
  V("postWebViewMessage", fx_native_post_web_view_message)
  V("loadWebViewURL", fx_native_load_web_view_url)
  V("loadWebViewHTML", fx_native_load_web_view_html)
#undef V

  return exports;
}

BARE_MODULE(fx_native, fx_native_exports)
