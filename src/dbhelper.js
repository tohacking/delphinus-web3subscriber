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
exports.withDBHelper = exports.DBHelper = void 0;
const mongodb_1 = require("mongodb");
class DBHelper {
    constructor(url, n) {
        this.url = url;
        this.name = n;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield mongodb_1.MongoClient.connect(this.url);
            this.db = this.client.db(this.name);
        });
    }
    getDb() {
        if (this.db === undefined) {
            throw new Error("db was not initialized");
        }
        return this.db;
    }
    getClient() {
        if (this.client === undefined) {
            throw new Error("db was not initialized");
        }
        return this.client;
    }
    close() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.close());
        });
    }
    getOrCreateEventCollection(eventName, index) {
        return __awaiter(this, void 0, void 0, function* () {
            let db = this.getDb();
            let collections = yield db.listCollections({ name: eventName }).toArray();
            if (collections.length == 0) {
                console.log("Init collection: ", eventName);
                let c = yield db.createCollection(eventName);
                if (index !== undefined) {
                    c.createIndex(index, { unique: true });
                }
                return c;
            }
            else {
                return db.collection(eventName);
            }
        });
    }
}
exports.DBHelper = DBHelper;
function withDBHelper(Ctor, uri, n, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        let db = new Ctor(uri, n);
        try {
            yield db.connect();
        }
        catch (e) {
            console.log(e);
            console.log("failed to connect with db, DBHelper exiting...");
            throw e;
        }
        try {
            return yield cb(db);
        }
        finally {
            yield db.close();
        }
    });
}
exports.withDBHelper = withDBHelper;
//# sourceMappingURL=dbhelper.js.map