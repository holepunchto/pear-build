#ifndef FX_NATIVE_APP_H
#define FX_NATIVE_APP_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <string.h>
#include <uv.h>

typedef struct {
  fx_t *app;

  js_env_t *env;
  js_ref_t *ctx;

  js_ref_t *on_launch;
  js_ref_t *on_terminate;
  js_ref_t *on_suspend;
  js_ref_t *on_resume;
  js_ref_t *on_message;
} fx_native_t;

static void
fx_native__on_suspend(fx_t *fx_app) {
  int err;

  fx_native_t *app;
  err = fx_get_data(fx_app, (void **) &app);
  assert(err == 0);

  js_env_t *env = app->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, app->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_suspend;
  err = js_get_reference_value(env, app->on_suspend, &on_suspend);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_suspend, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_resume(fx_t *fx_app) {
  int err;

  fx_native_t *app;
  err = fx_get_data(fx_app, (void **) &app);
  assert(err == 0);

  js_env_t *env = app->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, app->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_resume;
  err = js_get_reference_value(env, app->on_resume, &on_resume);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_resume, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_message(fx_t *fx_app, const uv_buf_t *buf, fx_t *sender) {
  int err;

  fx_native_t *app;
  err = fx_get_data(fx_app, (void **) &app);
  assert(err == 0);

  js_env_t *env = app->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, app->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_message;
  err = js_get_reference_value(env, app->on_message, &on_message);
  assert(err == 0);

  js_value_t *argv[1];

  void *data;
  err = js_create_unsafe_arraybuffer(env, buf->len, &data, &argv[0]);
  assert(err == 0);

  memcpy(data, buf->base, buf->len);

  js_call_function_with_checkpoint(env, ctx, on_message, 1, argv, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
fx_native_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 6;
  js_value_t *argv[6];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 6);

  js_value_t *handle;

  fx_native_t *app;
  err = js_create_arraybuffer(env, sizeof(fx_native_t), (void **) &app, &handle);
  assert(err == 0);

  app->env = env;

  err = js_create_reference(env, argv[0], 1, &app->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[1], 1, &app->on_launch);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &app->on_terminate);
  assert(err == 0);

  err = js_create_reference(env, argv[3], 1, &app->on_suspend);
  assert(err == 0);

  err = js_create_reference(env, argv[4], 1, &app->on_resume);
  assert(err == 0);

  err = js_create_reference(env, argv[5], 1, &app->on_message);
  assert(err == 0);

  uv_loop_t *loop;
  err = js_get_env_loop(env, &loop);
  assert(err == 0);

  err = fx_init(loop, &app->app);
  assert(err == 0);

  err = fx_set_data(app->app, (void *) app);
  assert(err == 0);

  err = fx_on_suspend(app->app, fx_native__on_suspend);
  assert(err == 0);

  err = fx_on_resume(app->app, fx_native__on_resume);
  assert(err == 0);

  err = fx_read_start(app->app, fx_native__on_message);
  assert(err == 0);

  return handle;
}

static js_value_t *
fx_native_destroy(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  err = fx_destroy(app->app);
  assert(err == 0);

  err = js_delete_reference(env, app->on_launch);
  assert(err == 0);

  err = js_delete_reference(env, app->on_terminate);
  assert(err == 0);

  err = js_delete_reference(env, app->on_suspend);
  assert(err == 0);

  err = js_delete_reference(env, app->on_resume);
  assert(err == 0);

  err = js_delete_reference(env, app->on_message);
  assert(err == 0);

  err = js_delete_reference(env, app->ctx);
  assert(err == 0);

  return NULL;
}

static void
fx_native__on_launch(fx_t *fx_app) {
  int err;

  fx_native_t *app;
  err = fx_get_data(fx_app, (void **) &app);
  assert(err == 0);

  js_env_t *env = app->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, app->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_launch;
  err = js_get_reference_value(env, app->on_launch, &on_launch);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_launch, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
fx_native__on_terminate(fx_t *fx_app) {
  int err;

  fx_native_t *app;
  err = fx_get_data(fx_app, (void **) &app);
  assert(err == 0);

  err = fx_read_stop(app->app);
  assert(err == 0);

  js_env_t *env = app->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, app->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_terminate;
  err = js_get_reference_value(env, app->on_terminate, &on_terminate);
  assert(err == 0);

  js_call_function_with_checkpoint(env, ctx, on_terminate, 0, NULL, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
fx_native_run(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  err = fx_run(app->app, fx_native__on_launch, fx_native__on_terminate);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_is_main(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  js_value_t *result;
  err = js_get_boolean(env, fx_is_main(app->app), &result);
  assert(err == 0);

  return result;
}

static js_value_t *
fx_native_broadcast(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  fx_native_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  void *data;
  size_t len;
  err = js_get_typedarray_info(env, argv[1], NULL, &data, &len, NULL, NULL);
  assert(err == 0);

  uv_buf_t buf = uv_buf_init(data, len);

  err = fx_broadcast(app->app, &buf);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_APP_H
