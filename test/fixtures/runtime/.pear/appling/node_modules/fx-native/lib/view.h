#ifndef FX_NATIVE_VIEW_H
#define FX_NATIVE_VIEW_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

#include "app.h"

typedef struct {
  fx_view_t *view;

  js_env_t *env;
  js_ref_t *ctx;
} fx_native_view_t;

static js_value_t *
fx_native_init_view(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  js_value_t *handle;

  fx_native_view_t *view;
  err = js_create_arraybuffer(env, sizeof(fx_native_view_t), (void **) &view, &handle);
  assert(err == 0);

  view->env = env;

  err = js_create_reference(env, argv[2], 1, &view->ctx);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_view_init(app->app, x, y, width, height, &view->view);
  assert(err == 0);

  err = fx_set_view_data(view->view, (void *) view);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy_view(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_view_t *view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &view, NULL);
  assert(err == 0);

  err = fx_view_destroy(view->view);
  assert(err == 0);

  err = js_delete_reference(env, view->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_view_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_view_t *view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &view, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_view_bounds(view->view, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_set_view_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_view_t *view;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &view, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_set_view_bounds(view->view, x, y, width, height);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_VIEW_H
