import { useCallback, useEffect, useRef, useState } from 'react';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';
export function useWebSocket({ onMessage, onConnect, onDisconnect }) {
    const ws = useRef(null);
    const reconnectTimeout = useRef();
    const isConnecting = useRef(false);
    const [isConnected, setIsConnected] = useState(false);
    // Store callbacks in refs to avoid reconnection on callback changes
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    // Update refs when callbacks change
    useEffect(() => {
        onMessageRef.current = onMessage;
        onConnectRef.current = onConnect;
        onDisconnectRef.current = onDisconnect;
    }, [onMessage, onConnect, onDisconnect]);
    const connect = useCallback(() => {
        if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN)
            return;
        isConnecting.current = true;
        console.log('[WS] Connecting to:', WS_URL);
        ws.current = new WebSocket(WS_URL);
        ws.current.onopen = () => {
            isConnecting.current = false;
            setIsConnected(true);
            console.log('[WS] Connected successfully');
            onConnectRef.current?.();
        };
        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                onMessageRef.current?.(message);
            }
            catch (error) {
                console.error('[WS] Failed to parse message:', error);
            }
        };
        ws.current.onclose = () => {
            isConnecting.current = false;
            setIsConnected(false);
            console.log('[WS] Disconnected, reconnecting in 3s...');
            onDisconnectRef.current?.();
            reconnectTimeout.current = window.setTimeout(() => {
                connect();
            }, 3000);
        };
        ws.current.onerror = (error) => {
            isConnecting.current = false;
            console.error('[WS] WebSocket error:', error);
        };
    }, []);
    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [connect]);
    const subscribe = useCallback((message) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('[WS] Subscribing:', message);
            ws.current.send(JSON.stringify(message));
        }
        else {
            console.warn('[WS] Cannot subscribe - WebSocket not connected');
        }
    }, []);
    const unsubscribe = useCallback((message) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('[WS] Unsubscribing');
            ws.current.send(JSON.stringify(message));
        }
    }, []);
    return { subscribe, unsubscribe, isConnected };
}
