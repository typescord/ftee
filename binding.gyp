{
  "targets": [
    {
      "target_name": "<(module_name)",
      "product_dir": "<(module_path)",
      "cflags": [ "-fexceptions" ],
      "cflags_cc": [ "-fexceptions" ],
      "xcode_settings": {
        'OTHER_CFLAGS': [ "-fexceptions" ],
      },
      'sources': [
        'src/erlpack.cc'
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
