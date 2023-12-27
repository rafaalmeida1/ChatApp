'use client'

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {Chat} from "../components/page";
import { useForm, SubmitHandler } from 'react-hook-form';

interface FormInputs {
  username: string;
  roomId: string;
}

export default function Home() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [userName, setUserName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);

    const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormInputs>();

    useEffect(() => {
        const newSocket = io("http://172.16.10.208:3001");
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const onFormSubmit: SubmitHandler<FormInputs> = data => {
        setUserName(data.username);
        setRoomId(data.roomId);

        if (socket) {
            socket.emit("join_room", data.roomId);
            setShowSpinner(true);
            setTimeout(() => {
                setShowChat(true);
                setShowSpinner(false);
            }, 4000);
        }
    };

    return (
        <div className="from-zinc-900 flex items-center justify-center h-screen bg-gradient-to-r to-zinc-950">
            <form
                onSubmit={handleSubmit(onFormSubmit)}
                className={`flex flex-col items-center bg-white rounded-lg p-6 shadow-lg gap-4 ${
                    showChat ? "hidden" : ""
                }`}
            >
                <h2 className="mb-4 text-gray-800 text-2xl font-semibold">
                    Join Chat Room
                </h2>
                <input
                    {...register('username', { required: true })}
                    className="p-2 w-60 border focus:border-blue-500 border-gray-300 rounded focus:outline-none"
                    type="text"
                    placeholder="Username"
                    disabled={isSubmitting || showSpinner}
                />
                <input
                    {...register('roomId', { required: true })}
                    className="p-2 w-60 border focus:border-blue-500 border-gray-300 rounded focus:outline-none"
                    type="text"
                    placeholder="Room ID"
                    disabled={isSubmitting || showSpinner}
                />
                <button
                    className="flex items-center justify-center w-60 h-10 text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {!isSubmitting ? "Join" : <div className="loading-spinner"></div>}
                </button>
            </form>
            {socket && socket.connected && (
                <Chat socket={socket} username={userName} roomId={roomId} />
            )}
        </div>
    );
}
