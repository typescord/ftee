#pragma once

#if !defined(__STDC_FORMAT_MACROS)
#define __STDC_FORMAT_MACROS
#endif

#include <napi.h>
#include <zlib.h>

#include <cinttypes>
#include <cstdio>

#include "../cpp/constants.h"
#include "../cpp/sysdep.h"

using namespace Napi;

#define THROW(env, msg)                              \
  Error::New(env, msg).ThrowAsJavaScriptException(); \
  isInvalid = true;

class Decoder {
  static constexpr uint8_t FLOAT_LENGTH = 31;

 public:
  Decoder(const Env env, const TypedArrayOf<uint8_t>& array,
          const bool decodeBigint)
      : data(array.Data()),
        size(array.ByteLength()),
        isInvalid(false),
        offset(0),
        decodeBigint(decodeBigint),
        env(env) {
    const auto version(read8());
    if (version != FORMAT_VERSION) {
      THROW(env, "Bad version number.");
    }
  }

  Decoder(const Env env, const uint8_t* data_, const size_t length_,
          const bool decodeBigint, const bool skipVersion = false)
      : data(data_),
        size(length_),
        isInvalid(false),
        offset(0),
        decodeBigint(decodeBigint),
        env(env) {
    if (!skipVersion) {
      const auto version(read8());
      if (version != FORMAT_VERSION) {
        THROW(env, "Bad version number.");
      }
    }
  }

  uint8_t read8() {
    if (offset + sizeof(uint8_t) > size) {
      THROW(env, "Reading a byte passes the end of the buffer.");
      return 0;
    }
    auto val(*reinterpret_cast<const uint8_t*>(data + offset));
    offset += sizeof(uint8_t);
    return val;
  }

  uint16_t read16() {
    if (offset + sizeof(uint16_t) > size) {
      THROW(env, "Reading two bytes passes the end of the buffer.");
      return 0;
    }

    uint16_t val(
        _erlpack_be16(*reinterpret_cast<const uint16_t*>(data + offset)));
    offset += sizeof(uint16_t);
    return val;
  }

  uint32_t read32() {
    if (offset + sizeof(uint32_t) > size) {
      THROW(env, "Reading three bytes passes the end of the buffer.");
      return 0;
    }

    uint32_t val(
        _erlpack_be32(*reinterpret_cast<const uint32_t*>(data + offset)));
    offset += sizeof(uint32_t);
    return val;
  }

  uint64_t read64() {
    if (offset + sizeof(uint64_t) > size) {
      THROW(env, "Reading four bytes passes the end of the buffer.");
      return 0;
    }

    uint64_t val(
        _erlpack_be64(*reinterpret_cast<const uint64_t*>(data + offset)));
    offset += sizeof(val);
    return val;
  }

  Number decodeSmallInteger() { return Number::New(env, read8()); }

  Number decodeInteger() { return Number::New(env, (int32_t)read32()); }

  Value decodeArray(uint32_t length) {
    Array array(Array::New(env, length));
    for (uint32_t i = 0; i < length; ++i) {
      auto value(unpack());
      if (isInvalid) {
        return env.Undefined();
      }
      array.Set(i, value);
    }
    return array;
  }

  Value decodeList() {
    const uint32_t length(read32());
    auto array(decodeArray(length));

    const auto tailMarker(read8());
    if (tailMarker != NIL_EXT) {
      THROW(env, "List doesn't end with a tail marker, but it must!");
      return env.Undefined();
    }

    return array;
  }

  Value decodeTuple(uint32_t length) { return decodeArray(length); }

  Array decodeNil() { return Array::New(env, 0); }

  Value decodeMap() {
    const uint32_t length(read32());
    auto map(Object::New(env));

    for (uint32_t i = 0; i < length; ++i) {
      const auto key(unpack());
      const auto value(unpack());
      if (isInvalid) {
        return env.Undefined();
      }
      map.Set(key, value);
    }

    return map;
  }

  const char* readString(uint32_t length) {
    if (offset + length > size) {
      THROW(env, "Reading sequence past the end of the buffer.");
      return nullptr;
    }

    const uint8_t* str(data + offset);
    offset += length;
    return (const char*)str;
  }

  Value processAtom(const char* atom, uint16_t length) {
    if (atom == nullptr) {
      return env.Undefined();
    }

    if (length >= 3 && length <= 5) {
      if (length == 3 && strncmp(atom, "nil", 3) == 0) {
        return env.Null();
      } else if (length == 4 && strncmp(atom, "null", 4) == 0) {
        return env.Null();
      } else if (length == 4 && strncmp(atom, "true", 4) == 0) {
        return Boolean::New(env, true);
      } else if (length == 5 && strncmp(atom, "false", 5) == 0) {
        return Boolean::New(env, false);
      }
    }
    return String::New(env, atom, length);
  }

  Value decodeAtom() {
    auto length(read16());
    const char* atom(readString(length));
    return processAtom(atom, length);
  }

  Value decodeSmallAtom() {
    auto length(read8());
    const char* atom(readString(length));
    return processAtom(atom, length);
  }

  Value decodeFloat() {
    const char* floatStr(readString(FLOAT_LENGTH));
    if (floatStr == nullptr) {
      return env.Undefined();
    }

    double number;
    char nullTerimated[FLOAT_LENGTH + 1] = {0};
    memcpy(nullTerimated, floatStr, FLOAT_LENGTH);

    auto count(sscanf(nullTerimated, "%lf", &number));
    if (count != 1) {
      THROW(env, "Invalid float encoded.");
      return env.Undefined();
    }
    return Number::New(env, number);
  }

  Number decodeNewFloat() {
    union {
      uint64_t ui64;
      double df;
    } val;
    val.ui64 = read64();

    return Number::New(env, val.df);
  }

  Value decodeBig(uint32_t digits) {
    const uint8_t sign(read8());

    if (digits > 8) {
      THROW(env, "Unable to decode big ints larger than 8 bytes");
      return env.Undefined();
    }

    uint64_t value = 0;
    for (uint32_t i = 0; i < digits; ++i) {
      value |= uint64_t(read8()) << i * 8;
    }

    if (decodeBigint) {
      return sign == 0 ? BigInt::New(env, value)
                       : BigInt::New(env, -static_cast<int64_t>(value));
    }

    if (digits <= 4) {
      if (sign == 0) {
        return Number::New(env, static_cast<uint32_t>(value));
      }

      const bool isSignBitAvailable((value & (1 << 31)) == 0);
      if (isSignBitAvailable) {
        return Number::New(env, -static_cast<int32_t>(value));
      }
    }

    char outBuffer[32] = {0};  // 9223372036854775807
    const char* const formatString(sign == 0 ? "%" PRIu64 : "-%" PRIu64);
    const int res(sprintf(outBuffer, formatString, value));

    if (res < 0) {
      THROW(env, "Unable to convert big int to string");
      return env.Undefined();
    }
    const uint8_t length(static_cast<const uint8_t>(res));

    return String::New(env, outBuffer, length);
  }

  Value decodeSmallBig() {
    const auto bytes(read8());
    return decodeBig(bytes);
  }

  Value decodeLargeBig() {
    const auto bytes(read32());
    return decodeBig(bytes);
  }

  Value decodeBinaryAsString() {
    const auto length(read32());
    const char* str(readString(length));
    if (str == nullptr) {
      return env.Undefined();
    }
    return String::New(env, str, length);
  }

  Value decodeString() {
    const auto length(read16());
    const char* str(readString(length));
    if (str == nullptr) {
      return env.Undefined();
    }
    return String::New(env, str, length);
  }

  Value decodeStringAsList() {
    const auto length(read16());
    if (offset + length > size) {
      THROW(env, "Reading sequence past the end of the buffer.");
      return env.Undefined();
    }

    Array array(Array::New(env, length));
    for (uint16_t i = 0; i < length; ++i) {
      array.Set(i, decodeSmallInteger());
    }

    return array;
  }

  Value decodeSmallTuple() { return decodeTuple(read8()); }

  Value decodeLargeTuple() { return decodeTuple(read32()); }

  Value decodeCompressed() {
    const uint32_t uncompressedSize(read32());

    unsigned long sourceSize(uncompressedSize);
    uint8_t* outBuffer = new uint8_t[uncompressedSize];
    const int ret = uncompress(outBuffer, &sourceSize,
                               (const unsigned char*)(data + offset),
                               (uLong)(size - offset));

    offset += sourceSize;
    if (ret != Z_OK) {
      delete[] outBuffer;
      THROW(env, "Failed to uncompresss compressed item");
      return env.Null();
    }

    Decoder children(env, outBuffer, uncompressedSize, true, true);
    Value value(children.unpack());
    delete[] outBuffer;
    return value;
  }

  Value decodeReference() {
    auto reference(Object::New(env));
    reference.Set(String::New(env, "node"), unpack());

    Array ids(Array::New(env, 1));
    ids.Set(Number::New(env, 0), Number::New(env, read32()));
    reference.Set(String::New(env, "id"), ids);

    reference.Set(String::New(env, "creation"), Number::New(env, read8()));

    return reference;
  }

  Value decodeNewReference() {
    auto reference(Object::New(env));

    uint16_t len(read16());
    reference.Set(String::New(env, "node"), unpack());
    reference.Set(String::New(env, "creation"), Number::New(env, read8()));

    Array ids(Array::New(env, len));
    for (uint16_t i = 0; i < len; ++i) {
      ids.Set(i, Number::New(env, read32()));
    }
    reference.Set(String::New(env, "id"), ids);

    return reference;
  }

  Value decodePort() {
    auto port(Object::New(env));
    port.Set(String::New(env, "node"), unpack());
    port.Set(String::New(env, "id"), Number::New(env, read32()));
    port.Set(String::New(env, "creation"), Number::New(env, read8()));
    return port;
  }

  Value decodePID() {
    auto pid(Object::New(env));
    pid.Set(String::New(env, "node"), unpack());
    pid.Set(String::New(env, "id"), Number::New(env, read32()));
    pid.Set(String::New(env, "serial"), Number::New(env, read32()));
    pid.Set(String::New(env, "creation"), Number::New(env, read8()));
    return pid;
  }

  Value decodeExport() {
    auto exp(Object::New(env));
    exp.Set(String::New(env, "mod"), unpack());
    exp.Set(String::New(env, "fun"), unpack());
    exp.Set(String::New(env, "arity"), unpack());
    return exp;
  }

  Value unpack() {
    if (isInvalid) {
      return env.Undefined();
    }

    if (offset >= size) {
      THROW(env, "Unpacking beyond the end of the buffer");
      return env.Undefined();
    }

    const auto type(read8());
    switch (type) {
      case SMALL_INTEGER_EXT:
        return decodeSmallInteger();
      case INTEGER_EXT:
        return decodeInteger();
      case FLOAT_EXT:
        return decodeFloat();
      case NEW_FLOAT_EXT:
        return decodeNewFloat();
      case ATOM_EXT:
        return decodeAtom();
      case SMALL_ATOM_EXT:
        return decodeSmallAtom();
      case SMALL_TUPLE_EXT:
        return decodeSmallTuple();
      case LARGE_TUPLE_EXT:
        return decodeLargeTuple();
      case NIL_EXT:
        return decodeNil();
      case STRING_EXT:
        return decodeStringAsList();
      case LIST_EXT:
        return decodeList();
      case MAP_EXT:
        return decodeMap();
      case BINARY_EXT:
        return decodeBinaryAsString();
      case SMALL_BIG_EXT:
        return decodeSmallBig();
      case LARGE_BIG_EXT:
        return decodeLargeBig();
      case REFERENCE_EXT:
        return decodeReference();
      case NEW_REFERENCE_EXT:
        return decodeNewReference();
      case PORT_EXT:
        return decodePort();
      case PID_EXT:
        return decodePID();
      case EXPORT_EXT:
        return decodeExport();
      case COMPRESSED:
        return decodeCompressed();
      default:
        THROW(env, "Unsupported erlang term type identifier found");
        return env.Undefined();
    }
  }

 private:
  const uint8_t* const data;
  const size_t size;
  bool isInvalid;
  size_t offset;
  const bool decodeBigint;
  const Env env;
};
