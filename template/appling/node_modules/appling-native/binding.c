#include <appling.h>
#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdlib.h>
#include <utf.h>
#include <uv.h>

#ifndef thread_local
#ifdef _WIN32
#define thread_local __declspec(thread)
#else
#define thread_local _Thread_local
#endif
#endif

typedef struct {
  appling_app_t handle;
} appling_native_app_t;

typedef struct {
  appling_platform_t handle;
} appling_native_platform_t;

typedef struct {
  appling_link_t handle;
} appling_native_link_t;

typedef struct {
  appling_lock_t handle;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_lock;

  bool exiting;
  bool locked;
} appling_native_lock_t;

typedef struct {
  appling_resolve_t handle;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_resolve;

  bool exiting;

  js_deferred_teardown_t *teardown;
} appling_native_resolve_t;

typedef struct {
  js_env_t *env;

  js_value_t *ctx;
  js_value_t *on_progress;
} appling_native_progress_context_t;

static js_value_t *
appling_native_platform(js_env_t *env, js_callback_info_t *info) {
  int err;

  js_value_t *handle;

  appling_native_platform_t *platform;
  err = js_create_arraybuffer(env, sizeof(appling_native_platform_t), (void **) &platform, &handle);
  assert(err == 0);

  return handle;
}

static js_value_t *
appling_native_app(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  appling_path_t path;
  err = js_get_value_string_utf8(env, argv[0], (utf8_t *) path, sizeof(appling_path_t), NULL);
  assert(err == 0);

  appling_id_t id;
  err = js_get_value_string_utf8(env, argv[1], (utf8_t *) id, sizeof(appling_id_t), NULL);
  assert(err == 0);

  js_value_t *handle;

  appling_native_app_t *app;
  err = js_create_arraybuffer(env, sizeof(appling_native_app_t), (void **) &app, &handle);
  assert(err == 0);

  memcpy(&app->handle.path, path, sizeof(app->handle.path));
  memcpy(&app->handle.id, id, sizeof(app->handle.id));

  return handle;
}

static js_value_t *
appling_native_parse(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  size_t len;
  err = js_get_value_string_utf8(env, argv[0], NULL, 0, &len);
  assert(err == 0);

  len += 1 /* NULL */;

  utf8_t *input = malloc(len);
  err = js_get_value_string_utf8(env, argv[0], input, len, NULL);
  assert(err == 0);

  js_value_t *handle;

  appling_native_link_t *link;
  err = js_create_arraybuffer(env, sizeof(appling_native_link_t), (void **) &link, &handle);
  assert(err == 0);

  err = appling_parse((char *) input, &link->handle);

  free(input);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  return handle;
}

static void
appling_native__on_lock_teardown(void *data) {
  int err;

  appling_native_lock_t *req = data;

  req->exiting = true;

  if (!req->locked) return;

  js_env_t *env = req->env;

  err = appling_unlock(&req->handle);
  assert(err == 0);

  err = js_delete_reference(env, req->on_lock);
  assert(err == 0);

  err = js_delete_reference(env, req->ctx);
  assert(err == 0);
}

static void
appling_native__on_lock(appling_lock_t *handle, int status) {
  int err;

  appling_native_lock_t *req = (appling_native_lock_t *) handle;

  js_env_t *env = req->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, req->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_lock;
  err = js_get_reference_value(env, req->on_lock, &on_lock);
  assert(err == 0);

  js_value_t *argv[2];

  if (status < 0) {
    js_value_t *code;
    err = js_create_string_utf8(env, (const utf8_t *) uv_err_name(status), -1, &code);
    assert(err == 0);

    js_value_t *message;
    err = js_create_string_utf8(env, (const utf8_t *) uv_strerror(status), -1, &message);
    assert(err == 0);

    err = js_create_error(env, code, message, &argv[0]);
    assert(err == 0);

    err = js_get_null(env, &argv[1]);
    assert(err == 0);

    err = js_remove_teardown_callback(env, appling_native__on_lock_teardown, req);
  } else {
    err = js_get_null(env, &argv[0]);
    assert(err == 0);

    err = js_create_string_utf8(env, (utf8_t *) req->handle.dir, -1, &argv[1]);
    assert(err == 0);

    req->locked = true;

    if (req->exiting) {
      err = appling_unlock(&req->handle);
      assert(err == 0);

      err = js_delete_reference(env, req->on_lock);
      assert(err == 0);

      err = js_delete_reference(env, req->ctx);
      assert(err == 0);
    }
  }

  if (!req->exiting) {
    err = js_call_function(env, ctx, on_lock, 2, argv, NULL);
    (void) err;
  }

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
appling_native_lock(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bool has_dir;
  err = js_is_string(env, argv[0], &has_dir);
  assert(err == 0);

  utf8_t *dir = NULL;

  if (has_dir) {
    size_t len;
    err = js_get_value_string_utf8(env, argv[0], NULL, 0, &len);
    assert(err == 0);

    len += 1 /* NULL */;

    dir = malloc(len);
    err = js_get_value_string_utf8(env, argv[0], dir, len, NULL);
    assert(err == 0);
  }

  uv_loop_t *loop;
  err = js_get_env_loop(env, &loop);
  assert(err == 0);

  js_value_t *handle;

  appling_native_lock_t *req;
  err = js_create_arraybuffer(env, sizeof(appling_native_lock_t), (void **) &req, &handle);
  assert(err == 0);

  req->env = env;
  req->exiting = false;
  req->locked = false;

  err = appling_lock(loop, &req->handle, (char *) dir, appling_native__on_lock);

  free(dir);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  err = js_create_reference(env, argv[1], 1, &req->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->on_lock);
  assert(err == 0);

  err = js_add_teardown_callback(env, appling_native__on_lock_teardown, req);
  assert(err == 0);

  return handle;
}

static js_value_t *
appling_native_unlock(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  appling_native_lock_t *req;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &req, NULL);
  assert(err == 0);

  err = appling_unlock(&req->handle);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  err = js_delete_reference(env, req->on_lock);
  assert(err == 0);

  err = js_delete_reference(env, req->ctx);
  assert(err == 0);

  err = js_remove_teardown_callback(env, appling_native__on_lock_teardown, req);
  assert(err == 0);

  return NULL;
}

static void
appling_native__on_resolve(appling_resolve_t *handle, int status) {
  int err;

  appling_native_resolve_t *req = (appling_native_resolve_t *) handle;

  js_env_t *env = req->env;

  js_deferred_teardown_t *teardown = req->teardown;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, req->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_resolve;
  err = js_get_reference_value(env, req->on_resolve, &on_resolve);
  assert(err == 0);

  err = js_delete_reference(env, req->on_resolve);
  assert(err == 0);

  err = js_delete_reference(env, req->ctx);
  assert(err == 0);

  js_value_t *argv[1];

  if (status < 0) {
    js_value_t *code;
    err = js_create_string_utf8(env, (const utf8_t *) uv_err_name(status), -1, &code);
    assert(err == 0);

    js_value_t *message;
    err = js_create_string_utf8(env, (const utf8_t *) uv_strerror(status), -1, &message);
    assert(err == 0);

    err = js_create_error(env, code, message, &argv[0]);
    assert(err == 0);
  } else {
    err = js_get_null(env, &argv[0]);
    assert(err == 0);
  }

  if (!req->exiting) {
    err = js_call_function(env, ctx, on_resolve, 1, argv, NULL);
    (void) err;
  }

  err = js_close_handle_scope(env, scope);
  assert(err == 0);

  err = js_finish_deferred_teardown_callback(teardown);
  assert(err == 0);
}

static void
appling_native__on_resolve_teardown(js_deferred_teardown_t *teardown, void *data) {
  appling_native_lock_t *req = data;

  req->exiting = true;
}

static js_value_t *
appling_native_resolve(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bool has_dir;
  err = js_is_string(env, argv[0], &has_dir);
  assert(err == 0);

  utf8_t *dir = NULL;

  if (has_dir) {
    size_t len;
    err = js_get_value_string_utf8(env, argv[0], NULL, 0, &len);
    assert(err == 0);

    len += 1 /* NULL */;

    dir = malloc(len);
    err = js_get_value_string_utf8(env, argv[0], dir, len, NULL);
    assert(err == 0);
  }

  appling_native_platform_t *platform;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &platform, NULL);
  assert(err == 0);

  uv_loop_t *loop;
  err = js_get_env_loop(env, &loop);
  assert(err == 0);

  js_value_t *handle;

  appling_native_resolve_t *req;
  err = js_create_arraybuffer(env, sizeof(appling_native_resolve_t), (void **) &req, &handle);
  assert(err == 0);

  req->env = env;
  req->exiting = false;

  err = appling_resolve(loop, &req->handle, (char *) dir, &platform->handle, appling_native__on_resolve);

  free(dir);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  err = js_create_reference(env, argv[2], 1, &req->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[3], 1, &req->on_resolve);
  assert(err == 0);

  err = js_add_deferred_teardown_callback(env, appling_native__on_resolve_teardown, req, &req->teardown);
  assert(err == 0);

  return handle;
}

static js_value_t *
appling_native_ready(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  appling_native_platform_t *platform;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &platform, NULL);
  assert(err == 0);

  appling_native_link_t *link;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &link, NULL);
  assert(err == 0);

  err = appling_ready(&platform->handle, &link->handle);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  js_value_t *result;
  err = js_get_boolean(env, err == 1, &result);
  assert(err == 0);

  return result;
}

static thread_local appling_native_progress_context_t *appling_native__progress_context;

static void
appling_native_preflight__on_progress(const appling_progress_info_t *info) {
  int err;

  appling_native_progress_context_t *context = appling_native__progress_context;

  js_env_t *env = context->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *result;
  err = js_create_object(env, &result);
  assert(err == 0);

#define V(name, value, type) \
  { \
    js_value_t *v; \
    err = js_create_##type(env, value, &v); \
    assert(err == 0); \
    err = js_set_named_property(env, result, name, v); \
    assert(err == 0); \
  }

  V("peers", info->peers, int64);
  V("uploadSpeed", info->upload_speed, double);
  V("uploadedBytes", info->uploaded_bytes, int64);
  V("uploadedBlocks", info->uploaded_blocks, int64);
  V("downloadSpeed", info->download_speed, double);
  V("downloadProgress", info->download_progress, double);
  V("downloadedBytes", info->downloaded_bytes, int64);
  V("downloadedBlocks", info->downloaded_blocks, int64);
#undef V

  js_value_t *args[1] = {result};

  err = js_call_function(env, context->ctx, context->on_progress, 1, args, NULL);
  (void) err;

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
appling_native_preflight(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  appling_native_platform_t *platform;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &platform, NULL);
  assert(err == 0);

  appling_native_link_t *link;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &link, NULL);
  assert(err == 0);

  js_value_t *global;
  err = js_get_global(env, &global);
  assert(err == 0);

  appling_native_progress_context_t context = {
    .env = env,
    .ctx = global,
    .on_progress = argv[2],
  };

  appling_native__progress_context = &context;

  err = appling_preflight(&platform->handle, &link->handle, appling_native_preflight__on_progress);

  appling_native__progress_context = NULL;

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
appling_native_launch(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  appling_native_platform_t *platform;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &platform, NULL);
  assert(err == 0);

  appling_native_app_t *app;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &app, NULL);
  assert(err == 0);

  appling_native_link_t *link;
  err = js_get_arraybuffer_info(env, argv[2], (void **) &link, NULL);
  assert(err == 0);

  err = appling_launch(&platform->handle, &app->handle, &link->handle);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
appling_native_open(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  appling_native_app_t *app;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &app, NULL);
  assert(err == 0);

  bool has_arg;
  err = js_is_string(env, argv[1], &has_arg);
  assert(err == 0);

  utf8_t *arg = NULL;

  if (has_arg) {
    size_t len;
    err = js_get_value_string_utf8(env, argv[1], NULL, 0, &len);
    assert(err == 0);

    len += 1 /* NULL */;

    arg = malloc(len);
    err = js_get_value_string_utf8(env, argv[1], arg, len, NULL);
    assert(err == 0);
  }

  err = appling_open(&app->handle, (char *) arg);

  free(arg);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
appling_native_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("app", appling_native_app)
  V("platform", appling_native_platform)
  V("parse", appling_native_parse)
  V("lock", appling_native_lock)
  V("unlock", appling_native_unlock)
  V("resolve", appling_native_resolve)
  V("ready", appling_native_ready)
  V("preflight", appling_native_preflight)
  V("launch", appling_native_launch)
  V("open", appling_native_open)
#undef V

  return exports;
}

BARE_MODULE(appling_native, appling_native_exports)
