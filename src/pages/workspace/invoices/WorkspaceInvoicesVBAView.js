import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import Text from '../../../components/Text';
import styles from '../../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../../components/withLocalize';
import * as Expensicons from '../../../components/Icon/Expensicons';
import * as Illustrations from '../../../components/Icon/Illustrations';
import Section from '../../../components/Section';
import WorkspaceInvoicesFirstSection from './WorkspaceInvoicesFirstSection';
import * as Link from '../../../libs/actions/Link';

const propTypes = {
    /** The policy ID currently being configured */
    policyID: PropTypes.string.isRequired,

    ...withLocalizePropTypes,
};

function WorkspaceInvoicesVBAView(props) {
    const viewUnpaidInvoicesUrl = `reports?policyID=${props.policyID}&from=all&type=invoice&showStates=Processing&isAdvancedFilterMode=true`;

    return (
        <>
            <WorkspaceInvoicesFirstSection policyID={props.policyID} />

            <Section
                title={props.translate('workspace.invoices.moneyBackInAFlash')}
                icon={Illustrations.MoneyBadge}
                menuItems={[
                    {
                        title: props.translate('workspace.invoices.viewUnpaidInvoices'),
                        onPress: () => Link.openOldDotLink(viewUnpaidInvoicesUrl),
                        icon: Expensicons.Hourglass,
                        shouldShowRightIcon: true,
                        iconRight: Expensicons.NewWindow,
                        wrapperStyle: [styles.cardMenuItem],
                        link: () => Link.buildOldDotURL(viewUnpaidInvoicesUrl),
                    },
                ]}
            >
                <View style={[styles.mv3]}>
                    <Text>{props.translate('workspace.invoices.unlockVBACopy')}</Text>
                </View>
            </Section>
        </>
    );
}

WorkspaceInvoicesVBAView.propTypes = propTypes;
WorkspaceInvoicesVBAView.displayName = 'WorkspaceInvoicesVBAView';

export default withLocalize(WorkspaceInvoicesVBAView);
