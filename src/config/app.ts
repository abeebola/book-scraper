import { LogLevel } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import Joi from 'joi';
import { APP_NAME, APP_VERSION } from '../common/constants';

const environments = ['production', 'development', 'staging', 'test'] as const;

type Environment = (typeof environments)[number];

const logLevels: readonly LogLevel[] = [
  'debug',
  'error',
  'log',
  'verbose',
  'warn',
];

export type AppConfig = {
  name: string;
  version: string;
  environment: Environment;
  server: {
    host: string;
    port: number;
  };
  swagger: {
    enabled: boolean;
  };
  log: {
    name: string;
    version: string;
    level: LogLevel;
  };
};

const schema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().min(3).required(),
  environment: Joi.string()
    .valid(...environments)
    .required(),
  server: Joi.object({
    port: Joi.number().integer().min(0).required(),
    host: Joi.string().min(5).required(),
  }),
  swagger: Joi.object({
    enabled: Joi.boolean().required(),
  }),
  log: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().min(3).required(),
    level: Joi.string()
      .valid(...logLevels)
      .required(),
  }),
});

export const getConfig = () => {
  const name = process.env.APP_NAME ?? APP_NAME;
  process.env.APP_NAME = name;

  const version = process.env.VERSION ?? APP_VERSION;

  const environment = (process.env.ENVIRONMENT ??
    process.env.NODE_ENV ??
    'development') as Environment;
  return {
    name,
    version,
    environment,
    server: {
      host: process.env.SERVER_HOST ?? process.env.HOST ?? '0.0.0.0',
      port: Number(process.env.SERVER_PORT ?? process.env.PORT ?? 8000),
    },
    swagger: {
      enabled:
        (process.env.SWAGGER_ENABLED ?? 'false').trim().toLowerCase() ===
        'true',
    },
    log: {
      name,
      version,
      level: (process.env.LOG_LEVEL ?? 'log') as LogLevel,
    },
  };
};

export default registerAs('app', (): AppConfig => {
  const config = getConfig();
  Joi.assert(config, schema, 'App config validation failed');
  return config;
});
