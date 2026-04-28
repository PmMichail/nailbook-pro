import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
export declare const getIo: () => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getSocketId: (userId: string) => string | undefined;
export declare const initSocket: (httpServer: HttpServer) => Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
//# sourceMappingURL=index.d.ts.map