import _ from 'underscore';
import moment from 'moment';
import Str from 'expensify-common/lib/str';
import Onyx from 'react-native-onyx';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';
import * as User from './actions/User';
import emojisTrie from './EmojiTrie';
import FrequentlyUsed from '../../assets/images/history.svg';

let frequentlyUsedEmojis = [];
Onyx.connect({
    key: ONYXKEYS.FREQUENTLY_USED_EMOJIS,
    callback: val => frequentlyUsedEmojis = val,
});

/**
 * Get the unicode code of an emoji in base 16.
 * @param {String} input
 * @returns {String}
 */
const getEmojiUnicode = _.memoize((input) => {
    if (input.length === 0) {
        return '';
    }

    if (input.length === 1) {
        return _.map(input.charCodeAt(0).toString().split(' '), val => parseInt(val, 10).toString(16)).join(' ');
    }

    const pairs = [];

    // Some Emojis in UTF-16 are stored as pair of 2 Unicode characters (eg Flags)
    // The first char is generally between the range U+D800 to U+DBFF called High surrogate
    // & the second char between the range U+DC00 to U+DFFF called low surrogate
    // More info in the following links:
    // 1. https://docs.microsoft.com/en-us/windows/win32/intl/surrogates-and-supplementary-characters
    // 2. https://thekevinscott.com/emojis-in-javascript/
    for (let i = 0; i < input.length; i++) {
        if (input.charCodeAt(i) >= 0xd800 && input.charCodeAt(i) <= 0xdbff) { // high surrogate
            if (input.charCodeAt(i + 1) >= 0xdc00 && input.charCodeAt(i + 1) <= 0xdfff) { // low surrogate
                pairs.push(
                    ((input.charCodeAt(i) - 0xd800) * 0x400)
                      + (input.charCodeAt(i + 1) - 0xdc00) + 0x10000,
                );
            }
        } else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
            // modifiers and joiners
            pairs.push(input.charCodeAt(i));
        }
    }
    return _.map(pairs, val => parseInt(val, 10).toString(16)).join(' ');
});

/**
 * Function to remove Skin Tone and utf16 surrogates from Emoji
 * @param {String} emojiCode
 * @returns {String}
 */
function trimEmojiUnicode(emojiCode) {
    return emojiCode.replace(/(fe0f|1f3fb|1f3fc|1f3fd|1f3fe|1f3ff)$/, '').trim();
}

/**
 * Validates that this message contains only emojis
 *
 * @param {String} message
 * @returns {Boolean}
 */
function containsOnlyEmojis(message) {
    const trimmedMessage = Str.replaceAll(message.replace(/ /g, ''), '\n', '');
    const match = trimmedMessage.match(CONST.REGEX.EMOJIS);

    if (!match) {
        return false;
    }

    const codes = [];
    _.map(match, emoji => _.map(getEmojiUnicode(emoji).split(' '), (code) => {
        if (!CONST.INVISIBLE_CODEPOINTS.includes(code)) {
            codes.push(code);
        }
        return code;
    }));

    // Emojis are stored as multiple characters, so we're using spread operator
    // to iterate over the actual emojis, not just characters that compose them
    const messageCodes = _.filter(_.map([...trimmedMessage], char => getEmojiUnicode(char)), string => string.length > 0 && !CONST.INVISIBLE_CODEPOINTS.includes(string));
    return codes.length === messageCodes.length;
}

/**
 * Get the header emojis with their code, icon and index
 * @param {Object[]} emojis
 * @returns {Object[]}
 */
function getHeaderEmojis(emojis) {
    const headerIndices = [];
    _.each(emojis, (emoji, index) => {
        if (!emoji.header) {
            return;
        }
        headerIndices.push({code: emoji.code, index, icon: emoji.icon});
    });
    return headerIndices;
}

/**
 * Get number of empty spaces to be filled to get equal emojis for every row
 * @param {Number} emojiCount
 * @param {Number} suffix
 * @returns {Object[]}
 */
function getDynamicSpacing(emojiCount, suffix) {
    const spacerEmojis = [];
    let modLength = CONST.EMOJI_NUM_PER_ROW - (emojiCount % CONST.EMOJI_NUM_PER_ROW);

    // Empty spaces is pushed if the given row has less than eight emojis
    while (modLength > 0 && modLength < CONST.EMOJI_NUM_PER_ROW) {
        spacerEmojis.push({
            code: `${CONST.EMOJI_SPACER}_${suffix}_${modLength}`,
            spacer: true,
        });
        modLength -= 1;
    }
    return spacerEmojis;
}

/**
 * Add dynamic spaces to emoji categories
 * @param {Object[]} emojis
 * @returns {Object[]}
 */
function addSpacesToEmojiCategories(emojis) {
    let updatedEmojis = [];
    _.each(emojis, (emoji, index) => {
        if (emoji.header) {
            updatedEmojis = updatedEmojis.concat(getDynamicSpacing(updatedEmojis.length, index), [emoji], getDynamicSpacing(1, index));
            return;
        }
        updatedEmojis.push(emoji);
    });
    return updatedEmojis;
}

/**
 * Get a merged array with frequently used emojis
 * @param {Object[]} emojis
 * @returns {Object[]}
 */
function mergeEmojisWithFrequentlyUsedEmojis(emojis) {
    if (frequentlyUsedEmojis.length === 0) {
        return addSpacesToEmojiCategories(emojis);
    }

    let allEmojis = [{
        header: true,
        code: 'frequentlyUsed',
        icon: FrequentlyUsed,
    }];

    allEmojis = allEmojis.concat(frequentlyUsedEmojis, emojis);
    return addSpacesToEmojiCategories(allEmojis);
}

/**
 * Update the frequently used emojis list by usage and sync with API
 * @param {Object|Object[]} newEmoji
 */
function addToFrequentlyUsedEmojis(newEmoji) {
    let frequentEmojiList = [...frequentlyUsedEmojis];

    const maxFrequentEmojiCount = (CONST.EMOJI_FREQUENT_ROW_COUNT * CONST.EMOJI_NUM_PER_ROW) - 1;
    const currentTimestamp = moment().unix();
    _.each([].concat(newEmoji), (emoji) => {
        let currentEmojiCount = 1;
        const emojiIndex = _.findIndex(frequentEmojiList, e => e.code === emoji.code);
        if (emojiIndex >= 0) {
            currentEmojiCount = frequentEmojiList[emojiIndex].count + 1;
            frequentEmojiList.splice(emojiIndex, 1);
        }
        const updatedEmoji = {...emoji, ...{count: currentEmojiCount, lastUpdatedAt: currentTimestamp}};

        // We want to make sure the current emoji is added to the list
        // Hence, we take one less than the current frequent used emojis
        frequentEmojiList = frequentEmojiList.slice(0, maxFrequentEmojiCount);
        frequentEmojiList.push(updatedEmoji);

        // Sort the list by count and lastUpdatedAt in descending order
        frequentEmojiList.sort((a, b) => b.count - a.count || b.lastUpdatedAt - a.lastUpdatedAt);
    });

    User.updateFrequentlyUsedEmojis(frequentEmojiList);
}

/**
 * Given an emoji item object, return an emoji code based on its type.
 *
 * @param {Object} item
 * @param {Number} preferredSkinToneIndex
 * @returns {String}
 */
const getEmojiCodeWithSkinColor = (item, preferredSkinToneIndex) => {
    const {code, types} = item;
    if (types && types[preferredSkinToneIndex]) {
        return types[preferredSkinToneIndex];
    }

    return code;
};

/**
 * Replace any emoji name in a text with the emoji icon.
 * If we're on mobile, we also add a space after the emoji granted there's no text after it.
 *
 * All replaced emojis will be added to the frequently used emojis list.
 *
 * @param {String} text
 * @param {Boolean} isSmallScreenWidth
 * @param {Number} preferredSkinTone
 * @returns {String}
 */
function replaceEmojis(text, isSmallScreenWidth = false, preferredSkinTone = CONST.EMOJI_DEFAULT_SKIN_TONE) {
    let newText = text;
    const emojiData = text.match(CONST.REGEX.EMOJI_NAME);
    if (!emojiData || emojiData.length === 0) {
        return text;
    }
    const emojis = [];
    for (let i = 0; i < emojiData.length; i++) {
        const name = emojiData[i].slice(1, -1);
        const checkEmoji = emojisTrie.search(name);
        if (checkEmoji && checkEmoji.metaData.code) {
            let emojiReplacement = getEmojiCodeWithSkinColor(checkEmoji.metaData, preferredSkinTone);
            emojis.push({
                name,
                code: checkEmoji.metaData.code,
                types: checkEmoji.metaData.types,
            });

            // If this is the last emoji in the message and it's the end of the message so far,
            // add a space after it so the user can keep typing easily.
            if (isSmallScreenWidth && i === emojiData.length - 1 && text.endsWith(emojiData[i])) {
                emojiReplacement += ' ';
            }
            newText = newText.replace(emojiData[i], emojiReplacement);
        }
    }

    // Add all replaced emojis to the frequently used emojis list
    if (!_.isEmpty(emojis)) {
        addToFrequentlyUsedEmojis(emojis);
    }
    return newText;
}

/**
 * Suggest emojis when typing emojis prefix after colon
 * @param {String} text
 * @param {Number} [limit] - matching emojis limit
 * @returns {Array}
 */
function suggestEmojis(text, limit = 5) {
    const emojiData = text.match(CONST.REGEX.EMOJI_SUGGESTIONS);
    if (emojiData) {
        const matching = [];
        const nodes = emojisTrie.getAllMatchingWords(emojiData[0].toLowerCase().slice(1), limit);
        for (let j = 0; j < nodes.length; j++) {
            if (nodes[j].metaData.code && !_.find(matching, obj => obj.name === nodes[j].name)) {
                if (matching.length === limit) {
                    return matching;
                }
                matching.push({code: nodes[j].metaData.code, name: nodes[j].name, types: nodes[j].metaData.types});
            }
            const suggestions = nodes[j].metaData.suggestions;
            for (let i = 0; i < suggestions.length; i++) {
                if (matching.length === limit) {
                    return matching;
                }
                if (!_.find(matching, obj => obj.name === suggestions[i].name)) {
                    matching.push(suggestions[i]);
                }
            }
        }
        return matching;
    }
    return [];
}

export {
    getHeaderEmojis,
    mergeEmojisWithFrequentlyUsedEmojis,
    addToFrequentlyUsedEmojis,
    containsOnlyEmojis,
    replaceEmojis,
    suggestEmojis,
    trimEmojiUnicode,
    getEmojiCodeWithSkinColor,
};
