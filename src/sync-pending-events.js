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
exports.binarySearchValidBlock = exports.getTrueLatestBlockNumber = exports.getReliableBlockNumber = exports.withEventTracker = exports.EventTracker = void 0;
const provider_1 = require("./provider");
const dbhelper_1 = require("./dbhelper");
const provider_2 = require("./provider");
// TODO: replace any with real type
function getAbiEvents(abiJson) {
    let events = {};
    abiJson.forEach((t) => {
        if (t.type == "event") {
            events[t.name] = t;
        }
    });
    return events;
}
// TODO: replace any with real type
function buildEventValue(events, r) {
    // let event = events[r];
    let v = {};
    // event.inputs.forEach((i: any) => {
    //   v[i.name] = r.returnValues[i.name];
    // });
    return v;
}
/* Mongo Db helper to track all the recorded events handled so far */
class EventDBHelper extends dbhelper_1.DBHelper {
    getInfoCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.infoCollection) {
                this.infoCollection = yield this.getOrCreateEventCollection("MetaInfoCollection");
            }
            return this.infoCollection;
        });
    }
    getLastMonitorBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            let infoCollection = yield this.getInfoCollection();
            let rs = yield infoCollection.findOne({ name: "LastUpdatedBlock" });
            return rs === null ? 0 : rs.lastblock;
        });
    }
    updatelastCheckedBlockNumber(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            let infoCollection = yield this.getInfoCollection();
            yield infoCollection.updateOne({ name: "LastUpdatedBlock" }, { $set: { lastblock: blockNumber } }, { upsert: true });
        });
    }
    // TODO: replace any with real type
    updateLastMonitorBlock(r, v) {
        return __awaiter(this, void 0, void 0, function* () {
            let client = yield this.getClient();
            let eventCollection = yield this.getOrCreateEventCollection(r.eventName);
            let infoCollection = yield this.getInfoCollection();
            yield client.withSession((session) => __awaiter(this, void 0, void 0, function* () {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    yield infoCollection.updateOne({ name: "LastUpdatedBlock" }, { $set: { lastblock: r.blockNumber } }, { upsert: true });
                    yield eventCollection.insertOne({
                        blockNumber: r.blockNumber,
                        blockHash: r.blockHash,
                        transactionHash: r.transactionHash,
                        event: v,
                    });
                }));
            }));
        });
    }
}
class EventTracker {
    constructor(networkId, dataJson, providerUrl, monitorAccount, mongodbUrl, eventsSyncStep, eventSyncStartingPoint, bufferBlocks) {
        this.provider = new provider_1.DelphinusReadOnlyConnector(providerUrl);
        this.l1Events = getAbiEvents(dataJson.abi);
        this.contractAddress = dataJson.networks[networkId].address;
        this.contract = this.provider.getContractWithoutSigner(this.contractAddress, dataJson.abi);
        this.dbUrl = mongodbUrl;
        this.dbName = networkId + this.contractAddress;
        this.providerUrl = providerUrl;
        this.eventSyncStartingPoint = eventSyncStartingPoint;
        this.bufferBlocks = bufferBlocks;
        const defaultStep = 0;
        if (eventsSyncStep == undefined || eventsSyncStep <= 0) {
            this.eventsSyncStep = defaultStep;
        }
        else {
            this.eventsSyncStep = eventsSyncStep;
        }
    }
    syncPastEvents(handlers, db) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastCheckedBlockNumber = yield db.getLastMonitorBlock();
            if (lastCheckedBlockNumber < this.eventSyncStartingPoint) {
                lastCheckedBlockNumber = this.eventSyncStartingPoint;
                console.log("Chain Height Before Deployment: " + lastCheckedBlockNumber + " Is Used");
            }
            let latestBlockNumber = yield getLatestBlockNumberFromSource(this.providerUrl);
            let trueLatestBlockNumber = yield getTrueLatestBlockNumber(this.providerUrl, lastCheckedBlockNumber, latestBlockNumber);
            let reliableBlockNumber = yield getReliableBlockNumber(trueLatestBlockNumber, lastCheckedBlockNumber, this.bufferBlocks);
            console.log("sync from ", lastCheckedBlockNumber + 1);
            try {
                let pastEvents = yield this.contract.getPastEventsFromSteped(lastCheckedBlockNumber + 1, reliableBlockNumber, this.eventsSyncStep);
                console.log("sync from ", lastCheckedBlockNumber + 1, "done");
                for (let group of pastEvents.events) {
                    for (let r of group) {
                        console.log("========================= Get L1 Event: %s ========================", r);
                        console.log("blockNumber:", r.blockNumber);
                        console.log("blockHash:", r.blockHash);
                        console.log("transactionHash:", r.transactionHash);
                        let e = buildEventValue(this.l1Events, r);
                        // TODO: check what handlers is supposed to do
                        yield handlers(r.topics[0], e, r.transactionHash);
                        yield db.updateLastMonitorBlock(r, e);
                    }
                }
                if (pastEvents.breakpoint) {
                    yield db.updatelastCheckedBlockNumber(pastEvents.breakpoint);
                }
            }
            catch (err) {
                console.log("%s", err);
                throw err;
            }
        });
    }
    syncEvents(handlers) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, dbhelper_1.withDBHelper)(EventDBHelper, this.dbUrl, this.dbName, (dbhelper) => __awaiter(this, void 0, void 0, function* () {
                yield this.syncPastEvents(handlers, dbhelper);
            }));
        });
    }
    // For debug
    subscribePendingEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Check what the function is supposed to track
            let contract = this.provider.getContractWithoutSigner(this.contractAddress, this.l1Events);
            contract.subscribeEvent("*", (event) => {
                console.log(event);
            });
        });
    }
    resetEventsInfo(db) {
        return __awaiter(this, void 0, void 0, function* () {
            let infoCollection = yield db.getInfoCollection();
            yield infoCollection.deleteMany({ name: "LastUpdatedBlock" });
            // TODO: eventCollection should also be deleted?
            return true;
        });
    }
    resetEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, dbhelper_1.withDBHelper)(EventDBHelper, this.dbUrl, this.dbName, (dbhelper) => __awaiter(this, void 0, void 0, function* () {
                yield this.resetEventsInfo(dbhelper);
            }));
        });
    }
}
exports.EventTracker = EventTracker;
function withEventTracker(networkId, dataJson, source, monitorAccount, mongodbUrl, eventsSyncStep, eventSyncStartingPoint, bufferBlocks, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        let eventTracker = new EventTracker(networkId, dataJson, source, monitorAccount, mongodbUrl, eventsSyncStep, eventSyncStartingPoint, bufferBlocks);
        try {
            yield cb(eventTracker);
        }
        catch (e) {
            throw e;
        }
        finally {
            //await eventTracker.close();
        }
    });
}
exports.withEventTracker = withEventTracker;
function getReliableBlockNumber(trueLatestBlockNumber, lastCheckedBlockNumber, bufferBlocks) {
    return __awaiter(this, void 0, void 0, function* () {
        let latestBlockNumber = lastCheckedBlockNumber;
        if (trueLatestBlockNumber) {
            latestBlockNumber =
                trueLatestBlockNumber - bufferBlocks > 0
                    ? trueLatestBlockNumber - bufferBlocks
                    : lastCheckedBlockNumber;
        }
        return latestBlockNumber;
    });
}
exports.getReliableBlockNumber = getReliableBlockNumber;
function getLatestBlockNumberFromSource(providerUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let provider = (0, provider_2.GetBaseProvider)(providerUrl);
        try {
            return yield provider.getBlockNumber();
        }
        catch (e) {
            throw e;
        }
    });
}
function getTrueLatestBlockNumber(providerUrl, startPoint, endPoint) {
    return __awaiter(this, void 0, void 0, function* () {
        if (endPoint < startPoint) {
            console.log("ISSUE: LatestBlockNumber get from RpcSource is smaller than lastCheckedBlockNumber");
            return null;
        }
        let provider = (0, provider_2.GetBaseProvider)(providerUrl);
        let chekced = false;
        let blockNumberIssue = false;
        while (!chekced) {
            yield provider.getBlock(`${endPoint}`).then((block) => __awaiter(this, void 0, void 0, function* () {
                if (block == null) {
                    let [lowerBoundary, upperBoundary] = yield binarySearchValidBlock(providerUrl, startPoint, endPoint);
                    startPoint = lowerBoundary;
                    endPoint = upperBoundary;
                    blockNumberIssue = true;
                }
                else {
                    if (blockNumberIssue) {
                        console.log(`ISSUE: Cannot find actual blocks from block number: ${endPoint + 1}, the actual latestBlockNumber is: ${endPoint}`);
                    }
                    chekced = true;
                }
            }));
        }
        return endPoint;
    });
}
exports.getTrueLatestBlockNumber = getTrueLatestBlockNumber;
function binarySearchValidBlock(providerUrl, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        let provider = (0, provider_2.GetBaseProvider)(providerUrl);
        let mid = Math.floor((start + end) / 2);
        if (mid == start) {
            return [mid, mid];
        }
        yield provider.getBlock(`${mid}`).then((midblock) => {
            if (midblock != null) {
                start = mid;
            }
            else {
                end = mid;
            }
        });
        return [start, end];
    });
}
exports.binarySearchValidBlock = binarySearchValidBlock;
//# sourceMappingURL=sync-pending-events.js.map