// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {Store} from 'redux';

import {DockWindowIcon} from '@mattermost/compass-icons/components';
import type {AutocompleteSuggestion, CommandArgs} from '@mattermost/types/integrations';
import { Icon } from '@houzz/ui';
import HouzzLogo from '@houzz/icons/HouzzLogo';

import {Client4} from 'mattermost-redux/client';
import {appsEnabled} from 'mattermost-redux/selectors/entities/apps';

import globalStore from 'stores/redux_store';

import {Constants} from 'utils/constants';
import * as UserAgent from 'utils/user_agent';

import type {GlobalState} from 'types/store';

import {AppCommandParser} from './command_provider/app_command_parser/app_command_parser';
import {intlShim} from './command_provider/app_command_parser/app_command_parser_dependencies';

import Provider from './provider';
import type {ResultsCallback} from './provider';
import {SuggestionContainer} from './suggestion';
import type {SuggestionProps} from './suggestion';

const EXECUTE_CURRENT_COMMAND_ITEM_ID = Constants.Integrations.EXECUTE_CURRENT_COMMAND_ITEM_ID;
const OPEN_COMMAND_IN_MODAL_ITEM_ID = Constants.Integrations.OPEN_COMMAND_IN_MODAL_ITEM_ID;
const COMMAND_SUGGESTION_ERROR = Constants.Integrations.COMMAND_SUGGESTION_ERROR;

const HouzzSuggestion = React.forwardRef<HTMLDivElement, SuggestionProps<AutocompleteSuggestion>>((props, ref) => {
    const {item} = props;

    let symbolSpan = <span>{'/'}</span>;
    switch (item.IconData) {
    case EXECUTE_CURRENT_COMMAND_ITEM_ID:
        symbolSpan = <span className='block mt-1'>{'↵'}</span>;
        break;
    case OPEN_COMMAND_IN_MODAL_ITEM_ID:
        symbolSpan = (
            <span className='block mt-1'>
                <DockWindowIcon size={28}/>
            </span>
        );
        break;
    case COMMAND_SUGGESTION_ERROR:
        symbolSpan = <span>{'!'}</span>;
        break;
    }
    let icon = <div className='slash-command__icon'>{symbolSpan}</div>;
    if (item.IconData && ![EXECUTE_CURRENT_COMMAND_ITEM_ID, COMMAND_SUGGESTION_ERROR, OPEN_COMMAND_IN_MODAL_ITEM_ID].includes(item.IconData)) {
        icon = (
            <div
                className='slash-command__icon'
                style={{backgroundColor: 'transparent'}}
            >
                <img src={item.IconData}/>
            </div>);
    }

    return (
        <SuggestionContainer
            ref={ref}
            {...props}
        >
            <Icon as={HouzzLogo} />
            <div className='slash-command__info'>
                <div className='slash-command__title'>
                    {item.Suggestion.substring(1) + ' ' + item.Hint}
                </div>
                <div className='slash-command__desc'>
                    {item.Description}
                </div>
            </div>
        </SuggestionContainer>
    );
});
HouzzSuggestion.displayName = 'HouzzSuggestion';
export {HouzzSuggestion};

type Props = {
    teamId: string;
    channelId: string;
    rootId?: string;
};

export default class CommandProvider extends Provider {
    private props: Props;
    private store: Store<GlobalState>;
    public triggerCharacter: string;
    private appCommandParser: AppCommandParser;

    constructor(props: Props) {
        super();

        this.store = globalStore;
        this.props = props;
        this.appCommandParser = new AppCommandParser(this.store as any, intlShim, props.channelId, props.teamId, props.rootId);
        this.triggerCharacter = '+h';
    }

    setProps(props: Props) {
        this.props = props;
        this.appCommandParser.setChannelContext(props.channelId, props.teamId, props.rootId);
    }

    handlePretextChanged(pretext: string, resultCallback: ResultsCallback<AutocompleteSuggestion>) {
        if (!pretext.includes(this.triggerCharacter)) {
            return false;
        }

        if (appsEnabled(this.store.getState()) && this.appCommandParser.isAppCommand(pretext)) {
            this.appCommandParser.getSuggestions(pretext).then((suggestions) => {
                const matches = suggestions.map((suggestion) => ({
                    ...suggestion,
                    Complete: '/' + suggestion.Complete,
                    Suggestion: '/' + suggestion.Suggestion,
                }));

                const terms = matches.map((suggestion) => suggestion.Complete);
                resultCallback({
                    matchedPretext: pretext,
                    terms,
                    items: matches,
                    component: HouzzSuggestion,
                });
            });
            return true;
        }

        if (UserAgent.isMobile()) {
            this.handleMobile(pretext, resultCallback);
        } else {
            this.handleWebapp(pretext, resultCallback);
        }

        return true;
    }

    handleCompleteWord(term: string, pretext: string, callback: (s: string) => void) {
        callback(term + ' ');
    }

    handleMobile(pretext: string, resultCallback: ResultsCallback<AutocompleteSuggestion>) {
        const {teamId} = this.props;

        const command = pretext.toLowerCase();
        Client4.getCommandsList(teamId).then(
            (data) => {
                let matches: AutocompleteSuggestion[] = [];
                if (appsEnabled(this.store.getState())) {
                    const appHouzzSuggestions = this.appCommandParser.getSuggestionsBase(pretext);
                    matches = matches.concat(appHouzzSuggestions);
                }

                data.forEach((cmd) => {
                    if (!cmd.auto_complete) {
                        return;
                    }

                    if (cmd.trigger === 'shortcuts') {
                        return;
                    }

                    if ((this.triggerCharacter + cmd.trigger).indexOf(command) === 0) {
                        const s = this.triggerCharacter + cmd.trigger;
                        let hint = '';
                        if (cmd.auto_complete_hint && cmd.auto_complete_hint.length !== 0) {
                            hint = cmd.auto_complete_hint;
                        }
                        matches.push({
                            Suggestion: s,
                            Complete: '',
                            Hint: hint,
                            Description: cmd.auto_complete_desc,
                            IconData: '',
                            type: Constants.Integrations.COMMAND,
                        });
                    }
                });

                matches = matches.sort((a, b) => a.Suggestion.localeCompare(b.Suggestion));

                // pull out the suggested commands from the returned data
                const terms = matches.map((suggestion) => suggestion.Suggestion);

                resultCallback({
                    matchedPretext: command,
                    terms,
                    items: matches,
                    component: HouzzSuggestion,
                });
            },
        );
    }

    handleWebapp(pretext: string, resultCallback: ResultsCallback<AutocompleteSuggestion>) {
        const command = pretext.toLowerCase();

        console.log(pretext);

        const regex = new RegExp(`(.*)\\${this.triggerCharacter} (.*)`, 'g');

        const match = regex.exec(pretext);
        const input = match.input;
        let textAfter = "";

        if (match) {
            // The matched tokens before and after this.triggerCharacter
            console.log(match);
            textAfter = match[2];
        }

        // TODO: get houzz projects, moodboards ... etc. from APIs
        const MOCK_PROJECTS = [...Array(5)].map((_, index) => ({
            Complete: `Project ${index}`,
            Suggestion: ` Project ${index}`, // first char is removed somewhere, add space to backfill it for now
            Hint: "",
            Description: `Project ${index} description`,
            type: Constants.Integrations.COMMAND,
            link: `project_${index}` // custom prop
        }));

        const MOCK_MOOD_BOARDS = [...Array(5)].map((_, index) => ({
            Complete: `Moodboard ${index}`,
            Suggestion: ` Moodboard ${index}`, // first char is removed somewhere, add space to backfill it for now
            Hint: "",
            Description: `Moodboard ${index} description`,
            type: Constants.Integrations.COMMAND,
            link: `moodboard_${index}` // custom prop
        }));

        let matches = [...MOCK_PROJECTS, ...MOCK_MOOD_BOARDS];

        if (textAfter) {
            // to support searching
            matches = matches.filter((suggestion) => suggestion.Suggestion.includes(textAfter));
        }

        // result in textarea, can be markdown format e.g. link
        const terms = matches.map((suggestion) => input.replace(`${this.triggerCharacter} ${textAfter}`, `[${suggestion.Complete}](https://pro.houzz.com/link/to/${suggestion.link})`));

        resultCallback({
            matchedPretext: command,
            terms,
            items: matches,
            component: HouzzSuggestion,
        });
    }

    shouldAddExecuteItem(data: AutocompleteSuggestion[], pretext: string) {
        if (data.length === 0) {
            return false;
        }
        if (pretext[pretext.length - 1] === ' ') {
            return true;
        }

        // If suggestion is empty it means that user can input any text so we allow them to execute.
        return data.findIndex((item) => item.Suggestion === '') !== -1;
    }

    contains(matches: AutocompleteSuggestion[], complete: string) {
        return matches.findIndex((match) => match.Complete === complete) !== -1;
    }
}
