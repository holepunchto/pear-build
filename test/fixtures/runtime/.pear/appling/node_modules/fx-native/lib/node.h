#ifndef FX_NATIVE_NODE_H
#define FX_NATIVE_NODE_H

#include <assert.h>
#include <fx.h>
#include <js.h>
#include <uv.h>

typedef struct {
  fx_node_t *node;
} fx_native_node_t;

static js_value_t *
fx_native_set_child(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  fx_native_node_t *parent;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parent, NULL);
  assert(err == 0);

  fx_native_node_t *child;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &child, NULL);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[2], &index);
  assert(err == 0);

  err = fx_set_child(parent->node, child->node, index);
  assert(err == 0);

  return NULL;
}

static js_value_t *
fx_native_unset_child(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  fx_native_node_t *parent;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &parent, NULL);
  assert(err == 0);

  fx_native_node_t *child;
  err = js_get_arraybuffer_info(env, argv[1], (void **) &child, NULL);
  assert(err == 0);

  uint32_t index;
  err = js_get_value_uint32(env, argv[2], &index);
  assert(err == 0);

  err = fx_unset_child(parent->node, child->node, index);
  assert(err == 0);

  return NULL;
}

#endif // FX_NATIVE_TEXT_H
