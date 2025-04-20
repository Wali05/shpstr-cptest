import type { NextConfig } from "next";
import DotenvWebpackPlugin from 'dotenv-webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.plugins.push(
      new DotenvWebpackPlugin({
        path: './.env',
        safe: true,
        systemvars: true,
        silent: true,
      })
    );
    return config;
  },
};

export default nextConfig;
