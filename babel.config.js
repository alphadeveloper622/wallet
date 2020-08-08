const webpack = {
    presets: ['@babel/preset-react', '@babel/preset-env'],
    plugins: [['react-native-web', {commonjs: true}]],
};

const metro = {
    presets: [require('metro-react-native-babel-preset')],
    plugins: [],
};

module.exports = ({caller}) => {
    // For `react-native` (iOS/Android) caller will be "metro"
    // For `webpack` (Web) caller will be "@babel-loader"
    const runningIn = caller(({name}) => name);
    return runningIn === 'metro' ? metro : webpack;
};
