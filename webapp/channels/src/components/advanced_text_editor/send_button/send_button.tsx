// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { memo } from "react";
import { useIntl } from "react-intl";
import styled from "styled-components";
import { Button, Icon } from "@houzz/ui";
import PaperPlaneOutline from '@houzz/icons/PaperPlaneOutline';

type SendButtonProps = {
    handleSubmit: (e: React.FormEvent) => void;
    disabled: boolean;
};

const SendButton = ({ disabled, handleSubmit }: SendButtonProps) => {
    const { formatMessage } = useIntl();

    const sendMessage = (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit(e);
    };

    return (
        <Button
            data-testid="SendMessageButton"
            tabIndex={0}
            aria-label={formatMessage({
                id: "create_post.send_message",
                defaultMessage: "Send a message",
            })}
            isDisabled={disabled}
            variant="solid"
            onClick={sendMessage}
            data-component="send"
            size="small"
        >
            <Icon as={PaperPlaneOutline} style={{ marginRight: '4px' }} />
            <span>Send Message</span>
        </Button>
    );
};

export default memo(SendButton);
