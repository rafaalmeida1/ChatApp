import React, { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar } from "./ui/avatar";

interface IMsgDataTypes {
    roomId: string | number;
    user: string;
    msg: string;
    time: string;
}

interface ChatPageProps {
    socket: Socket;
    username: string;
    roomId: string;
}

export const Chat: React.FC<ChatPageProps> = ({ socket, username, roomId }) => {
    const [currentMsg, setCurrentMsg] = useState("");
    const [chat, setChat] = useState<IMsgDataTypes[]>([]);
    const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Pedir permissão para notificações
    useEffect(() => {
        Notification.requestPermission();
    }, []);

    const receiveMsg = (data: IMsgDataTypes) => {
        setChat((prev) => {
            if (
                prev.some(
                    (msg) => msg.time === data.time && msg.user === data.user
                )
            ) {
                return prev;
            }
            const updatedChat = [...prev, data];
            localStorage.setItem(
                `chat-${roomId}`,
                JSON.stringify(updatedChat)
            );

            // Verificar se a mensagem não é do usuário atual e enviar notificação
            if (data.user !== username && Notification.permission === "granted") {
                new Notification(`Nova mensagem de ${data.user}`, {
                    body: data.msg,
                });
            }

            return updatedChat;
        });
    };

    // Configurar ouvinte para mensagens recebidas
    useEffect(() => {
        socket.on("receive_msg", receiveMsg);

        // Limpar ouvinte ao desmontar
        return () => {
            socket.off("receive_msg", receiveMsg);
        };
    }, [socket, username]);

    useEffect(scrollToBottom, [chat]);

    const sendData = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMsg !== "") {
            const currentTime =
                new Date().toLocaleTimeString() + new Date().getMilliseconds();
            const msgData: IMsgDataTypes = {
                roomId,
                user: username,
                msg: currentMsg,
                time: currentTime,
            };
            socket.emit("send_msg", msgData);
            setChat((prev) => {
                const updatedChat = [...prev, msgData];
                localStorage.setItem(
                    `chat-${roomId}`,
                    JSON.stringify(updatedChat)
                );
                return updatedChat;
            });
            setCurrentMsg("");
        }
    };

    return (
        <Card className="md:w-[440px] w-screen bg-zinc-200 border-none">
            <CardHeader>
                <CardTitle>
                    Chat Room: <b>{roomId}</b>
                </CardTitle>
                <CardDescription>
                    Username: <b>{username}</b>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4 w-full">
                    {chat.map(({ user, msg, time }, key) => (
                        <div
                            key={key}
                            className={`flex items-start relative gap-2 mb-2 ${
                                user === username
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            {user !== username && (
                                <Avatar
                                    className={`rounded-full border border-gray-300 flex justify-center items-center h-8 w-8 bg-gray-200 text-black`}
                                >
                                    {user.charAt(0)}
                                </Avatar>
                            )}
                            <div
                                className={`max-w-xs p-2 flex flex-col rounded-lg ${
                                    user === username
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-black"
                                }`}
                            >
                                <span>{msg}</span>
                                <span
                                    className={`self-end mt-1 text-xs ${
                                        user === username
                                            ? "text-zinc-200"
                                            : "text-zinc-600"
                                    }`}
                                >
                                    {time.slice(0, 5)}
                                </span>
                            </div>
                            {user === username && (
                                <Avatar
                                    className={`rounded-full border border-gray-300 flex justify-center items-center h-8 w-8 bg-gray-200 text-black`}
                                >
                                    {user.charAt(0)}
                                </Avatar>
                            )}
                        </div>
                    ))}
                    <div ref={endOfMessagesRef} />
                </ScrollArea>
            </CardContent>
            <CardFooter>
                <form onSubmit={sendData} className="flex w-full gap-1">
                    <Input
                        type="text"
                        value={currentMsg}
                        placeholder="Digite sua mensagem.."
                        onChange={(e) => setCurrentMsg(e.target.value)}
                    />
                    <Button>
                        Enviar
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};
