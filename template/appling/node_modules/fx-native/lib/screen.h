#ifndef FX_NATIVE_SCREEN_H
#define FX_NATIVE_SCREEN_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

#include "app.h"

typedef struct {
  fx_screen_t *screen;
} fx_native_screen_t;

static void
fx_native__on_screen_finalize(js_env_t *env, void *data, void *finalize_hint) {
  int err;

  fx_screen_t *screen = data;

  err = fx_screen_release(screen);
  assert(err == 0);
}

static js_value_t *
fx_native_get_main_screen(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  js_value_t *handle;

  fx_native_screen_t *screen;
  err = js_create_arraybuffer(env, sizeof(fx_native_screen_t), (void **) &screen, &handle);
  assert(err == 0);

  err = fx_get_main_screen(app->app, &screen->screen);
  assert(err == 0);

  err = js_add_finalizer(env, handle, screen->screen, fx_native__on_screen_finalize, NULL, NULL);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_get_screen_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_screen_t *screen;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &screen, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_screen_bounds(screen->screen, x, y, width, height);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_SCREEN_H
