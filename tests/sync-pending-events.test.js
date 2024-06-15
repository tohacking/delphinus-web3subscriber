"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sync_pending_events_1 = require("../src/sync-pending-events");
const client_1 = require("../src/client");
let mockEvents = [
    {
        returnValues: {
            value: 0,
        },
        raw: {
            data: "0",
            topics: ["0"],
        },
        event: "0",
        signature: "0",
        logIndex: 0,
        transactionIndex: 0,
        transactionHash: "0",
        blockHash: "0",
        blockNumber: 0,
        address: "0",
    },
    {
        returnValues: {
            value: 1,
        },
        raw: {
            data: "1",
            topics: ["1"],
        },
        event: "1",
        signature: "1",
        logIndex: 1,
        transactionIndex: 1,
        transactionHash: "1",
        blockHash: "1",
        blockNumber: 1,
        address: "1",
    },
];
const mockGetEvents = jest.spyOn(client_1.DelphinusContract.prototype, "getPastEventsFromTo");
mockGetEvents.mockImplementation((start, end) => {
    let result = [];
    for (let i = start; i <= end; i++) {
        if (mockEvents[i]) {
            result.push(mockEvents[i]);
        }
    }
    return Promise.resolve(result);
});
let mockBlocks = ["1", "1", "1", "1", "1", "1", "1"]; //Latest ValidBlockNumber should be 6
// const addMock = jest.spyOn(getweb3, "getWeb3FromSource");
// addMock.mockReturnValue({
//   eth: {
//     getBlock: (index: string) => {
//       return Promise.resolve(mockBlocks[Number(index)]);
//     },
//   },
// });
describe("test functions in syncEvent works", () => {
    test("test binarySearchValidBlock function works case 1", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield (0, sync_pending_events_1.binarySearchValidBlock)("MockProvider", 2, 15).then((result) => {
            expect(result).toEqual([2, 8]);
        });
    }));
    test("test binarySearchValidBlock function works case 2", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield (0, sync_pending_events_1.binarySearchValidBlock)("MockProvider", 6, 100).then((result) => {
            expect(result).toEqual([6, 53]);
        });
    }));
    test("test getValidBlockNumber function works case 1", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield (0, sync_pending_events_1.getTrueLatestBlockNumber)("MockProvider", 5, 100).then((result) => {
            expect(result).toEqual(6);
        });
    }));
    test("test getValidBlockNumber function works case 2", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield (0, sync_pending_events_1.getTrueLatestBlockNumber)("MockProvider", 6, 100).then((result) => {
            expect(result).toEqual(6);
        });
    }));
    test("test getValidBlockNumber function works case 3", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield (0, sync_pending_events_1.getTrueLatestBlockNumber)("MockProvider", 2, 6).then((result) => {
            expect(result).toEqual(6);
        });
    }));
    test("test getPastEventsFromSteped function works case 1", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(0, 15, 1)
            .then((result) => {
            expect(result.breakpoint).toEqual(9);
            expect(result.events).toEqual([[mockEvents[0]], [mockEvents[1]]]);
        });
    }));
    test("test getPastEventsFromSteped function works case 2", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(1, 15, 1)
            .then((result) => {
            expect(result.breakpoint).toEqual(10);
            expect(result.events).toEqual([[mockEvents[1]]]);
        });
    }));
    test("test getPastEventsFromSteped function works case 3", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(0, 15, 2)
            .then((result) => {
            expect(result.breakpoint).toEqual(15);
            expect(result.events).toEqual([[mockEvents[0], mockEvents[1]]]);
        });
    }));
    test("test getPastEventsFromSteped function works case 4", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(0, 15, -2)
            .then((result) => {
            expect(result.breakpoint).toEqual(15);
            expect(result.events).toEqual([[mockEvents[0], mockEvents[1]]]);
        });
    }));
    test("test getPastEventsFromSteped function works case 5", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(0, 25, 2)
            .then((result) => {
            expect(result.breakpoint).toEqual(19);
            expect(result.events).toEqual([[mockEvents[0], mockEvents[1]]]);
        });
    }));
    test("test getPastEventsFromSteped function works case 6", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(10, 2, 1)
            .then((result) => {
            expect(result).toEqual({ events: [], breakpoint: null });
        });
    }));
    test("test getPastEventsFromSteped function works case 7", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(4, 4, 1)
            .then((result) => {
            expect(result.breakpoint).toEqual(4);
            expect(result.events).toEqual([]);
        });
    }));
    test("test getPastEventsFromSteped function works case 8", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(60000); //1 minute timeout
        yield client_1.DelphinusContract.prototype
            .getPastEventsFromSteped(1, 1, 1)
            .then((result) => {
            expect(result.breakpoint).toEqual(1);
            expect(result.events).toEqual([[mockEvents[1]]]);
        });
    }));
});
//# sourceMappingURL=sync-pending-events.test.js.map