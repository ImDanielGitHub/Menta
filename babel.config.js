module.exports = function (api) {
  const isTest = api.env('test');
  const plugins = [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ];

  if (isTest) {
    plugins.unshift(function transformDynamicImportForJest({ types: t }) {
      return {
        visitor: {
          CallExpression(path) {
            if (path.node.callee.type !== 'Import') return;

            const [source] = path.node.arguments;
            path.replaceWith(
              t.callExpression(
                t.memberExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier('Promise'),
                      t.identifier('resolve')
                    ),
                    []
                  ),
                  t.identifier('then')
                ),
                [
                  t.arrowFunctionExpression(
                    [],
                    t.callExpression(t.identifier('require'), [source])
                  ),
                ]
              )
            );
          },
        },
      };
    });
  }

  plugins.push([
    'react-native-worklets/plugin',
    { bundleMode: true, strictGlobal: true },
  ]);

  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins,
  };
};
