#pragma once

#include <napi.h>

#include <cmath>
#include <limits>

#include "../cpp/encoder.h"

using namespace Napi;

class Encoder {
  static constexpr size_t DEFAULT_RECURSE_LIMIT = 256;
  static constexpr size_t INITIAL_BUFFER_SIZE = 2048;

 public:
  Encoder(Env env) : env(env) {
    pk.buf = new char[INITIAL_BUFFER_SIZE];
    pk.length = 0;
    pk.allocated_size = INITIAL_BUFFER_SIZE;

    int ret(erlpack_append_version(&pk));
    if (ret == -1) {
      Error::New(env, "Unable to allocate large buffer for encoding.")
          .ThrowAsJavaScriptException();
    }
  }

  Object releaseAsBuffer() {
    if (pk.buf == nullptr) {
      return Object::New(env);
    }
    auto buffer(Buffer<char>::New(env, pk.length));
    memcpy(buffer.Data(), pk.buf, pk.length);
    pk.length = 0;
    erlpack_append_version(&pk);
    return buffer;
  }

  ~Encoder() {
    delete[] pk.buf;

    pk.buf = nullptr;
    pk.length = 0;
    pk.allocated_size = 0;
  }

  int pack(Value value, const int nestLimit = DEFAULT_RECURSE_LIMIT) {
    if (nestLimit < 0) {
      Error::New(env, "Reached recursion limit").ThrowAsJavaScriptException();
      return -1;
    }

    if (value.IsBigInt()) {
      bool lossless;
      return erlpack_append_long_long(
          &pk, (long long)value.As<BigInt>().Int64Value(&lossless));
    } else if (value.IsNumber()) {
      double number(value.As<Number>().DoubleValue());
      if (std::fmod(number, 1) == 0) {
        if (number >= 0 && number <= UCHAR_MAX) {
          return erlpack_append_small_integer(&pk, (unsigned char)number);
        } else if (number >= INT32_MIN && number <= INT32_MAX) {
          return erlpack_append_integer(&pk, number);
        } else if (number >= 0 && number <= UINT32_MAX) {
          return erlpack_append_unsigned_long_long(&pk,
                                                   (unsigned long long)number);
        } else {
          return erlpack_append_double(&pk, number);
        }
      } else {
        return erlpack_append_double(&pk, number);
      }
    } else if (value.IsNull() || value.IsUndefined()) {
      return erlpack_append_nil(&pk);
    } else if (value.IsBoolean()) {
      return value.ToBoolean() ? erlpack_append_true(&pk)
                               : erlpack_append_false(&pk);
    } else if (value.IsString()) {
      const std::string string(value.ToString().Utf8Value());
      return erlpack_append_binary(&pk, string.c_str(), string.length());
    } else if (value.IsArray()) {
      auto array(value.ToObject());
      const auto properties(array.GetPropertyNames());
      const uint32_t length(properties.Length());
      if (length == 0) {
        return erlpack_append_nil_ext(&pk);
      } else {
        if (length > std::numeric_limits<uint32_t>::max() - 1) {
          Error::New(env, "List is too large.").ThrowAsJavaScriptException();
          return -1;
        }

        const int ret(erlpack_append_list_header(&pk, length));
        if (ret != 0) {
          return ret;
        }

        for (uint32_t i = 0; i < length; ++i) {
          const auto k(properties.Get(i));
          const auto v(array.Get(k));
          const int ret(pack(v, nestLimit - 1));
          if (ret != 0) {
            return ret;
          }
        }

        return erlpack_append_nil_ext(&pk);
      }
    } else if (value.IsObject()) {
      auto object(value.ToObject());
      const auto properties(object.GetPropertyNames());

      const uint32_t len(properties.Length());
      if (len > std::numeric_limits<uint32_t>::max() - 1) {
        Error::New(env, "Dictionary has too many properties.")
            .ThrowAsJavaScriptException();
        return -1;
      }

      int ret(erlpack_append_map_header(&pk, len));
      if (ret != 0) {
        return ret;
      }

      for (uint32_t i = 0; i < len; ++i) {
        const auto k(properties.Get(i));
        const auto v(object.Get(k));

        std::string kStr(k.ToString());
        const int kRet(pack(
            std::all_of(kStr.begin(), kStr.end(), ::isdigit) ? k.ToNumber() : k,
            nestLimit - 1));
        if (kRet != 0) {
          return kRet;
        }

        const int vRet(pack(v, nestLimit - 1));
        if (vRet != 0) {
          return vRet;
        }
      }
    }

    return 0;
  }

 private:
  const Env env;
  erlpack_buffer pk;
};
