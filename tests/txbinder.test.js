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
const ethers_1 = require("ethers");
const txbinder_1 = require("../src/txbinder");
const mockTransactionReceipt = {
    to: "0x123",
    from: "0x789",
    contractAddress: null,
    hash: "0xmockTransactionHash",
};
jest.mock("ethers", () => {
    const originalModule = jest.requireActual("ethers");
    // Mock the Wallet class as we don't want to send real transactions
    return Object.assign(Object.assign({}, originalModule), { Wallet: jest.fn().mockImplementation(() => ({
            sendTransaction: jest.fn(() => Promise.resolve({
                hash: "0xmockTransactionHash",
                wait: jest.fn(() => Promise.resolve(mockTransactionReceipt)),
            })),
        })) });
});
// Test TxBinder class
describe("TxBinder", () => {
    let txBinder;
    // Hardhat local node
    const provider = new ethers_1.JsonRpcProvider("http://127.0.0.1:8545");
    // Known private keys for hardhat testing
    const wallet_1 = new ethers_1.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const wallet_2 = new ethers_1.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    const mockAction = "mockAction";
    const errorAction = "errorAction";
    beforeEach(() => {
        txBinder = new txbinder_1.TxBinder();
        txBinder.bind(mockAction, () => {
            // Test transaction to send 1 wei from wallet_1 to wallet_2
            return wallet_1.sendTransaction({
                to: wallet_2.address,
                value: (0, ethers_1.parseEther)("1"), // 1 ether
            });
        });
        txBinder.bind(errorAction, () => __awaiter(void 0, void 0, void 0, function* () {
            // Test transaction to send 1 wei from wallet_1 to wallet_2
            return wallet_1.sendTransaction({
                to: wallet_2.address,
                value: (0, ethers_1.parseEther)("1"), // 1 ether
            });
        }));
    });
    describe("snapshot callbacks", () => {
        it("should call the callback registered with the snapshot name", () => {
            let callback = jest.fn();
            txBinder.register_snapshot("test", callback);
            txBinder.snapshot("test");
            expect(callback).toBeCalled();
        });
        it("should not call the callback registered with a different snapshot name", () => {
            let callback = jest.fn();
            txBinder.register_snapshot("test", callback);
            txBinder.snapshot("test2");
            expect(callback).not.toBeCalled();
        });
    });
    describe("when callbacks", () => {
        it("should call the callback registered with the transactionHash event", () => __awaiter(void 0, void 0, void 0, function* () {
            let callback = jest.fn();
            txBinder.when(mockAction, "transactionHash", callback);
            yield txBinder.execute(mockAction);
            expect(callback).toBeCalled();
        }));
        it("should call the callback registered with the transactionReceipt event", () => __awaiter(void 0, void 0, void 0, function* () {
            let callback = jest.fn();
            txBinder.when(mockAction, "transactionReceipt", callback);
            yield txBinder.execute(mockAction);
            expect(callback).toBeCalled();
        }));
        it("should call the callback registered with the error event", () => __awaiter(void 0, void 0, void 0, function* () {
            // Mock the sendTransaction function from ethers lib but throw an error
            // instead of returning a TransactionResponse
            wallet_1.sendTransaction.mockImplementationOnce(() => {
                throw new Error("Mock error");
            });
            let callback = jest.fn();
            txBinder.when(errorAction, "error", callback);
            try {
                yield txBinder.execute(errorAction);
            }
            catch (e) {
                expect(callback).toBeCalled();
            }
        }));
    });
});
//# sourceMappingURL=txbinder.test.js.map