import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { bindActionCreators } from "redux";
import { connect, useDispatch } from "react-redux";
import { Client4 } from "mattermost-redux/client";
import { getTeamsList } from "mattermost-redux/selectors/entities/teams";
import { login } from "actions/views/login";
import { loadMe } from "mattermost-redux/actions/users";
import {
    getTeams as fetchTeams,
    getTeamMembers,
} from "mattermost-redux/actions/teams";
import { selectTeam } from "mattermost-redux/actions/teams";
import Sidebar from "components/sidebar";
import ChannelController from "components/channel_layout/channel_controller";
import {
    fetchAllMyTeamsChannelsAndChannelMembersREST,
    fetchChannelsAndMembers,
    selectChannel,
} from "mattermost-redux/actions/channels";
import PostView from "components/post_view";
import AdvancedCreatePost from "components/advanced_create_post";
import { openModal } from "actions/views/modals";
import NewChannelModal from "components/new_channel_modal/new_channel_modal";
import { ModalIdentifiers } from "utils/constants";
import { createChannel } from "mattermost-redux/actions/channels";
import "components/advanced_text_editor/advanced_text_editor.scss";

const teams = [
    {
        name: "team a",
        id: "eqohri83ofdomdrngbwhmyw31y",
        projects: ["a-project-1", "a-project-2", "a-project-3"],
        users: [
            {
                id: "1kjfkjpgi3romroyyj8rc4kbph",
                username: "chen-yuan.hsieh@houzz.com",
                teamId: "eqohri83ofdomdrngbwhmyw31y",
            },
            {
                id: "h4igd5rf6bg8uerjamsnrf3hjw",
                username: "auser1",
                teamId: "eqohri83ofdomdrngbwhmyw31y",
            },
            {
                id: "nkx6fdjux3ga7qns3tofetbfro",
                username: "abc",
                teamId: "eqohri83ofdomdrngbwhmyw31y",
            },
        ],
    },
    {
        name: "team b",
        id: "ay6q5xbdf7dk58bsyekdhcrswe",
        projects: ["b-project-1", "b-project-2"],
        users: [
            {
                id: "4uuarcb7cjgdmr8fyxb7uj16ry",
                username: "buser3",
                teamId: "ay6q5xbdf7dk58bsyekdhcrswe",
            },
            {
                id: "fnmjcusia3g1mm3njngwq4caia",
                username: "buser1",
                teamId: "ay6q5xbdf7dk58bsyekdhcrswe",
            },
            {
                id: "no19bzpk6bfp3qs37rxtoq5ewe",
                username: "buser2",
                teamId: "ay6q5xbdf7dk58bsyekdhcrswe",
            },
        ],
    },
];

// const handleOnModalConfirm = async () => {
//     if (!canCreate) {
//         return;
//     }

//     const channel: Channel = {
//         team_id: currentTeamId,
//         name: url,
//         display_name: displayName,
//         purpose,
//         header: '',
//         type,
//         create_at: 0,
//         creator_id: '',
//         delete_at: 0,
//         group_constrained: false,
//         id: '',
//         last_post_at: 0,
//         last_root_post_at: 0,
//         scheme_id: '',
//         update_at: 0,
//     };

//     try {
//         const {data: newChannel, error} = await dispatch(createChannel(channel, ''));
//         if (error) {
//             onCreateChannelError(error);
//             return;
//         }

//         handleOnModalCancel();

//         // If template selected, create a new board from this template
//         if (canCreateFromPluggable && createBoardFromChannelPlugin) {
//             try {
//                 addBoardToChannel(newChannel.id);
//             } catch (e: any) {
//                 // eslint-disable-next-line no-console
//                 console.log(e.message);
//             }
//         }
//         dispatch(switchToChannel(newChannel));
//     } catch (e) {
//         onCreateChannelError({message: formatMessage({id: 'channel_modal.error.generic', defaultMessage: 'Something went wrong. Please try again.'})});
//     }
// };

const PocPage = ({ actions }) => {
    const [currentUser, setCurrentUser] = useState(teams[0].users[0]);
    const [currentUserChannels, setCurrentUserChannels] = useState([]);
    const [currentActiveChannel, setCurrentActiveChannel] = useState({});
    const [toggledAddChannelBtnId, setToggledAddChannelBtnId] = useState("");
    const [newChannelName, setNewChannelName] = useState("");
    const dispatch = useDispatch();
    const channelViewRef = useRef();
    const channelInputRef = useRef();
    const currentUserTeam = teams.find(
        (team) => team.id === currentUser.teamId
    );

    useLayoutEffect(() => {
        if (toggledAddChannelBtnId) {
            const rect = document
                .getElementById(toggledAddChannelBtnId)
                .getBoundingClientRect();
            channelInputRef.current.style.display = "block";
            channelInputRef.current.style.position = "absolute";
            // console.log('rect.left:', rect.left);
            // console.log('window.scrollX:', window.scrollX);
            channelInputRef.current.style.left = `${
                rect.left + window.scrollX + 105
            }px`;
            channelInputRef.current.style.top = `${
                rect.top + window.scrollY
            }px`;
        } else {
            channelInputRef.current.style.display = "none";
        }
    }, [toggledAddChannelBtnId]);

    useEffect(() => {
        (async () => {
            Client4.setToken("");
            await dispatch(login(currentUser.username, "houzz123"));
            await dispatch(loadMe());
            dispatch(selectTeam(currentUser.teamId));
            await dispatch(fetchAllMyTeamsChannelsAndChannelMembersREST());

            const data = await Client4.getMyChannels(currentUser.teamId);
            const currentUserTeam = teams.find(
                (team) => team.id === currentUser.teamId
            );
            const validChannels = data?.filter((channel) =>
                currentUserTeam.projects.includes(channel.purpose)
            );
            setCurrentUserChannels(validChannels);

            if (validChannels?.length) {
                setCurrentActiveChannel(validChannels[0]);
                dispatch(selectChannel(validChannels[0].id));
            } else {
                setCurrentActiveChannel({});
            }
            // const projectChannelsMap = {};

            // for (const project of data) {
            //     // use purpose to mock project id
            //     const { purpose } = project;

            //     if (purpose) {
            //         if (projectChannelsMap[purpose]) {
            //             projectChannelsMap[purpose].push(project);
            //         } else {
            //             projectChannelsMap[purpose] = [project];
            //         }
            //     }
            // }

            // setProjectsChannels(
            //     Object.keys(projectChannelsMap).map((projectId) => {
            //         return {
            //             projectId,
            //             channels: projectChannelsMap[projectId],
            //         };
            //     })
            // );

            // if (Object.keys(projectChannelsMap).length) {
            //     const firstProjectId = Object.keys(projectChannelsMap)[0];
            //     setCurrentActiveChannel(projectChannelsMap[firstProjectId][0]);
            // }
        })();
    }, [currentUser]);

    // console.log(teams);

    // useEffect(() => {
    //     actions.getData();
    // }, []);

    // useEffect(() => {
    //     (async () => {
    //         const promises = teams.map(({ id }) =>
    //             Client4.getTeamMembers(id, 0, 30)
    //         );
    //         const data = await Promise.all(promises);
    //         console.log(data);
    //     })();
    // }, [teams]);

    return (
        <div className="app__body channel-view" style={{ display: "flex" }}>
            <div style={{ flex: 1 }}>
                <div>
                    {teams.map(({ name, id, users }) => (
                        <div
                            key={id}
                            style={{
                                border: "1px solid ",
                                padding: "4px",
                                margin: "4px",
                            }}
                        >
                            <h2>{name}</h2>
                            {users.map(({ id, username, teamId }) => (
                                <div
                                    key={id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <input
                                        type="radio"
                                        id={id}
                                        name="user"
                                        value={id}
                                        checked={currentUser.id === id}
                                        onChange={() =>
                                            setCurrentUser({
                                                id,
                                                username,
                                                teamId,
                                            })
                                        }
                                    />
                                    <span style={{ marginLeft: "4px" }}>
                                        {username}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {/* <Sidebar /> */}
                {/* <ChannelController shouldRenderCenterChannel={true} /> */}

                <div>
                    Projects:
                    {currentUserTeam.projects.map((project, pIdx) => (
                        <div key={project}>
                            {project}
                            <button
                                id={`add-btn-${project}`}
                                onClick={() => {
                                    setToggledAddChannelBtnId((prev) => {
                                        if (prev !== `add-btn-${project}`) {
                                            return `add-btn-${project}`;
                                        }
                                        return "";
                                    });
                                }}
                            >
                                add channel
                            </button>
                            {currentUserChannels
                                .filter(
                                    // use purpose to mock project id
                                    (channel) => channel.purpose === project
                                )
                                .map((channel, cIdx) => (
                                    <div
                                        key={channel.id}
                                        style={{
                                            fontWeight:
                                                currentActiveChannel.id ===
                                                channel.id
                                                    ? "bold"
                                                    : "normal",
                                        }}
                                        onClick={() => {
                                            setCurrentActiveChannel(channel);
                                            dispatch(selectChannel(channel.id));
                                        }}
                                    >
                                        {channel.display_name}
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>

            <div ref={channelViewRef} style={{ height: "89vh", flex: 3 }}>
                <PostView
                    channelId={currentActiveChannel.id}
                    // focusedPostId={this.state.focusedPostId}
                />
                <div
                    id="post-create"
                    data-testid="post-create"
                    className="post-create__container AdvancedTextEditor__ctr"
                >
                    <AdvancedCreatePost
                        getChannelView={() => channelViewRef?.current}
                    />
                </div>
            </div>
            <div ref={channelInputRef}>
                <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                />
                <button
                    onClick={async () => {
                        const channel = {
                            team_id: currentUserTeam.id,
                            name: newChannelName,
                            display_name: newChannelName,
                            purpose: toggledAddChannelBtnId.replace(
                                "add-btn-",
                                ""
                            ),
                            header: "",
                            type: "O",
                            create_at: 0,
                            creator_id: "",
                            delete_at: 0,
                            group_constrained: false,
                            id: "",
                            last_post_at: 0,
                            last_root_post_at: 0,
                            scheme_id: "",
                            update_at: 0,
                        };
                        await dispatch(createChannel(channel, ""));
                        setNewChannelName("");
                        setToggledAddChannelBtnId("");
                    }}
                >
                    Add
                </button>
            </div>
        </div>
    );
};

function mapStateToProps(state) {
    const teams = getTeamsList(state);

    return {
        teams,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(
            {
                getData: () => fetchTeams(0, 10, true),
            },
            dispatch
        ),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(PocPage);
