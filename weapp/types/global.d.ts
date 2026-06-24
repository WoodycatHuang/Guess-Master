/// <reference types="@tarojs/taro" />

declare module '*.scss';

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_APP_SYNC_URL?: string;
  }
}
