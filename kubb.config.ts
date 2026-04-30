import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginReactQuery } from '@kubb/plugin-react-query';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';

const API_OPENAPI_URL =
  process.env.API_OPENAPI_URL ?? 'http://localhost:3000/api/v1/openapi.json';

export default defineConfig({
  root: '.',
  input: { path: API_OPENAPI_URL },
  output: {
    path: './lib/generated',
    clean: true,
    barrelType: 'named',
  },
  plugins: [
    pluginOas({ validate: true, generators: [] }),
    pluginTs({
      output: { path: './types' },
      enumType: 'asConst',
      dateType: 'string',
      unknownType: 'unknown',
    }),
    pluginZod({
      output: { path: './schemas' },
      version: '4',
      typed: true,
      dateType: 'stringOffset',
    }),
    pluginClient({
      output: { path: './client' },
      client: 'axios',
      dataReturnType: 'data',
      baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    }),
    pluginReactQuery({
      output: { path: './hooks' },
      client: { importPath: '../client' },
    }),
  ],
});
