import React, {Component} from 'react';
import {View, FlatList, Text} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import CONST from '../../../../CONST';
import styles from '../../../../styles/styles';
import themeColors from '../../../../styles/themes/default';
import emojis from '../../../../../assets/emojis';
import EmojiPickerMenuItem from '../EmojiPickerMenuItem';
import TextInputFocusable from '../../../../components/TextInputFocusable';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../../../components/withWindowDimensions';
import canUseTouchScreen from '../../../../libs/canUseTouchscreen';

const propTypes = {
    // Function to add the selected emoji to the main compose text input
    onEmojiSelected: PropTypes.func.isRequired,

    // The ref to the search input (may be null on small screen widths)
    forwardedRef: PropTypes.func,

    ...windowDimensionsPropTypes,
};

const defaultProps = {
    forwardedRef: () => {},
};

class EmojiPickerMenu extends Component {
    constructor(props) {
        super(props);

        // Ref for the emoji search input
        this.searchInput = undefined;

        // Ref for emoji FlatList
        this.emojiList = undefined;

        // This is the number of columns in each row of the picker.
        // Because of how flatList implements these rows, each row is an index rather than each element
        // For this reason to make headers work, we need to have the header be the only rendered element in its row
        // If this number is changed, emojis.js will need to be updated to have the proper number of spacer elements
        // around each header.
        this.numColumns = 8;

        // This is the indices of each category of emojis
        // The positions are static, and are calculated as index/numColumns (8 in our case)
        // This is because each row of 8 emojis counts as one index
        // If more emojis are ever added to emojis.js this will need to be updated or things will break
        this.unfilteredHeaderIndices = [0, 33, 59, 87, 98, 120, 147];

        // Toggles which keys the search input will listen to
        // NOTE: these need to be instance members so we're always referencing the same functions in memory
        this.keyToDefaultPreventer = {};
        ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].forEach((key) => {
            this.keyToDefaultPreventer[key] = (keyBoardEvent) => {
                if (keyBoardEvent.key === key) {
                    keyBoardEvent.preventDefault();
                }
            };
        });
        this.toggleKeysOnSearchInput = (keysToIgnore = [], keysToAccept = []) => {
            keysToIgnore.forEach((key) => {
                this.searchInput.addEventListener('keydown', this.keyToDefaultPreventer[key]);
            });
            keysToAccept.forEach((key) => {
                this.searchInput.removeEventListener('keydown', this.keyToDefaultPreventer[key]);
            });
        };

        this.filterEmojis = _.debounce(this.filterEmojis.bind(this), 300);
        this.highlightAdjacentEmoji = this.highlightAdjacentEmoji.bind(this);
        this.scrollToHighlightedIndex = this.scrollToHighlightedIndex.bind(this);
        this.toggleArrowKeysOnSearchInput = this.toggleArrowKeysOnSearchInput.bind(this);
        this.renderItem = this.renderItem.bind(this);

        this.state = {
            filteredEmojis: emojis,
            headerIndices: this.unfilteredHeaderIndices,
            highlightedIndex: -1,
            currentScrollOffset: 0,
            shouldDisablePointerEvents: false,
        };
    }

    componentDidMount() {
        // This callback prop is used by the parent component using the constructor to
        // get a ref to the inner textInput element e.g. if we do
        // <constructor ref={el => this.textInput = el} /> this will not
        // return a ref to the component, but rather the HTML element by default
        if (this.props.forwardedRef && _.isFunction(this.props.forwardedRef)) {
            this.props.forwardedRef(this.searchInput);
        }

        // Setup keypress/mouse handlers only if we have a keyboard (and not a touchscreen)
        if (!canUseTouchScreen() && document) {
            this.keyDownHandler = (e) => {
                // Highlight the appropriate emoji
                if (e.key.startsWith('Arrow')) {
                    this.highlightAdjacentEmoji(e.key);
                    this.toggleArrowKeysOnSearchInput();
                }

                // Select the highlighted emoji if enter is pressed
                if (e.key === 'Enter' && this.state.highlightedIndex !== -1) {
                    this.props.onEmojiSelected(this.state.filteredEmojis[this.state.highlightedIndex].code);
                }
            };
            document.addEventListener('keydown', this.keyDownHandler);

            // Re-enable pointer events and hovering over EmojiPickerItems when the mouse moves
            this.mouseMoveHandler = () => {
                if (this.state.shouldDisablePointerEvents) {
                    this.setState({shouldDisablePointerEvents: false});
                }
            };
            document.addEventListener('mousemove', this.mouseMoveHandler);
        }
    }

    componentWillUnmount() {
        // Cleanup all mouse/keydown event listeners that we've set up
        if (!canUseTouchScreen() && document) {
            document.removeEventListener('keydown', this.keyDownHandler);
            document.removeEventListener('keydown', this.mouseMoveHandler);
            this.toggleKeysOnSearchInput([], ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']);
        }
    }

    /**
     * Highlights emojis adjacent to the currently highlighted emoji depending on the arrowKey
     * @param {String} arrowKey
     */
    highlightAdjacentEmoji(arrowKey) {
        const firstNonHeaderIndex = this.state.filteredEmojis.length === emojis.length ? this.numColumns : 0;

        // If nothing is highlighted and an arrow key is pressed
        // select the first emoji
        if (this.state.highlightedIndex === -1) {
            this.setState({highlightedIndex: firstNonHeaderIndex});
            this.scrollToHighlightedIndex();
            return;
        }

        let newIndex = this.state.highlightedIndex;
        const move = (steps, boundsCheck) => {
            if (boundsCheck()) {
                return;
            }

            // Move in the prescribed direction until we reach an element that isn't a header
            const isHeader = e => e.header || e.code === CONST.EMOJI_SPACER;
            do {
                newIndex += steps;
            } while (isHeader(this.state.filteredEmojis[newIndex]));
        };

        switch (arrowKey) {
            case 'ArrowDown':
                move(
                    this.numColumns,
                    () => this.state.highlightedIndex + this.numColumns > this.state.filteredEmojis.length - 1,
                );
                break;
            case 'ArrowLeft':
                move(-1, () => this.state.highlightedIndex - 1 < firstNonHeaderIndex);
                break;
            case 'ArrowRight':
                move(1, () => this.state.highlightedIndex + 1 > this.state.filteredEmojis.length - 1);
                break;
            case 'ArrowUp':
                move(-this.numColumns, () => this.state.highlightedIndex - this.numColumns < firstNonHeaderIndex);
                break;
            default:
                break;
        }

        if (newIndex !== this.state.highlightedIndex) {
            this.setState({highlightedIndex: newIndex});
            this.scrollToHighlightedIndex();
        }
    }

    /**
     * Calculates the required scroll offset (aka distance from top) and scrolls the FlatList to the highlighted emoji
     * if any portion of it falls outside of the window.
     */
    scrollToHighlightedIndex() {
        // If there are headers in the emoji array, so we need to offset by their heights as well
        let numHeaders = 0;
        if (this.state.filteredEmojis.length === emojis.length) {
            numHeaders = this.unfilteredHeaderIndices
                .filter(i => this.state.highlightedIndex > i * this.numColumns).length;
        }

        // Calculate the scroll offset at the bottom of the currently highlighted emoji
        // (subtract numHeadersScrolled because highlightedIndex includes them, and add 1 to include the current row)
        const numEmojiRows = (Math.floor(this.state.highlightedIndex / this.numColumns) - numHeaders) + 1;

        // The scroll offsets at the top and bottom of the highlighted emoji
        const offsetAtEmojiBottom = ((numHeaders) * CONST.EMOJI_PICKER_HEADER_HEIGHT)
            + (numEmojiRows * CONST.EMOJI_PICKER_ITEM_HEIGHT);
        const offsetAtEmojiTop = offsetAtEmojiBottom - CONST.EMOJI_PICKER_ITEM_HEIGHT;

        // Scroll to fit the entire highlighted emoji into the window
        let targetOffset = this.state.currentScrollOffset;
        if (offsetAtEmojiBottom - this.state.currentScrollOffset >= CONST.EMOJI_PICKER_LIST_HEIGHT) {
            targetOffset = offsetAtEmojiBottom - CONST.EMOJI_PICKER_LIST_HEIGHT;
        } else if (offsetAtEmojiTop - CONST.EMOJI_PICKER_ITEM_HEIGHT <= this.state.currentScrollOffset) {
            targetOffset = offsetAtEmojiTop - CONST.EMOJI_PICKER_ITEM_HEIGHT;
        }
        if (targetOffset !== this.state.currentScrollOffset) {
            // Disable pointer events so that onHover doesn't get triggered while the items move
            if (!this.state.shouldDisablePointerEvents) {
                this.setState({shouldDisablePointerEvents: true});
            }
            this.emojiList.scrollToOffset({offset: targetOffset, animated: false});
        }
    }

    /**
     * Filter the entire list of emojis to only emojis that have the search term in their keywords
     *
     * @param {String} searchTerm
     */
    filterEmojis(searchTerm) {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        if (normalizedSearchTerm === '') {
            // There are no headers when searching, so we need to re-make them sticky when there is no search term
            this.setState({
                filteredEmojis: emojis,
                headerIndices: this.unfilteredHeaderIndices,
                highlightedIndex: this.numColumns,
            });
            return;
        }

        const newFilteredEmojiList = _.filter(emojis, emoji => (
            !emoji.header
            && emoji.code !== CONST.EMOJI_SPACER
            && _.find(emoji.keywords, keyword => keyword.includes(normalizedSearchTerm))
        ));

        // Remove sticky header indices. There are no headers while searching and we don't want to make emojis sticky
        this.setState({filteredEmojis: newFilteredEmojiList, headerIndices: [], highlightedIndex: 0});

        // Allow the search input to receive arrow key presses if there were no results
        if (!newFilteredEmojiList.length && this.toggleArrowPressesOnSearchInput) {
            this.toggleKeysOnSearchInput([], ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']);
        }
    }

    /**
     * Toggles which arrow keys can affect the cursor in the search input,
     * depending on whether the arrow keys will affect the index of the highlighted emoji.
     */
    toggleArrowKeysOnSearchInput() {
        // Only allow arrowKey presses to affect the cursor position in the search input
        // if they aren't being used to affect the highlighted emoji
        if (this.state.highlightedIndex === 0) {
            this.toggleKeysOnSearchInput(['ArrowDown', 'ArrowRight'], ['ArrowLeft', 'ArrowUp']);
        } else if (this.state.highlightedIndex === this.state.filteredEmojis.length - 1) {
            this.toggleKeysOnSearchInput(['ArrowLeft', 'ArrowUp'], ['ArrowDown', 'ArrowRight']);
        } else if (this.state.highlightedIndex !== -1 && this.state.filteredEmojis.length) {
            this.toggleKeysOnSearchInput(['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']);
        }
    }

    /**
     * Given an emoji item object, render a component based on its type.
     * Items with the code "SPACER" return nothing and are used to fill rows up to 8
     * so that the sticky headers function properly
     *
     * @param {Object} item
     * @param {Number} index
     * @returns {*}
     */
    renderItem({item, index}) {
        const {code, header} = item;
        if (code === CONST.EMOJI_SPACER) {
            return null;
        }

        if (header) {
            return (
                <Text style={styles.emojiHeaderStyle}>
                    {code}
                </Text>
            );
        }

        return (
            <EmojiPickerMenuItem
                onPress={this.props.onEmojiSelected}
                onHover={() => this.setState({highlightedIndex: index})}
                emoji={code}
                isHighlighted={index === this.state.highlightedIndex}
            />
        );
    }

    render() {
        const pointerEvents = this.state.shouldDisablePointerEvents ? 'none' : 'auto';
        return (
            <View style={styles.emojiPickerContainer} pointerEvents={pointerEvents}>
                {!this.props.isSmallScreenWidth && (
                    <View style={[styles.pt4, styles.ph4, styles.pb1]}>
                        <TextInputFocusable
                            textAlignVertical="top"
                            placeholder="Search"
                            placeholderTextColor={themeColors.textSupporting}
                            onChangeText={this.filterEmojis}
                            style={styles.textInput}
                            defaultValue=""
                            ref={el => this.searchInput = el}
                        />
                    </View>
                )}
                <FlatList
                    ref={el => this.emojiList = el}
                    data={this.state.filteredEmojis}
                    renderItem={this.renderItem}
                    keyExtractor={item => `emoji_picker_${item.code}`}
                    numColumns={this.numColumns}
                    style={styles.emojiPickerList}
                    extraData={[this.state.filteredEmojis, this.state.highlightedIndex]}
                    stickyHeaderIndices={this.state.headerIndices}
                    onScroll={e => this.setState({currentScrollOffset: e.nativeEvent.contentOffset.y})}
                />
            </View>
        );
    }
}

EmojiPickerMenu.propTypes = propTypes;
EmojiPickerMenu.defaultProps = defaultProps;

export default withWindowDimensions(React.forwardRef((props, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <EmojiPickerMenu {...props} forwardedRef={ref} />
)));
