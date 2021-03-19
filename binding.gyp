{
  'targets': [
    {
      'target_name': '<(module_name)',
      'product_dir': '<(module_path)',
      'sources': [
        'src/erlpack.cc',
      ],
      'include_dirs': [
        '<!@(node -p "require(\'node-addon-api\').include")',
      ],
      'dependencies': [
        '<!@(node -p "require(\'node-addon-api\').gyp")',
      ],
			'cflags!': ['-fno-exceptions'],
      'cflags_cc!': ['-fno-exceptions'],
      'cflags': ['-Wall', '-Wextra'],
      'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
    },
  ],
}
