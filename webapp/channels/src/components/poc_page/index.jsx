/* eslint-disable */
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Box, Button } from "@houzz/ui";
import { Client4 } from "mattermost-redux/client";
import { login } from "actions/views/login";
import { loadMe } from "mattermost-redux/actions/users";
import { selectTeam } from "mattermost-redux/actions/teams";
import {
    fetchAllMyTeamsChannelsAndChannelMembersREST,
    selectChannel,
} from "mattermost-redux/actions/channels";
import PostView from "components/post_view";
import AdvancedCreatePost from "components/advanced_create_post";
import { createChannel } from "mattermost-redux/actions/channels";
import "components/advanced_text_editor/advanced_text_editor.scss";

const teams = [
    {
        name: "team-a",
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
        name: "team-b",
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

const PocPage = () => {
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

    const updateMyChannels = async (currentUser) => {
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
    };

    useLayoutEffect(() => {
        if (toggledAddChannelBtnId) {
            const rect = document
                .getElementById(toggledAddChannelBtnId)
                .getBoundingClientRect();
            channelInputRef.current.style.display = "flex";
            channelInputRef.current.style.position = "absolute";
            channelInputRef.current.style.left = `${
                rect.left + window.scrollX + 110
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
            setToggledAddChannelBtnId("");
            await dispatch(login(currentUser.username, "houzz123"));
            await dispatch(loadMe());
            dispatch(selectTeam(currentUser.teamId));
            await dispatch(fetchAllMyTeamsChannelsAndChannelMembersREST());
            await updateMyChannels(currentUser);
        })();
    }, [currentUser]);

    return (
        <div className="app__body channel-view" style={{ display: "flex" }}>
            <div style={{ flex: 1, padding: "8px" }}>
                <div>
                    <h3>select user:</h3>
                    {teams.map(({ name, id, users }) => (
                        <div
                            key={id}
                            style={{
                                padding: "4px",
                                margin: "4px",
                            }}
                        >
                            <h4>{name}</h4>
                            {users.map(({ id, username, teamId }) => (
                                <Box
                                    key={id}
                                    display="flex"
                                    alignItems="center"
                                    ml="S"
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
                                </Box>
                            ))}
                        </div>
                    ))}
                </div>
                <hr />
                <div>
                    <h3>{currentUserTeam.name}'s projects:</h3>
                    {currentUserTeam.projects.map((project) => (
                        <Box key={project} ml="S">
                            <Box display="flex" alignItems="center">
                                <h4>{project}</h4>
                                <Button
                                    id={`add-btn-${project}`}
                                    ml="S"
                                    size="small"
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
                                </Button>
                            </Box>
                            {currentUserChannels
                                .filter(
                                    // use purpose to mock project id
                                    (channel) => channel.purpose === project
                                )
                                .map((channel) => (
                                    <Box
                                        key={channel.id}
                                        style={{ cursor: "pointer" }}
                                        ml="S"
                                        p="XXS"
                                        backgroundColor={
                                            currentActiveChannel.id ===
                                            channel.id
                                                ? "rgba(0, 0, 0, 0.05)"
                                                : undefined
                                        }
                                        fontSize="16px"
                                        fontWeight={
                                            currentActiveChannel.id ===
                                            channel.id
                                                ? "bold"
                                                : "normal"
                                        }
                                        onClick={() => {
                                            setCurrentActiveChannel(channel);
                                            dispatch(selectChannel(channel.id));
                                        }}
                                    >
                                        {channel.display_name}
                                    </Box>
                                ))}
                        </Box>
                    ))}
                </div>
            </div>
            <div ref={channelViewRef} style={{ height: "89vh", flex: 3 }}>
                <PostView
                    channelId={currentActiveChannel.id}
                    currentUserTeamName={currentUserTeam.name}
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
            <Box ref={channelInputRef} alignItems="center">
                <input
                    type="text"
                    placeholder="channel name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                />
                <Button
                    ml="XXS"
                    size="small"
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
                        await updateMyChannels(currentUser);
                        setNewChannelName("");
                        setToggledAddChannelBtnId("");
                    }}
                >
                    Add
                </Button>
            </Box>
        </div>
    );
};

export default PocPage;
