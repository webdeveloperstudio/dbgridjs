const path = require('path');

module.exports = {
    entry: './src/app.ts',
    mode: 'development', //production
    module: {
        rules: [{
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'app.js',
        clean: true,
        publicPath: '/dist/',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: __dirname,
        },
        open: ['/example/index.html'],
    },
};