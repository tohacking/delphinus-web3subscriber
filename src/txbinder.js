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
exports.TxBinder = void 0;
const ethers_1 = require("ethers");
class TxBinder {
    constructor() {
        this.actions = { bindings: {}, transactionMethods: {}, snapshot: {} };
    }
    // TODO: Allow binding the transaction to an action and executing later
    bind(name, txMethod) {
        // Bind a transaction method to an action name
        this.actions.transactionMethods[name] = txMethod;
        return this;
    }
    /**
     * Execute a transaction and handle the transactionHash, transactionReceipt and error event callbacks
     * @param name: the name of action
     * @param txMethod An ethers transaction method which returns a TransactionResponse
     * Overrides the txMethod passed to the bind() method
     * @returns
     */
    execute(name, txMethod, options) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            // If override tx method is provided, try to execute that instead
            try {
                let transaction = txMethod
                    ? txMethod
                    : this.actions.transactionMethods[name];
                const txResponse = yield transaction();
                // If the transactionHash event has been registered, call the associated callback
                (_b = (_a = this.actions.bindings[name]) === null || _a === void 0 ? void 0 : _a.transactionHash) === null || _b === void 0 ? void 0 : _b.call(_a, txResponse);
                // Wait for the transaction to be confirmed
                const receipt = yield txResponse.wait(options === null || options === void 0 ? void 0 : options.confirmations, options === null || options === void 0 ? void 0 : options.timeout);
                // If the confirmation event has been registered, call the associated callback
                (_d = (_c = this.actions.bindings[name]) === null || _c === void 0 ? void 0 : _c.transactionReceipt) === null || _d === void 0 ? void 0 : _d.call(_c, receipt);
                return receipt;
            }
            catch (error) {
                // If an error occurs, call the error callback
                (_f = (_e = this.actions.bindings[name]) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.call(_e, error);
                throw error;
            }
        });
    }
    /**
     * invoke callback registed via
     * p.register_snapshot("snapshot", name, callback);
     * @param name the name of snapshot
     */
    snapshot(name) {
        if (this.actions.snapshot[name] != undefined) {
            this.actions.snapshot[name]();
        }
    }
    // Register a callback to be called when the snapshot event is emitted
    /**
     *
     * @param name the name of snapshot
     * @param callback
     */
    register_snapshot(name, callback) {
        this.actions.snapshot[name] = callback;
    }
    /**
     *
     * @param name the name of action
     * @param event the name of the transaction event to bind to
     * @param callback the callback to be called when the event is emitted
     *
     *  This is overloaded based on the event parameter to provide type safety for the callback parameter
     */
    when(name, event, 
    //TODO: type should be inferred based on the event parameter, currently handled by overloads which is ok but not ideal
    callback) {
        if (!this.actions.bindings[name]) {
            this.actions.bindings[name] = {
                transactionHash: undefined,
                transactionReceipt: undefined,
                error: undefined,
            };
        }
        this.actions.bindings[name][event] = callback;
        return this;
    }
}
exports.TxBinder = TxBinder;
function ExampleBinder() {
    return __awaiter(this, void 0, void 0, function* () {
        // create a wallet and provider by supplying a private key and provider url
        let provider = new ethers_1.JsonRpcProvider("https://infura or alchemy url");
        let wallet = new ethers_1.Wallet("0x eth private key", provider);
        let contract = new ethers_1.Contract("0x contract address", [], wallet);
        const binder = new TxBinder();
        // Example of how to use the when method
        // Bind the transaction method to an action name
        binder.bind("Approve", () => {
            return contract.approve("0x1", 1);
        });
        // Bind some callbacks to the approve action using the when method
        binder
            .when("Approve", "transactionHash", (txResponse) => {
            console.log("transactionHash", txResponse);
        })
            .when("Approve", "transactionReceipt", (receipt) => {
            console.log("transactionReceipt", receipt);
        })
            .when("Approve", "error", (error) => {
            console.log("error", error);
        });
        // Bind some callbacks to the deposit action
        binder
            .when("Deposit", "transactionHash", (txResponse) => __awaiter(this, void 0, void 0, function* () {
            console.log("transactionHash", txResponse);
        }))
            .when("Deposit", "transactionReceipt", (receipt) => {
            console.log("transactionReceipt", receipt);
        })
            .when("Deposit", "error", (error) => {
            console.log("error", error);
        });
        // Override the previous provided transaction method in the bind() method
        yield binder.execute("approve", () => {
            // execute some transaction which returns a TransactionResponse
            return contract.approve("0x1", 1);
        });
        yield binder.execute("deposit", () => {
            return wallet.sendTransaction({
                to: "0x1",
                value: 1,
            });
        });
        // bind a callback to the snapshot event
        binder.register_snapshot("deposit", () => {
            console.log("deposit snapshot");
        });
        // execute the snapshot
        binder.snapshot("deposit");
    });
}
//# sourceMappingURL=txbinder.js.map