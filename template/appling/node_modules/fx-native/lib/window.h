#ifndef FX_NATIVE_WINDOW_H
#define FX_NATIVE_WINDOW_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <uv.h>

#include "app.h"
#include "view.h"

typedef struct {
  fx_window_t *window;

  js_env_t *env;
  js_ref_t *ctx;

  js_ref_t *on_resize;
  js_ref_t *on_move;
  js_ref_t *on_minimize;
  js_ref_t *on_deminimize;
  js_ref_t *on_close;
} fx_native_window_t;

static void
fx_native__on_window_resize(fx_window_t *fx_window) {
  int err;

  fx_native_window_t *window;
  err = fx_get_window_data(fx_window, (void **) &window);
  assert(err == 0);

  js_env_t *env = window->env;

  float width, height;
  err = fx_get_window_bounds(window->window, NULL, NULL, &width, &height);
  assert(err == 0);

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, window->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_resize;
  err = js_get_reference_value(env, window->on_resize, &on_resize);
  assert(err == 0);

  js_value_t *argv[2];

  err = js_create_double(env, width, &argv[0]);
  assert(err == 0);

  err = js_create_double(env, height, &argv[1]);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_resize, 2, argv, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_window_move(fx_window_t *fx_window) {
  int err;

  fx_native_window_t *window;
  err = fx_get_window_data(fx_window, (void **) &window);
  assert(err == 0);

  js_env_t *env = window->env;

  float x, y;
  err = fx_get_window_bounds(window->window, &x, &y, NULL, NULL);
  assert(err == 0);

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, window->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_move;
  err = js_get_reference_value(env, window->on_move, &on_move);
  assert(err == 0);

  js_value_t *argv[2];

  err = js_create_double(env, x, &argv[0]);
  assert(err == 0);

  err = js_create_double(env, y, &argv[1]);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_move, 2, argv, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_window_minimize(fx_window_t *fx_window) {
  int err;

  fx_native_window_t *window;
  err = fx_get_window_data(fx_window, (void **) &window);
  assert(err == 0);

  js_env_t *env = window->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, window->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_minimize;
  err = js_get_reference_value(env, window->on_minimize, &on_minimize);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_minimize, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_window_deminimize(fx_window_t *fx_window) {
  int err;

  fx_native_window_t *window;
  err = fx_get_window_data(fx_window, (void **) &window);
  assert(err == 0);

  js_env_t *env = window->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, window->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_deminimize;
  err = js_get_reference_value(env, window->on_deminimize, &on_deminimize);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_deminimize, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_window_close(fx_window_t *fx_window) {
  int err;

  fx_native_window_t *window;
  err = fx_get_window_data(fx_window, (void **) &window);
  assert(err == 0);

  js_env_t *env = window->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, window->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_close;
  err = js_get_reference_value(env, window->on_close, &on_close);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_close, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
fx_native_init_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 10;
  js_value_t *argv[10];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 10);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  fx_native_view_t *view;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &view, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[2], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  bool frame;
  err = js_get_value_bool(env, argv[3], &frame);
  assert(err == 0);

  js_value_t *handle;

  fx_native_window_t *window;
  err = js_create_arraybuffer(env, sizeof(fx_native_window_t), (void **) &window, &handle);
  assert(err == 0);

  window->env = env;

  err = js_create_reference(env, argv[4], 1, &window->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[5], 1, &window->on_resize);
  assert(err == 0);

  err = js_create_reference(env, argv[6], 1, &window->on_move);
  assert(err == 0);

  err = js_create_reference(env, argv[7], 1, &window->on_minimize);
  assert(err == 0);

  err = js_create_reference(env, argv[8], 1, &window->on_deminimize);
  assert(err == 0);

  err = js_create_reference(env, argv[9], 1, &window->on_close);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  int flags = 0;

  if (frame == false) flags |= fx_window_no_frame;

  err = fx_window_init(app->app, view->view, x, y, width, height, flags, &window->window);
  assert(err == 0);

  err = fx_set_window_data(window->window, (void *) window);
  assert(err == 0);

  err = fx_on_window_resize(window->window, fx_native__on_window_resize);
  assert(err == 0);

  err = fx_on_window_move(window->window, fx_native__on_window_move);
  assert(err == 0);

  err = fx_on_window_minimize(window->window, fx_native__on_window_minimize);
  assert(err == 0);

  err = fx_on_window_deminimize(window->window, fx_native__on_window_deminimize);
  assert(err == 0);

  err = fx_on_window_close(window->window, fx_native__on_window_close);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  err = fx_window_destroy(window->window);
  assert(err == 0);

  err = js_delete_reference(env, window->on_resize);
  assert(err == 0);

  err = js_delete_reference(env, window->on_move);
  assert(err == 0);

  err = js_delete_reference(env, window->on_minimize);
  assert(err == 0);

  err = js_delete_reference(env, window->on_deminimize);
  assert(err == 0);

  err = js_delete_reference(env, window->on_close);
  assert(err == 0);

  err = js_delete_reference(env, window->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_window_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_window_bounds(window->window, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_show_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  err = fx_show_window(window->window);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_hide_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  err = fx_hide_window(window->window);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_activate_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  err = fx_activate_window(window->window);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_close_window(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_window_t *window;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &window, NULL);
  assert(err == 0);

  err = fx_close_window(window->window);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_WINDOW_H
