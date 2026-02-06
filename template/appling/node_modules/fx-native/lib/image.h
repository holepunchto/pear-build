#ifndef FX_NATIVE_IMAGE_H
#define FX_NATIVE_IMAGE_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

#include "app.h"

typedef struct {
  fx_image_t *image;

  js_env_t *env;
  js_ref_t *ctx;
} fx_native_image_t;

static js_value_t *
fx_native_init_image(js_env_t *env, js_callback_info_t *info) {
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

  fx_native_image_t *image;
  err = js_create_arraybuffer(env, sizeof(fx_native_image_t), (void **) &image, &handle);
  assert(err == 0);

  image->env = env;

  err = js_create_reference(env, argv[2], 1, &image->ctx);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_image_init(app->app, x, y, width, height, &image->image);
  assert(err == 0);

  err = fx_set_image_data(image->image, (void *) image);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy_image(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_image_t *image;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &image, NULL);
  assert(err == 0);

  err = fx_image_destroy(image->image);
  assert(err == 0);

  err = js_delete_reference(env, image->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_get_image_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_image_t *image;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &image, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float *x = &bounds[0];
  float *y = &bounds[1];
  float *width = &bounds[2];
  float *height = &bounds[3];

  err = fx_get_image_bounds(image->image, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_set_image_bounds(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_image_t *image;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &image, NULL);
  assert(err == 0);

  float *bounds;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &bounds, NULL, NULL, NULL);
  assert(err == 0);

  float x = bounds[0];
  float y = bounds[1];
  float width = bounds[2];
  float height = bounds[3];

  err = fx_set_image_bounds(image->image, x, y, width, height);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_load_image_file(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_image_t *image;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &image, NULL);
  assert(err == 0);

  size_t len;
  err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *file = malloc(len);
  err = js_get_value_string_utf8(env, argv[1], file, len, NULL);
  assert(err == 0);

  err = fx_image_load_file(image->image, (char *) file, len - 1 /* NULL */);
  assert(err == 0);

  free(file);

  return NULL;
}

static js_value_t *
fx_native_load_image_pixels(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  fx_native_image_t *image;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &image, NULL);
  assert(err == 0);

  uint8_t *pixels;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &pixels, NULL, NULL, NULL);
  assert(err == 0);

  int64_t width;
  err = js_get_value_int64(env, argv[2], &width);
  assert(err == 0);

  int64_t height;
  err = js_get_value_int64(env, argv[3], &height);
  assert(err == 0);

  int64_t stride;
  err = js_get_value_int64(env, argv[4], &stride);
  assert(err == 0);

  err = fx_image_load_pixels(image->image, pixels, width, height, stride);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_IMAGE_H
