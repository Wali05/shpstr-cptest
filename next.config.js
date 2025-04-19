/* eslint-disable */
/** @type {import('next').NextConfig} */

const DotenvWebpackPlugin = require('dotenv-webpack');

const nextConfig = {
    webpack: (config) => {
        // Add dotenv-webpack plugin
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
    reactStrictMode: true,
};

module.exports = nextConfig;