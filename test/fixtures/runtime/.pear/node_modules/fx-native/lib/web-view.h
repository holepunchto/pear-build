#ifndef FX_NATIVE_WEB_VIEW_H
#define FX_NATIVE_WEB_VIEW_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <stdlib.h>
#include <string.h>
#include <uv.h>

#include "app.h"

typedef struct {
  fx_web_view_t *web_view;

  js_env_t *env;
  js_ref_t *ctx;

  js_ref_t *on_message;
} fx_native_web_view_t;

static void
fx_native__on_web_view_message(fx_web_view_t *fx_web_view, const char *message, size_t len) {
  int err;

  fx_native_web_view_t *web_view;
  err = fx_get_web_view_data(fx_web_view, (void **) &web_view);
  assert(err == 0);

  js_env_t *env = web_view->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, web_view->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_message;
  err = js_get_reference_value(env, web_view->on_message, &on_message);
  assert(err == 0);

  js_value_t *argv[1];

  err = js_create_string_utf8(env, (const utf8_t *) message, len, &argv[0]);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_message, 1, argv, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
fx_native_init_web_view(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  js_value_t *handle;

  fx_native_web_view_t *web_view;
  err = js_create_arraybuffer(env, sizeof(fx_native_web_view_t), (void **) &web_view, &handle);

  web_view->env = env;

  err = js_create_reference(env, argv[2], 1, &web_view->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[3], 1, &web_view->on_message);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_web_view_init(app->app, x, y, width, height, &web_view->web_view);
  assert(err == 0);

  err = fx_set_web_view_data(web_view->web_view, (void *) web_view);
  assert(err == 0);

  err = fx_on_web_view_message(web_view->web_view, fx_native__on_web_view_message);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy_web_view(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  err = fx_web_view_destroy(web_view->web_view);
  assert(err == 0);

  err = js_delete_reference(env, web_view->on_message);
  assert(err == 0);

  err = js_delete_reference(env, web_view->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_web_view_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_web_view_bounds(web_view->web_view, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_set_web_view_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_set_web_view_bounds(web_view->web_view, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_post_web_view_message(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *message = malloc(len);
  err = js_get_value_string_utf8(env, argv[1], message, len, NULL);
  assert(err == 0);

  err = fx_web_view_post_message(web_view->web_view, (char *) message, len - 1 /* NULL */);
  assert(err == 0);

  free(message);

  return NULL;
}

static js_value_t *
fx_native_load_web_view_url(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *url = malloc(len);
  err = js_get_value_string_utf8(env, argv[1], url, len, NULL);
  assert(err == 0);

  err = fx_web_view_load_url(web_view->web_view, (char *) url, len - 1 /* NULL */);
  assert(err == 0);

  free(url);

  return NULL;
}

static js_value_t *
fx_native_load_web_view_html(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_web_view_t *web_view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &web_view, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *html = malloc(len);
  err = js_get_value_string_utf8(env, argv[1], html, len, NULL);
  assert(err == 0);

  err = fx_web_view_load_html(web_view->web_view, (char *) html, len - 1 /* NULL */);
  assert(err == 0);

  free(html);

  return NULL;
}

#endif // FX_NATIVE_WEB_VIEW_H
