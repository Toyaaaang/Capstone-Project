import { useEffect, useState } from "react";

const useWebSocket = (userId) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!userId) return;

        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}/`);

        ws.onopen = () => console.log("WebSocket Connected");
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("New Notification:", data);
            setMessages((prev) => [...prev, data]); // Append new notifications
        };
        ws.onclose = () => console.log("WebSocket Disconnected");

        setSocket(ws);

        return () => {
            if (ws) ws.close();
        };
    }, [userId]);

    return { socket, messages };
};

export default useWebSocket;
