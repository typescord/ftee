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
  TypedArrayOf<uint8_t> contents(args[0].As<TypedArrayOf<uint8_t>>());

  if (contents.ByteLength() == 0) {
    Error::New(env, "Zero length buffer.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Decoder decoder(env, contents);
  return decoder.unpack();
}

Object Init(Env env, Object exports) {
  exports.Set("pack", Function::New(env, Pack));
  exports.Set("unpack", Function::New(env, Unpack));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init);
