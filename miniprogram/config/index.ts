import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@tarojs/cli';

export default defineConfig<'webpack5'>({
  projectName: 'guess-master-miniprogram',
  date: '2026-6-5',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-platform-weapp', '@tarojs/plugin-framework-react'],
  framework: 'react',
  compiler: 'webpack5',
  alias: {
    '@shared': path.resolve(__dirname, '..', '..', 'src'),
  },
  mini: {
    compile: {
      include: [path.resolve(__dirname, '..', '..', 'src')],
    },
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: '/',
  },
}) satisfies UserConfigExport<'webpack5'>;
