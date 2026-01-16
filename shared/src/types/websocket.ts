import { AggressiveAnalysis, CVDData, FootprintData, Kline, OrderBook, Trade } from './market';

export type Channel = 'trade' | 'kline' | 'depth' | 'footprint';

export interface SubscribeMessage {
  type: 'subscribe';
  symbol: string;
  channels: Channel[];
  interval?: string;
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
}

export type IncomingClientMessage = SubscribeMessage | UnsubscribeMessage;

export interface ConnectedMessage {
  type: 'connected';
  data: {
    message: string;
  };
}

export interface TradeMessage {
  type: 'trade';
  data: Trade;
}

export interface KlineMessage {
  type: 'kline';
  data: Kline;
}

export interface DepthMessage {
  type: 'depth';
  data: Partial<OrderBook>;
}

export interface FootprintMessage {
  type: 'footprint';
  data: {
    footprint: FootprintData;
    supportResistance: number[];
    aggressiveAnalysis: AggressiveAnalysis;
    cvd?: CVDData; // CVD verisi (opsiyonel)
  };
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

export type WebSocketMessage =
  | ConnectedMessage
  | TradeMessage
  | KlineMessage
  | DepthMessage
  | FootprintMessage
  | ErrorMessage;
