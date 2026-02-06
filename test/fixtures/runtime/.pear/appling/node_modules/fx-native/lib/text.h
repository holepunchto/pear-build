#ifndef FX_NATIVE_TEXT_H
#define FX_NATIVE_TEXT_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

#include "app.h"

typedef struct {
  fx_text_t *text;

  js_env_t *env;
  js_ref_t *ctx;
} fx_native_text_t;

typedef struct {
  fx_text_span_t *span;
} fx_native_text_span_t;

static js_value_t *
fx_native_init_text(js_env_t *env, js_callback_info_t *info) {
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

  fx_native_text_t *text;
  err = js_create_arraybuffer(env, sizeof(fx_native_text_t), (void **) &text, &handle);
  assert(err == 0);

  text->env = env;

  err = js_create_reference(env, argv[2], 1, &text->ctx);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_text_init(app->app, x, y, width, height, &text->text);
  assert(err == 0);

  err = fx_set_text_data(text->text, (void *) text);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy_text(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_text_t *text;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &text, NULL);
  assert(err == 0);

  err = fx_text_destroy(text->text);
  assert(err == 0);

  err = js_delete_reference(env, text->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_text_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_text_t *text;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &text, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_text_bounds(text->text, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_text_bounds_used(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_text_t *text;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &text, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_text_bounds_used(text->text, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_set_text_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_text_t *text;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &text, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_set_text_bounds(text->text, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_init_text_span(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *handle;

  fx_native_text_span_t *span;
  err = js_create_arraybuffer(env, sizeof(fx_native_text_span_t), (void **) &span, &handle);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_append_text_span(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  fx_native_text_t *text;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &text, NULL);
  assert(err == 0);

  fx_native_text_span_t *span;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &span, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[2], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *value = malloc(len);
  err = js_get_value_string_utf8(env, argv[2], value, len, NULL);
  assert(err == 0);

  err = fx_append_text_span(text->text, (char *) value, len, &span->span);
  assert(err == 0);

  free(value);

  return NULL;
}

#endif // FX_NATIVE_TEXT_Hpi
