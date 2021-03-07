#include <napi.h>

#include "decoder.h"
#include "encoder.h"

using namespace Napi;

Value Pack(const CallbackInfo& args) {
  const Env env(args.Env());
  Encoder encoder(env);

  const int ret = encoder.pack(args[0]);
  if (ret == -1) {
    Error::New(env, "Out of memory.").ThrowAsJavaScriptException();
    return env.Undefined();
  } else if (ret > 0) {
    Error::New(env, "Unknown error.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  return encoder.releaseAsBuffer();
}

Value Unpack(const CallbackInfo& args) {
  const Env env(args.Env());
  const Value data = args[0];
  if (!data.IsBuffer() || !data.IsTypedArray()) {
    TypeError::New(env, "Data must be a Buffer or a typed array.")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }
  TypedArrayOf<uint8_t> contents(data.As<TypedArrayOf<uint8_t>>());

  if (contents.ByteLength() == 0) {
    Error::New(env, "Zero length buffer.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Decoder decoder(env, contents);
  return decoder.unpack();
}

Object Init(Env env, Object exports) {
  exports.Set("pack", Function::New(env, Pack, "pack"));
  exports.Set("unpack", Function::New(env, Unpack, "pack"));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init);
